/**
 * 测试 Grok 风格提示词效果
 * 将工具数据传给 LLM，让它按 Grok 的详细框架输出
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
- 成交额：[具体数值，注明单位]
- 换手率：[具体百分比]
- 量比：[具体数值]
- 近期走势描述（包括形态特征，如放量突破、回调调整等）

**均线系统（[多头/空头/排列情况]）**  
- MA5：[具体数值]（股价相对位置）
- MA10：[具体数值]（股价相对位置）
- MA20：[具体数值]（股价相对位置）
- 多空信号：[详细描述]
- 金叉/死叉信号：[详细描述]

**MACD指标（[金叉/死叉/信号]）**  
- MACD值：[具体数值]
- DIF：[具体数值]
- DEA：[具体数值]
- 柱状态：[红柱/绿柱，放大/缩小]
- 金叉/死叉信号：[详细描述]

**KDJ指标（[高位/低位/超买超卖]）**  
- K值：[具体数值]
- D值：[具体数值]
- J值：[具体数值]
- 超买超卖状态：[详细描述]

**RSI指标（[区域]）**  
- RSI(14)：[具体数值]
- 强弱判断：[详细描述]

**支撑位与阻力位**  
- S1支撑：[具体数值]（依据）
- S2支撑：[具体数值]（依据）
- R1阻力：[具体数值]（依据）
- R2阻力：[具体数值]（依据）

**综合技术走势总结**  
- **短期（日线）**：[详细判断]
- **中期（周线）**：[详细判断]
- **风险点**：[列出关键风险]
- **操作建议**：[具体建议，包括点位]

以上基于东方财富、AKShare等数据源，非投资建议，市场瞬变请以实时盘面为准。`;

async function runTest() {
    console.log("🧪 使用 Grok 风格提示词测试 Agent\n");
    console.log("=".repeat(70));

    const code = "600879"; // 航天电子
    const query = "按照技术分析框架分析一下航天电子";

    // 1. 先获取工具数据
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

    console.log(`✅ 技术分析数据获取成功`);
    console.log(`   股票: ${techResult.name}(${techResult.symbol})`);
    console.log(`   日期: ${techResult.date}`);
    console.log(`   价格: ${techResult.price}`);
    console.log(`   MA5=${techResult.ma5.toFixed(2)}, MA10=${techResult.ma10.toFixed(2)}, MA20=${techResult.ma20.toFixed(2)}`);
    console.log(`   MACD: DIF=${techResult.macdDif.toFixed(3)}, DEA=${techResult.macdDea.toFixed(3)}`);
    console.log(`   RSI: ${techResult.rsi.toFixed(2)}`);
    console.log(`   KDJ: K=${techResult.kdjK.toFixed(2)}, D=${techResult.kdjD.toFixed(2)}, J=${techResult.kdjJ.toFixed(2)}`);

    // 2. 构造带数据的提示词
    const dataContext = `
## 已获取的股票数据

### 基本行情 (来自东方财富)
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

### 止损位 (基于均线)
- 激进止损(MA5): ${techResult.stopLossAggressive.toFixed(2)}元
- 稳健止损(MA10): ${techResult.stopLossModerate.toFixed(2)}元
- 保守止损(MA20): ${techResult.stopLossConservative.toFixed(2)}元

### 资金流向 (来自东方财富)
${fundFlow ? `
- 主力净流入: ${(fundFlow.mainNetInflow / 100000000).toFixed(2)}亿
- 超大单: ${(fundFlow.superLargeNetInflow / 100000000).toFixed(2)}亿
- 大单: ${(fundFlow.largeNetInflow / 100000000).toFixed(2)}亿
- 中单: ${(fundFlow.mediumNetInflow / 100000000).toFixed(2)}亿
- 小单: ${(fundFlow.smallNetInflow / 100000000).toFixed(2)}亿
` : "资金流向数据不可用"}
`;

    console.log("\n" + "=".repeat(70));
    console.log("\n📊 测试: GLM-4.7 + Grok风格提示词 + 完整数据");
    console.log("-".repeat(70));

    const startTime = Date.now();

    try {
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
                    { role: "user", content: `${query}\n\n${dataContext}` },
                ],
                temperature: 0.7,
                max_tokens: 4000,
            }),
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";

        console.log(`⏱️ 耗时: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log(`📝 长度: ${content.length} 字符`);
        console.log(`🔢 Tokens: ${data.usage?.total_tokens || "N/A"}`);
        console.log("\n📄 回答:");
        console.log("-".repeat(70));
        console.log(content);
    } catch (error: any) {
        console.log(`❌ 测试失败: ${error.message}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ 测试完成");
}

runTest().catch(console.error);
