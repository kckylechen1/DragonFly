/**
 * 并行多角度推理
 * 从技术面/资金面/基本面/情绪面 4 个角度分析
 */

import { ENV } from "../env";

export interface ParallelAnalysisResult {
  technical: string; // 技术面
  capital: string; // 资金面
  fundamental: string; // 基本面
  sentiment: string; // 情绪面
  synthesis: string; // 综合
}

const PERSPECTIVE_PROMPTS = {
  technical: `
你是技术分析专家。请只从技术面分析：
- 均线系统
- MACD/KDJ/RSI 指标
- 形态和趋势
- 支撑阻力位

给出技术面结论和买卖点位。
`,
  capital: `
你是资金流向分析专家。请只从资金面分析：
- 主力资金动向
- 超大单/大单/中单/小单分解
- 资金与股价走势关系
- 主力意图判断

给出资金面结论。
`,
  fundamental: `
你是基本面分析专家。请只从基本面分析：
- 行业地位
- 核心逻辑
- 估值水平
- 成长性

给出基本面结论。
`,
  sentiment: `
你是市场情绪分析专家。请只从情绪面分析：
- 换手率和成交量
- 市场热度
- 板块联动
- 资金偏好

给出情绪面结论。
`,
};

async function analyzeFromPerspective(
  perspective: keyof typeof PERSPECTIVE_PROMPTS,
  stockData: string
): Promise<string> {
  if (!ENV.grokApiKey) {
    return "Grok API key not configured";
  }

  try {
    const response = await fetch(`${ENV.grokApiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.grokApiKey}`,
      },
      body: JSON.stringify({
        model: ENV.grokModel,
        messages: [
          { role: "system", content: PERSPECTIVE_PROMPTS[perspective] },
          { role: "user", content: stockData },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return `Grok API error: ${response.status} - ${errorText}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    return `Grok request error: ${error.message}`;
  }
}

export async function parallelAnalysis(
  stockCode: string,
  stockData: string
): Promise<ParallelAnalysisResult> {
  // 并行执行 4 个角度分析
  const [technical, capital, fundamental, sentiment] = await Promise.all([
    analyzeFromPerspective("technical", stockData),
    analyzeFromPerspective("capital", stockData),
    analyzeFromPerspective("fundamental", stockData),
    analyzeFromPerspective("sentiment", stockData),
  ]);

  const synthesisPrompt = `
你是综合分析师。请基于以下四个角度的分析，给出最终建议：

【技术面】
${technical}

【资金面】
${capital}

【基本面】
${fundamental}

【情绪面】
${sentiment}

请综合分析，给出最终结论和操作建议。
`;

  if (!ENV.grokApiKey) {
    return {
      technical,
      capital,
      fundamental,
      sentiment,
      synthesis: "Grok API key not configured",
    };
  }

  try {
    const synthesisResp = await fetch(`${ENV.grokApiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.grokApiKey}`,
      },
      body: JSON.stringify({
        model: ENV.grokModel,
        messages: [
          {
            role: "system",
            content: "你是资深A股操盘手，请综合分析给出最终建议。",
          },
          { role: "user", content: synthesisPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!synthesisResp.ok) {
      const errorText = await synthesisResp.text();
      return {
        technical,
        capital,
        fundamental,
        sentiment,
        synthesis: `Grok API error: ${synthesisResp.status} - ${errorText}`,
      };
    }

    const synthesisData = await synthesisResp.json();
    const synthesis = synthesisData.choices?.[0]?.message?.content || "";

    return {
      technical,
      capital,
      fundamental,
      sentiment,
      synthesis,
    };
  } catch (error: any) {
    return {
      technical,
      capital,
      fundamental,
      sentiment,
      synthesis: `Grok request error: ${error.message}`,
    };
  }
}
