/**
 * 测试不同 AI 模型的回答质量对比
 * 1. GLM-4.7 (当前默认)
 * 2. Grok (xAI)
 * 3. 混合模式 (GLM 调度 + Grok 分析)
 */

import { ENV } from "../_core/env";

interface TestResult {
    model: string;
    query: string;
    response: string;
    duration: number;
    tokens?: number;
}

// 直接调用 GLM API
async function callGLM(query: string, systemPrompt: string): Promise<TestResult> {
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
                { role: "system", content: systemPrompt },
                { role: "user", content: query },
            ],
            temperature: 0.7,
            max_tokens: 4000,
        }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return {
        model: "GLM-4.7",
        query,
        response: content,
        duration: Date.now() - startTime,
        tokens: data.usage?.total_tokens,
    };
}

// 直接调用 Grok API (xAI)
async function callGrok(query: string, systemPrompt: string): Promise<TestResult> {
    const startTime = Date.now();

    if (!ENV.grokApiKey) {
        return {
            model: "Grok",
            query,
            response: "❌ GROK_API_KEY 未配置",
            duration: 0,
        };
    }

    const response = await fetch(`${ENV.grokApiUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.grokApiKey}`,
        },
        body: JSON.stringify({
            model: ENV.grokModel || "grok-4-1-fast-reasoning",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query },
            ],
            temperature: 0.7,
            max_tokens: 4000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        return {
            model: "Grok",
            query,
            response: `❌ Grok API Error: ${response.status} - ${error}`,
            duration: Date.now() - startTime,
        };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return {
        model: "Grok",
        query,
        response: content,
        duration: Date.now() - startTime,
        tokens: data.usage?.total_tokens,
    };
}

// 技术分析系统提示词
const TECH_ANALYSIS_PROMPT = `你是一个专业的A股技术分析师。请按照以下框架进行分析：

## 分析框架

### 1. 最新行情回顾
- 收盘价、涨跌幅、成交量、换手率、量比

### 2. 均线系统
- MA5/MA10/MA20/MA50/MA100/MA200 的具体数值和多空信号
- 金叉/死叉信号

### 3. MACD指标
- MACD值、DIFF、DEA、红绿柱状态
- 金叉/死叉信号

### 4. KDJ指标
- K/D/J值，超买超卖状态

### 5. RSI指标
- RSI(14)值，强弱判断

### 6. 布林带
- 上轨/中轨/下轨位置

### 7. 支撑位与阻力位
- S1/S2/S3支撑位
- R1/R2/R3阻力位

### 8. 综合结论
- 短期、中期走势判断
- 具体操作建议

请给出详细的数值和专业分析。`;

async function runTests() {
    console.log("🧪 AI 模型回答质量对比测试\n");
    console.log("=".repeat(70));

    const testQuery = "按照技术分析框架分析一下航天电子(600879)";

    // 测试 1: GLM
    console.log("\n📊 测试 1: GLM-4.7");
    console.log("-".repeat(70));
    try {
        const glmResult = await callGLM(testQuery, TECH_ANALYSIS_PROMPT);
        console.log(`⏱️ 耗时: ${(glmResult.duration / 1000).toFixed(2)}s`);
        console.log(`📝 长度: ${glmResult.response.length} 字符`);
        console.log(`🔢 Tokens: ${glmResult.tokens || "N/A"}`);
        console.log("\n📄 回答:");
        console.log(glmResult.response.slice(0, 2000));
        if (glmResult.response.length > 2000) {
            console.log(`\n... (省略 ${glmResult.response.length - 2000} 字符)`);
        }
    } catch (error: any) {
        console.log(`❌ GLM 测试失败: ${error.message}`);
    }

    console.log("\n" + "=".repeat(70));

    // 测试 2: Grok
    console.log("\n📊 测试 2: Grok (xAI)");
    console.log("-".repeat(70));
    try {
        const grokResult = await callGrok(testQuery, TECH_ANALYSIS_PROMPT);
        console.log(`⏱️ 耗时: ${(grokResult.duration / 1000).toFixed(2)}s`);
        console.log(`📝 长度: ${grokResult.response.length} 字符`);
        console.log(`🔢 Tokens: ${grokResult.tokens || "N/A"}`);
        console.log("\n📄 回答:");
        console.log(grokResult.response.slice(0, 2000));
        if (grokResult.response.length > 2000) {
            console.log(`\n... (省略 ${grokResult.response.length - 2000} 字符)`);
        }
    } catch (error: any) {
        console.log(`❌ Grok 测试失败: ${error.message}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n✅ 测试完成");
}

runTests().catch(console.error);
