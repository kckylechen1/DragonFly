/**
 * GLM vs Grok API 对比测试
 * 使用相同的数据和提示词，对比两个模型的输出质量
 */

import { ENV } from "../_core/env";
import { analyzeStock } from "../_core/technicalAnalysis";
import * as eastmoney from "../eastmoney";
import * as fundflow from "../fundflow";

// Grok 风格的技术分析系统提示词
const GROK_STYLE_PROMPT = `你是一个专业的A股技术分析助手，擅长用结构化、客观的方式输出个股技术走势分析。

**必须严格按照以下固定框架输出，不要改变顺序，不要遗漏任何部分：**

### [股票名称]（[代码]）技术分析细节（截至[最新交易日]收盘）

**最新行情回顾**  
- 收盘价：[具体数值]
- 涨跌：[具体数值和百分比]
- 成交量：[具体数值，注明单位]
- 换手率：[具体百分比]
- 量比：[具体数值]
- 近期走势描述

**均线系统（[多头/空头/排列情况]）**  
- MA5/MA10/MA20 具体数值和股价相对位置
- 多空信号和金叉/死叉信号

**MACD指标**  
- DIF/DEA/MACD柱具体数值
- 柱状态和金叉/死叉信号

**KDJ指标**  
- K/D/J 具体数值
- 超买超卖状态

**RSI指标**  
- RSI(14) 具体数值
- 强弱判断

**资金面分析**
- 主力净流入具体数值
- 超大单/大单/中单/小单分解
- 资金面判断

**支撑位与阻力位**  
- S1/S2支撑位（具体数值和依据）
- R1/R2阻力位（具体数值和依据）

**综合技术走势总结**  
- 短期（日线）判断
- 中期（周线）判断
- 风险点
- 操作建议（包括入场价/止损价/目标价）`;

async function runComparison() {
    console.log("🧪 GLM vs Grok API 对比测试\n");
    console.log("=".repeat(70));

    const code = "600879"; // 航天电子
    const query = "按照技术分析框架分析一下航天电子";

    // 1. 获取工具数据
    console.log("\n📊 获取工具数据...");

    const [techResult, quote, fundFlow] = await Promise.all([
        analyzeStock(code),
        eastmoney.getStockQuote(code),
        fundflow.getStockFundFlow(code),
    ]);

    if (!techResult) {
        console.log("❌ 技术分析数据获取失败");
        return;
    }

    console.log(`✅ 数据获取成功: ${techResult.name}(${techResult.symbol}) ${techResult.date}`);

    // 2. 构造带数据的提示词
    const dataContext = `
## 已获取的股票数据

### 基本行情
- 股票: ${techResult.name}(${code})
- 日期: ${techResult.date}
- 收盘价: ${techResult.price.toFixed(2)}元
- 涨跌幅: ${techResult.changePct >= 0 ? "+" : ""}${techResult.changePct.toFixed(2)}%
- 成交量: ${quote?.volume ? (quote.volume / 10000).toFixed(0) + "万手" : "N/A"}
- 成交额: ${quote?.amount ? (quote.amount / 100000000).toFixed(2) + "亿" : "N/A"}
- 换手率: ${quote?.turnoverRate ? quote.turnoverRate.toFixed(2) + "%" : "N/A"}
- 量比: ${techResult.volRatio.toFixed(2)}

### 均线系统
- MA5: ${techResult.ma5.toFixed(2)}元 ${techResult.priceAboveMa5 ? "(股价在上)" : "(股价在下)"}
- MA10: ${techResult.ma10.toFixed(2)}元 ${techResult.priceAboveMa10 ? "(股价在上)" : "(股价在下)"}
- MA20: ${techResult.ma20.toFixed(2)}元
- 排列: ${techResult.isMaBullish ? "多头排列" : "非多头排列"}

### MACD指标
- DIF: ${techResult.macdDif.toFixed(4)}
- DEA: ${techResult.macdDea.toFixed(4)}
- MACD柱: ${techResult.macdHistogram.toFixed(4)} (${techResult.macdIsRed ? "红柱" : "绿柱"}${techResult.macdExpanding ? "放大" : "缩小"})
- 金叉/死叉: ${techResult.macdCross === "golden" ? "金叉" : techResult.macdCross === "dead" ? "死叉" : "无"}

### KDJ指标
- K值: ${techResult.kdjK.toFixed(2)}
- D值: ${techResult.kdjD.toFixed(2)}
- J值: ${techResult.kdjJ.toFixed(2)}
- 金叉/死叉: ${techResult.kdjCross === "golden" ? "金叉" : techResult.kdjCross === "dead" ? "死叉" : "无"}

### RSI指标
- RSI(14): ${techResult.rsi.toFixed(2)}
- 状态: ${techResult.rsiZone === "overbought" ? "超买" : techResult.rsiZone === "oversold" ? "超卖" : "正常"}

### 成交量
- 量比: ${techResult.volRatio.toFixed(2)}
- 状态: ${techResult.volStatus === "expand" ? "放量" : techResult.volStatus === "shrink" ? "缩量" : "正常"}

### 止损位
- 激进止损(MA5): ${techResult.stopLossAggressive.toFixed(2)}元
- 稳健止损(MA10): ${techResult.stopLossModerate.toFixed(2)}元
- 保守止损(MA20): ${techResult.stopLossConservative.toFixed(2)}元

### 资金流向
${fundFlow ? `
- 主力净流入: ${(fundFlow.mainNetInflow / 100000000).toFixed(2)}亿
- 超大单: ${(fundFlow.superLargeNetInflow / 100000000).toFixed(2)}亿
- 大单: ${(fundFlow.largeNetInflow / 100000000).toFixed(2)}亿
- 中单: ${(fundFlow.mediumNetInflow / 100000000).toFixed(2)}亿
- 小单: ${(fundFlow.smallNetInflow / 100000000).toFixed(2)}亿
` : "资金流向数据不可用"}
`;

    const userMessage = `${query}\n\n${dataContext}`;

    // ========== 测试 1: GLM ==========
    console.log("\n" + "=".repeat(70));
    console.log("\n🔵 测试 1: GLM-4.7");
    console.log("-".repeat(70));

    let glmResult = "";
    let glmDuration = 0;
    let glmTokens = 0;

    try {
        const startTime = Date.now();
        const response = await fetch(`${ENV.glmApiUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${ENV.glmApiKey}`,
            },
            body: JSON.stringify({
                model: ENV.glmModel || "glm-4.7",
                messages: [
                    { role: "system", content: GROK_STYLE_PROMPT },
                    { role: "user", content: userMessage },
                ],
                temperature: 0.7,
                max_tokens: 4000,
            }),
        });

        const data = await response.json();
        glmResult = data.choices?.[0]?.message?.content || "";
        glmDuration = Date.now() - startTime;
        glmTokens = data.usage?.total_tokens || 0;

        console.log(`⏱️ 耗时: ${(glmDuration / 1000).toFixed(2)}s`);
        console.log(`📝 长度: ${glmResult.length} 字符`);
        console.log(`🔢 Tokens: ${glmTokens}`);
        console.log("\n📄 GLM 回答：");
        console.log("-".repeat(50));
        console.log(glmResult);
    } catch (error: any) {
        console.log(`❌ GLM 测试失败: ${error.message}`);
    }

    // ========== 测试 2: Grok ==========
    console.log("\n" + "=".repeat(70));
    console.log("\n🟣 测试 2: Grok (xAI)");
    console.log("-".repeat(70));

    let grokResult = "";
    let grokDuration = 0;
    let grokTokens = 0;

    if (!ENV.grokApiKey) {
        console.log("❌ GROK_API_KEY 未配置");
    } else {
        try {
            const startTime = Date.now();
            const response = await fetch(`${ENV.grokApiUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${ENV.grokApiKey}`,
                },
                body: JSON.stringify({
                    model: ENV.grokModel || "grok-3-fast",
                    messages: [
                        { role: "system", content: GROK_STYLE_PROMPT },
                        { role: "user", content: userMessage },
                    ],
                    temperature: 0.7,
                    max_tokens: 4000,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                console.log(`❌ Grok API Error: ${response.status} - ${error}`);
            } else {
                const data = await response.json();
                grokResult = data.choices?.[0]?.message?.content || "";
                grokDuration = Date.now() - startTime;
                grokTokens = data.usage?.total_tokens || 0;

                console.log(`⏱️ 耗时: ${(grokDuration / 1000).toFixed(2)}s`);
                console.log(`📝 长度: ${grokResult.length} 字符`);
                console.log(`🔢 Tokens: ${grokTokens}`);
                console.log("\n📄 Grok 回答：");
                console.log("-".repeat(50));
                console.log(grokResult);
            }
        } catch (error: any) {
            console.log(`❌ Grok 测试失败: ${error.message}`);
        }
    }

    // ========== 对比总结 ==========
    console.log("\n" + "=".repeat(70));
    console.log("\n📊 对比总结");
    console.log("-".repeat(70));
    console.log(`
| 指标 | GLM-4.7 | Grok |
|------|---------|------|
| 耗时 | ${(glmDuration / 1000).toFixed(2)}s | ${(grokDuration / 1000).toFixed(2)}s |
| 长度 | ${glmResult.length} 字符 | ${grokResult.length} 字符 |
| Tokens | ${glmTokens} | ${grokTokens} |
`);

    console.log("=".repeat(70));
    console.log("✅ 测试完成");
}

runComparison().catch(console.error);
