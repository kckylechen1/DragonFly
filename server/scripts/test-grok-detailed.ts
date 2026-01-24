/**
 * 测试 Grok 详细输出
 * 修改提示词让 Grok 输出更详细
 */

import { ENV } from "../_core/env";
import { analyzeStock } from "../_core/technicalAnalysis";
import * as eastmoney from "../eastmoney";
import * as fundflow from "../fundflow";

// 详细版提示词 - 要求详细阐述
const DETAILED_PROMPT = `你是一个专业的A股技术分析助手。

## 重要要求
1. **详细阐述**：每个指标都要详细解释含义、当前状态、以及对后市的影响
2. **不要省略**：所有指标都要给出具体数值，并解释这个数值意味着什么
3. **逻辑链条**：分析要有因果关系，从数据推导出结论
4. **字数要求**：输出至少 1500 字，确保分析详尽

## 输出框架

### [股票名称]（[代码]）技术分析报告

**一、最新行情回顾**
- 详细描述今日走势
- 分析成交量变化的含义
- 对比前几日的走势特征

**二、均线系统分析**
- 各档均线具体数值
- 均线排列情况及其含义
- 金叉/死叉信号分析
- 股价与均线的偏离程度分析

**三、MACD 指标深度解读**
- DIF、DEA、MACD柱的具体数值
- 红绿柱的趋势（放大/缩小）
- 金叉/死叉信号及其强度
- 与股价走势是否背离

**四、KDJ 指标分析**
- K、D、J 具体数值
- 超买超卖状态
- 钝化风险分析
- 金叉/死叉信号

**五、RSI 指标分析**
- RSI(14) 具体数值
- 当前所处区域
- 超买超卖风险

**六、资金面深度分析**
- 主力资金动向
- 各档资金分解（超大单/大单/中单/小单）
- 资金与股价走势的关系
- 主力意图分析

**七、支撑位与阻力位**
- 多档支撑位及其依据
- 多档阻力位及其依据
- 关键点位的突破意义

**八、综合技术研判**
- 短期（日线）趋势判断
- 中期（周线）趋势判断
- 主要风险点列举
- 详细操作建议（分场景）

**九、操作策略（重点！）**
- 持仓者策略
- 空仓者策略
- 具体入场价位
- 止损价位及原因
- 目标价位及原因
- 仓位建议`;

async function runTest() {
    console.log("🧪 测试 Grok 详细输出\n");
    console.log("=".repeat(70));

    const code = "000066";

    // 获取数据
    console.log("\n📊 获取股票数据...");

    const [techResult, quote, fundFlow] = await Promise.all([
        analyzeStock(code),
        eastmoney.getStockQuote(code),
        fundflow.getStockFundFlow(code),
    ]);

    if (!techResult) {
        console.log("❌ 数据获取失败");
        return;
    }

    console.log(`✅ 数据获取成功: ${techResult.name}(${code})`);

    // 构造数据上下文
    const dataContext = `
## 股票数据: ${techResult.name}(${code})

**行情数据**
- 日期: ${techResult.date}
- 收盘价: ${techResult.price.toFixed(2)}元
- 涨跌幅: ${techResult.changePct >= 0 ? "+" : ""}${techResult.changePct.toFixed(2)}%
- 成交量: ${quote?.volume ? (quote.volume / 10000).toFixed(0) + "万手" : "N/A"}
- 成交额: ${quote?.amount ? (quote.amount / 100000000).toFixed(2) + "亿" : "N/A"}
- 换手率: ${quote?.turnoverRate?.toFixed(2) || "N/A"}%
- 量比: ${techResult.volRatio.toFixed(2)}

**均线系统**
- MA5: ${techResult.ma5.toFixed(2)}元 ${techResult.priceAboveMa5 ? "(股价在上)" : "(股价在下)"}
- MA10: ${techResult.ma10.toFixed(2)}元 ${techResult.priceAboveMa10 ? "(股价在上)" : "(股价在下)"}
- MA20: ${techResult.ma20.toFixed(2)}元
- 排列: ${techResult.isMaBullish ? "多头排列" : "非多头排列"}

**MACD**
- DIF: ${techResult.macdDif.toFixed(4)}
- DEA: ${techResult.macdDea.toFixed(4)}
- MACD柱: ${techResult.macdHistogram.toFixed(4)} (${techResult.macdIsRed ? "红柱" : "绿柱"}${techResult.macdExpanding ? "放大" : "缩小"})
- 金叉/死叉: ${techResult.macdCross === "golden" ? "金叉" : techResult.macdCross === "dead" ? "死叉" : "无"}

**KDJ**
- K: ${techResult.kdjK.toFixed(2)}
- D: ${techResult.kdjD.toFixed(2)}
- J: ${techResult.kdjJ.toFixed(2)}
- 金叉/死叉: ${techResult.kdjCross === "golden" ? "金叉" : techResult.kdjCross === "dead" ? "死叉" : "无"}

**RSI**
- RSI(14): ${techResult.rsi.toFixed(2)}
- 状态: ${techResult.rsiZone === "overbought" ? "超买" : techResult.rsiZone === "oversold" ? "超卖" : "正常"}

**成交量**
- 量比: ${techResult.volRatio.toFixed(2)}
- 状态: ${techResult.volStatus === "expand" ? "放量" : techResult.volStatus === "shrink" ? "缩量" : "正常"}

**止损位**
- 激进(MA5): ${techResult.stopLossAggressive.toFixed(2)}元
- 稳健(MA10): ${techResult.stopLossModerate.toFixed(2)}元
- 保守(MA20): ${techResult.stopLossConservative.toFixed(2)}元

**资金流向**
${fundFlow ? `
- 主力净流入: ${(fundFlow.mainNetInflow / 100000000).toFixed(2)}亿
- 超大单: ${(fundFlow.superLargeNetInflow / 100000000).toFixed(2)}亿
- 大单: ${(fundFlow.largeNetInflow / 100000000).toFixed(2)}亿
- 中单: ${(fundFlow.mediumNetInflow / 100000000).toFixed(2)}亿
- 小单: ${(fundFlow.smallNetInflow / 100000000).toFixed(2)}亿
` : "资金流向数据不可用"}
`;

    const userMessage = `请基于以下数据，详细分析中国长城：\n\n${dataContext}`;

    console.log("\n" + "=".repeat(70));
    console.log("\n🟣 Grok 详细分析测试");
    console.log("-".repeat(70));

    const startTime = Date.now();

    try {
        const response = await fetch(`${ENV.grokApiUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${ENV.grokApiKey}`,
            },
            body: JSON.stringify({
                model: ENV.grokModel || "grok-3-fast",
                messages: [
                    { role: "system", content: DETAILED_PROMPT },
                    { role: "user", content: userMessage },
                ],
                temperature: 0.7,
                max_tokens: 8000,  // 增加 token 上限
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.log(`❌ API Error: ${response.status} - ${error}`);
            return;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";

        console.log(`⏱️ 耗时: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log(`📝 长度: ${content.length} 字符`);
        console.log(`🔢 Tokens: ${data.usage?.total_tokens || "N/A"}`);
        console.log("\n📄 完整回答：");
        console.log("-".repeat(70));
        console.log(content);

    } catch (error: any) {
        console.log(`❌ 测试失败: ${error.message}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ 测试完成");
}

runTest().catch(console.error);
