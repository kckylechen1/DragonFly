/**
 * Grok vs GLM 性能基准测试
 * 对比速度、输出质量、风险识别能力
 */

import { ENV } from "../_core/env";
import { analyzeStock } from "../_core/technicalAnalysis";
import * as eastmoney from "../eastmoney";
import * as fundflow from "../fundflow";

interface BenchmarkResult {
  model: string;
  latency: number;
  outputLength: number;
  tokens: number;
  hasRiskWarning: boolean;
  hasActionableAdvice: boolean;
  conclusion: string;
}

async function runBenchmark(
  model: "grok" | "glm",
  stockCode: string,
  dataContext: string
): Promise<BenchmarkResult> {
  const configs = {
    grok: { url: ENV.grokApiUrl, key: ENV.grokApiKey, model: ENV.grokModel },
    glm: { url: ENV.glmApiUrl, key: ENV.glmApiKey, model: ENV.glmModel },
  };

  const config = configs[model];
  if (!config.key) {
    return {
      model,
      latency: 0,
      outputLength: 0,
      tokens: 0,
      hasRiskWarning: false,
      hasActionableAdvice: false,
      conclusion: `${model} API key not configured`,
    };
  }

  const startTime = Date.now();

  const response = await fetch(`${config.url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.key}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "你是专业A股技术分析师。请简洁输出结论、理由和具体点位。",
        },
        { role: "user", content: `分析以下股票：\n${dataContext}` },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const latency = Date.now() - startTime;

  return {
    model,
    latency,
    outputLength: content.length,
    tokens: data.usage?.total_tokens || 0,
    hasRiskWarning: /风险|超买|警惕|回调|止损/.test(content),
    hasActionableAdvice: /入场|止损|目标|点位|建议.*\d+/.test(content),
    conclusion: content.slice(0, 200),
  };
}

async function main() {
  const testCases = ["600879", "000066", "300308"];

  console.log("🧪 Grok vs GLM 性能基准测试\n");
  console.log("=".repeat(70));

  for (const code of testCases) {
    console.log(`\n📊 测试股票: ${code}`);
    console.log("-".repeat(70));

    // 获取数据
    const [tech, quote, fundFlow] = await Promise.all([
      analyzeStock(code),
      eastmoney.getStockQuote(code),
      fundflow.getStockFundFlow(code),
    ]);

    if (!tech) {
      console.log(`❌ 数据获取失败: ${code}`);
      continue;
    }

    const dataContext = `
股票: ${tech.name}(${code})
收盘: ${tech.price}元, ${tech.changePct}%
MA5: ${tech.ma5}, MA10: ${tech.ma10}, MA20: ${tech.ma20}
MACD: ${tech.macdIsRed ? "红柱" : "绿柱"}
RSI: ${tech.rsi}
资金: 主力${fundFlow?.mainNetInflow ? (fundFlow.mainNetInflow / 100000000).toFixed(2) : "N/A"}亿
`;

    // 并行测试
    const [grokResult, glmResult] = await Promise.all([
      runBenchmark("grok", code, dataContext),
      runBenchmark("glm", code, dataContext),
    ]);

    // 输出对比
    console.log(`
| 指标 | Grok | GLM | 胜者 |
|------|------|-----|------|
| 耗时 | ${(grokResult.latency / 1000).toFixed(1)}s | ${(glmResult.latency / 1000).toFixed(1)}s | ${grokResult.latency < glmResult.latency ? "🏆 Grok" : "🏆 GLM"} |
| 长度 | ${grokResult.outputLength}字 | ${glmResult.outputLength}字 | - |
| Tokens | ${grokResult.tokens} | ${glmResult.tokens} | ${grokResult.tokens < glmResult.tokens ? "🏆 Grok" : "🏆 GLM"} |
| 风险提示 | ${grokResult.hasRiskWarning ? "✅" : "❌"} | ${glmResult.hasRiskWarning ? "✅" : "❌"} | - |
| 可执行建议 | ${grokResult.hasActionableAdvice ? "✅" : "❌"} | ${glmResult.hasActionableAdvice ? "✅" : "❌"} | - |
`);
  }

  console.log("=".repeat(70));
  console.log("✅ 基准测试完成");
}

main().catch(console.error);
