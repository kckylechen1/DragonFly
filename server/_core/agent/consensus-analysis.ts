/**
 * 多模型共识分析
 * 用于关键交易决策，提升准确率
 */

import { ENV } from "../env";
import type { ModelId } from "./types";

export interface ConsensusResult {
  recommendation: string;
  confidence: number; // 0-1
  method: "unanimous" | "majority" | "arbitration" | "insufficient";
  models: {
    grok: { conclusion: string; reasoning: string };
    glm: { conclusion: string; reasoning: string };
    deepseek: { conclusion: string; reasoning: string };
  };
  arbitration?: string;
}

type ModelCallResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

async function callModel(
  model: ModelId,
  systemPrompt: string,
  userMessage: string
): Promise<ModelCallResult> {
  const configs = {
    grok: { url: ENV.grokApiUrl, key: ENV.grokApiKey, model: ENV.grokModel },
    glm: { url: ENV.glmApiUrl, key: ENV.glmApiKey, model: ENV.glmModel },
    deepseek: {
      url: ENV.forgeApiUrl,
      key: ENV.forgeApiKey,
      model: "deepseek-ai/DeepSeek-V3",
    },
  };

  const config = configs[model];
  if (!config.key) {
    return { ok: false, error: `${model} API key not configured` };
  }

  try {
    const response = await fetch(`${config.url}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        error: `${model} API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return { ok: true, content: data.choices?.[0]?.message?.content || "" };
  } catch (error: any) {
    return { ok: false, error: `${model} request error: ${error.message}` };
  }
}

function extractConclusion(response: string): string {
  // 提取结论：买入/卖出/持有/止损 等
  const patterns = [
    /(?:建议|结论|操作)[：:]\s*(买入|卖出|持有|观望|止损|止盈|加仓|减仓)/,
    /(买入|卖出|持有|观望|止损|止盈|加仓|减仓)/,
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) return match[1];
  }

  return "无明确结论";
}

function calculateWeightedAgreement(
  conclusions: { model: ModelId; conclusion: string }[]
): { recommendation: string; confidence: number } {
  const weights = {
    grok: 1.5,
    glm: 1.0,
    deepseek: 1.2, // DeepSeek-V3 权重提升
  };

  const votes = new Map<string, number>();

  for (const { model, conclusion } of conclusions) {
    const weight = weights[model as keyof typeof weights] || 1.0;
    votes.set(conclusion, (votes.get(conclusion) || 0) + weight);
  }

  const sorted = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  const totalWeight = [...votes.values()].reduce((a, b) => a + b, 0);

  return {
    recommendation: sorted[0][0],
    confidence: totalWeight ? sorted[0][1] / totalWeight : 0,
  };
}

function buildModelView(result: ModelCallResult): {
  conclusion: string;
  reasoning: string;
} {
  if (result.ok) {
    return {
      conclusion: extractConclusion(result.content),
      reasoning: result.content.slice(0, 500),
    };
  }
  return {
    conclusion: "无明确结论",
    reasoning: result.error,
  };
}

export async function consensusAnalysis(
  query: string,
  stockCode: string,
  dataContext: string
): Promise<ConsensusResult> {
  const systemPrompt = `
你是专业A股分析师。请基于提供的数据分析，给出明确的交易建议。
结论必须是以下之一：买入、卖出、持有、观望、止损、止盈、加仓、减仓

先给结论，再说理由。
`;

  const userMessage = `股票代码：${stockCode}\n\n${dataContext}\n\n${query}`;

  // 并行调用 3 个模型
  const [grokResult, glmResult, deepseekResult] = await Promise.all([
    callModel("grok", systemPrompt, userMessage),
    callModel("glm", systemPrompt, userMessage),
    callModel("deepseek", systemPrompt, userMessage),
  ]);

  const models = {
    grok: buildModelView(grokResult),
    glm: buildModelView(glmResult),
    deepseek: buildModelView(deepseekResult),
  };

  const validResults = [
    { model: "grok" as const, result: grokResult },
    { model: "glm" as const, result: glmResult },
    { model: "deepseek" as const, result: deepseekResult },
  ].filter(
    (entry): entry is { model: ModelId; result: { ok: true; content: string } } =>
      entry.result.ok
  );

  if (validResults.length < 2) {
    return {
      recommendation: "数据不足",
      confidence: 0,
      method: "insufficient",
      models,
    };
  }

  const conclusions = validResults.map(entry => ({
    model: entry.model,
    conclusion: extractConclusion(entry.result.content),
  }));

  const allSame = conclusions.every(
    entry => entry.conclusion === conclusions[0]?.conclusion
  );
  if (allSame && conclusions[0]) {
    return {
      recommendation: conclusions[0].conclusion,
      confidence: 1.0,
      method: "unanimous",
      models,
    };
  }

  const weighted = calculateWeightedAgreement(conclusions);

  if (weighted.confidence >= 0.67) {
    return {
      recommendation: weighted.recommendation,
      confidence: weighted.confidence,
      method: "majority",
      models,
    };
  }

  // 完全分歧 → 仲裁
  const arbitrationPrompt = `
三个 AI 对 ${stockCode} 有不同看法：
- Grok: ${models.grok.conclusion}
- GLM: ${models.glm.conclusion}
- DeepSeek: ${models.deepseek.conclusion}

请综合分析，给出最终建议。结论必须是：买入/卖出/持有/观望/止损/止盈/加仓/减仓 之一。
`;

  const arbitrationResult = await callModel(
    "grok",
    "你是仲裁者。",
    arbitrationPrompt
  );
  const arbitrationText = arbitrationResult.ok
    ? arbitrationResult.content
    : arbitrationResult.error;

  return {
    recommendation: arbitrationResult.ok
      ? extractConclusion(arbitrationText)
      : weighted.recommendation,
    confidence: arbitrationResult.ok ? 0.5 : weighted.confidence,
    method: "arbitration",
    models,
    arbitration: arbitrationText,
  };
}
