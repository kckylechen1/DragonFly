/**
 * 多模型共识分析
 * 用于关键交易决策，提升准确率
 */

import { ENV } from "../env";

export interface ConsensusResult {
  recommendation: string;
  confidence: number; // 0-1
  method: "unanimous" | "majority" | "arbitration";
  models: {
    grok: { conclusion: string; reasoning: string };
    glm: { conclusion: string; reasoning: string };
    qwen: { conclusion: string; reasoning: string };
  };
  arbitration?: string;
}

async function callModel(
  model: "grok" | "glm" | "qwen",
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const configs = {
    grok: { url: ENV.grokApiUrl, key: ENV.grokApiKey, model: ENV.grokModel },
    glm: { url: ENV.glmApiUrl, key: ENV.glmApiKey, model: ENV.glmModel },
    qwen: {
      url: ENV.forgeApiUrl,
      key: ENV.forgeApiKey,
      model: "Qwen/Qwen3-32B",
    },
  };

  const config = configs[model];
  if (!config.key) return `${model} API key not configured`;

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
      return `${model} API error: ${response.status} - ${errorText}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    return `${model} request error: ${error.message}`;
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
  conclusions: { model: string; conclusion: string }[]
): { recommendation: string; confidence: number } {
  const weights = {
    grok: 1.5,
    glm: 1.0,
    qwen: 0.8,
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
  const [grokResp, glmResp, qwenResp] = await Promise.all([
    callModel("grok", systemPrompt, userMessage),
    callModel("glm", systemPrompt, userMessage),
    callModel("qwen", systemPrompt, userMessage),
  ]);

  // 提取结论
  const grokConc = extractConclusion(grokResp);
  const glmConc = extractConclusion(glmResp);
  const qwenConc = extractConclusion(qwenResp);

  const conclusions = [
    { model: "grok", conclusion: grokConc },
    { model: "glm", conclusion: glmConc },
    { model: "qwen", conclusion: qwenConc },
  ];

  const models = {
    grok: { conclusion: grokConc, reasoning: grokResp.slice(0, 500) },
    glm: { conclusion: glmConc, reasoning: glmResp.slice(0, 500) },
    qwen: { conclusion: qwenConc, reasoning: qwenResp.slice(0, 500) },
  };

  const allSame = grokConc === glmConc && glmConc === qwenConc;
  if (allSame) {
    return {
      recommendation: grokConc,
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
- Grok: ${grokConc}
- GLM: ${glmConc}
- Qwen: ${qwenConc}

请综合分析，给出最终建议。结论必须是：买入/卖出/持有/观望/止损/止盈/加仓/减仓 之一。
`;

  const arbitration = await callModel("grok", "你是仲裁者。", arbitrationPrompt);

  return {
    recommendation: extractConclusion(arbitration),
    confidence: 0.5,
    method: "arbitration",
    models,
    arbitration,
  };
}
