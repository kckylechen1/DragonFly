/**
 * 混合模式测试
 * 
 * 模式 1: GLM主导 → GLM 调用工具，GLM 生成回答
 * 模式 2: Grok主导 → Grok 调用工具（委托给 GLM/Qwen），Grok 生成回答  
 * 模式 3: 混合模式 → GLM 调用工具，Grok 生成最终回答
 */

import { ENV } from "../_core/env";
import { analyzeStock } from "../_core/technicalAnalysis";
import * as eastmoney from "../eastmoney";
import * as fundflow from "../fundflow";

// 系统提示词
const SYSTEM_PROMPT = `你是一个专业的A股技术分析助手。请严格按照以下框架输出：

### [股票名称]（[代码]）技术分析

**行情回顾**：收盘价/涨跌/成交量/换手率/量比

**均线系统**：MA5/MA10/MA20 具体数值，多空信号

**MACD**：DIF/DEA/柱状态

**KDJ**：K/D/J 具体数值

**RSI**：RSI(14) 数值

**资金面**：主力净流入，大单/小单分解

**支撑阻力**：S1/S2/R1/R2

**综合结论**：短期判断 + 风险点 + 操作建议（入场价/止损价/目标价）`;

async function getStockData(code: string) {
    const [techResult, quote, fundFlow] = await Promise.all([
        analyzeStock(code),
        eastmoney.getStockQuote(code),
        fundflow.getStockFundFlow(code),
    ]);

    if (!techResult) return null;

    return `
## 股票数据: ${techResult.name}(${code})

**行情**: 收盘 ${techResult.price.toFixed(2)}元, ${techResult.changePct >= 0 ? "+" : ""}${techResult.changePct.toFixed(2)}%, 量比 ${techResult.volRatio.toFixed(2)}, 换手率 ${quote?.turnoverRate?.toFixed(2) || "N/A"}%

**均线**: MA5=${techResult.ma5.toFixed(2)}, MA10=${techResult.ma10.toFixed(2)}, MA20=${techResult.ma20.toFixed(2)}, ${techResult.isMaBullish ? "多头排列" : "非多头排列"}

**MACD**: DIF=${techResult.macdDif.toFixed(4)}, DEA=${techResult.macdDea.toFixed(4)}, ${techResult.macdIsRed ? "红柱" : "绿柱"}${techResult.macdExpanding ? "放大" : "缩小"}

**KDJ**: K=${techResult.kdjK.toFixed(2)}, D=${techResult.kdjD.toFixed(2)}, J=${techResult.kdjJ.toFixed(2)}

**RSI**: ${techResult.rsi.toFixed(2)}, ${techResult.rsiZone === "overbought" ? "超买" : techResult.rsiZone === "oversold" ? "超卖" : "正常"}

**止损位**: MA5=${techResult.stopLossAggressive.toFixed(2)}, MA10=${techResult.stopLossModerate.toFixed(2)}

**资金**: ${fundFlow ? `主力净流入 ${(fundFlow.mainNetInflow / 100000000).toFixed(2)}亿, 小单 ${(fundFlow.smallNetInflow / 100000000).toFixed(2)}亿` : "N/A"}
`;
}

async function callModel(
    model: "glm" | "grok",
    systemPrompt: string,
    userMessage: string
): Promise<{ content: string; duration: number; tokens: number }> {
    const startTime = Date.now();

    const config = model === "glm"
        ? { url: ENV.glmApiUrl, key: ENV.glmApiKey, model: ENV.glmModel || "glm-4.7" }
        : { url: ENV.grokApiUrl, key: ENV.grokApiKey, model: ENV.grokModel || "grok-3-fast" };

    if (!config.key) {
        return { content: `❌ ${model.toUpperCase()}_API_KEY 未配置`, duration: 0, tokens: 0 };
    }

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
            max_tokens: 4000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return { content: `❌ API Error: ${response.status} - ${error}`, duration: Date.now() - startTime, tokens: 0 };
    }

    const data = await response.json();
    return {
        content: data.choices?.[0]?.message?.content || "",
        duration: Date.now() - startTime,
        tokens: data.usage?.total_tokens || 0,
    };
}

async function runTests() {
    console.log("🧪 混合模式测试\n");
    console.log("=".repeat(70));

    const code = "600879";
    const query = "分析一下航天电子";

    // 获取数据
    console.log("\n📊 获取股票数据...");
    const stockData = await getStockData(code);
    if (!stockData) {
        console.log("❌ 数据获取失败");
        return;
    }
    console.log("✅ 数据获取成功");

    const userMessage = `${query}\n\n${stockData}`;

    // ========== 模式 1: GLM 主导 ==========
    console.log("\n" + "=".repeat(70));
    console.log("\n🔵 模式 1: GLM 主导 (GLM 调用工具 + GLM 生成回答)");
    console.log("-".repeat(70));

    const glmResult = await callModel("glm", SYSTEM_PROMPT, userMessage);
    console.log(`⏱️ 耗时: ${(glmResult.duration / 1000).toFixed(2)}s`);
    console.log(`📝 长度: ${glmResult.content.length} 字符`);
    console.log(`🔢 Tokens: ${glmResult.tokens}`);
    console.log("\n📄 回答预览：");
    console.log(glmResult.content.slice(0, 800) + (glmResult.content.length > 800 ? "..." : ""));

    // ========== 模式 2: Grok 主导 ==========
    console.log("\n" + "=".repeat(70));
    console.log("\n🟣 模式 2: Grok 主导 (GLM 调用工具 + Grok 生成回答)");
    console.log("-".repeat(70));

    const grokResult = await callModel("grok", SYSTEM_PROMPT, userMessage);
    console.log(`⏱️ 耗时: ${(grokResult.duration / 1000).toFixed(2)}s`);
    console.log(`📝 长度: ${grokResult.content.length} 字符`);
    console.log(`🔢 Tokens: ${grokResult.tokens}`);
    console.log("\n📄 回答预览：");
    console.log(grokResult.content.slice(0, 800) + (grokResult.content.length > 800 ? "..." : ""));

    // ========== 模式 3: 真正混合 ==========
    console.log("\n" + "=".repeat(70));
    console.log("\n🟢 模式 3: 真正混合 (GLM 调用工具 + GLM 初步分析 + Grok 润色总结)");
    console.log("-".repeat(70));

    // 先让 GLM 做初步分析
    const glmDraft = await callModel("glm",
        "你是技术分析助手，请对股票数据做初步分析，给出关键发现。",
        `分析以下股票数据：\n${stockData}`
    );

    if (glmDraft.content.includes("❌")) {
        console.log(glmDraft.content);
    } else {
        // 然后让 Grok 润色总结
        const startTime = Date.now();
        const grokFinal = await callModel("grok",
            "你是资深A股操盘手。请基于助手的初步分析，给出最终的专业投资建议。要求：结论先行，给出具体点位。",
            `初步分析内容：\n${glmDraft.content}\n\n请给出最终投资建议。`
        );

        const totalDuration = glmDraft.duration + grokFinal.duration;
        console.log(`⏱️ 总耗时: ${(totalDuration / 1000).toFixed(2)}s (GLM: ${(glmDraft.duration / 1000).toFixed(2)}s + Grok: ${(grokFinal.duration / 1000).toFixed(2)}s)`);
        console.log(`📝 长度: ${grokFinal.content.length} 字符`);
        console.log(`🔢 Tokens: GLM ${glmDraft.tokens} + Grok ${grokFinal.tokens} = ${glmDraft.tokens + grokFinal.tokens}`);
        console.log("\n📄 回答预览：");
        console.log(grokFinal.content.slice(0, 800) + (grokFinal.content.length > 800 ? "..." : ""));
    }

    // ========== 对比总结 ==========
    console.log("\n" + "=".repeat(70));
    console.log("\n📊 对比总结");
    console.log("-".repeat(70));
    console.log(`
| 模式 | 耗时 | 长度 | Tokens | 特点 |
|------|------|------|--------|------|
| GLM主导 | ${(glmResult.duration / 1000).toFixed(1)}s | ${glmResult.content.length}字 | ${glmResult.tokens} | 性价比高 |
| Grok主导 | ${(grokResult.duration / 1000).toFixed(1)}s | ${grokResult.content.length}字 | ${grokResult.tokens} | 速度快 |
`);

    console.log("=".repeat(70));
    console.log("✅ 测试完成");
}

runTests().catch(console.error);
