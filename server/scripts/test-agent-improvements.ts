/**
 * Agent 优化效果对比测试
 * 对比 Codex 优化前后的 Agent 输出质量
 */

import { createSmartAgent } from "../_core/agent";
import { consensusAnalysis } from "../_core/agent/consensus-analysis";
import { learnableRouter } from "../_core/agent/learnable-router";
import { getPromptByStyle } from "../_core/prompts/stock-analysis-prompts";

const TEST_STOCK = "600519"; // 贵州茅台
const TEST_QUERY = "分析一下贵州茅台的技术面和资金面，给出操作建议";

async function testBaselineAgent() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 测试 1: 基础 SmartAgent (优化后)");
    console.log("=".repeat(60));

    const agent = createSmartAgent({
        verbose: true,
        stockCode: TEST_STOCK,
    });

    const startTime = Date.now();
    let fullResponse = "";

    // 注意：SmartAgent 用 .stream() 不是 .run()
    for await (const event of agent.stream(TEST_QUERY)) {
        if (event.type === "content") {
            fullResponse += event.data;
            process.stdout.write(event.data);
        } else if (event.type === "tool_call") {
            console.log(`\n🔧 调用工具: ${event.data?.name || "unknown"}`);
        }
    }

    const duration = (Date.now() - startTime) / 1000;

    console.log("\n" + "-".repeat(40));
    console.log(`⏱️ 耗时: ${duration.toFixed(1)}s`);
    console.log(`📝 输出长度: ${fullResponse.length} 字符`);

    return { duration, length: fullResponse.length, response: fullResponse };
}

async function testConsensusAnalysis() {
    console.log("\n" + "=".repeat(60));
    console.log("🤝 测试 2: 多模型共识分析 (新功能)");
    console.log("=".repeat(60));

    const startTime = Date.now();

    const dataContext = `
贵州茅台 (600519) 最新数据:
- 当前价: 1520.00
- 涨跌幅: +1.5%
- 成交量: 2.3万手
- MACD: DIF=15.2, DEA=12.8, MACD柱=4.8 (金叉)
- RSI(14): 58.5
- 主力净流入: +3.2亿
`;

    const result = await consensusAnalysis(TEST_QUERY, TEST_STOCK, dataContext);

    const duration = (Date.now() - startTime) / 1000;

    console.log(`\n📊 共识结果:`);
    console.log(`   方法: ${result.method}`);
    console.log(`   建议: ${result.recommendation}`);
    console.log(`   置信度: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`\n各模型结论:`);
    console.log(`   Grok:     ${result.models.grok.conclusion}`);
    console.log(`   GLM:      ${result.models.glm.conclusion}`);
    console.log(`   DeepSeek: ${result.models.deepseek.conclusion}`);
    console.log(`\n⏱️ 耗时: ${duration.toFixed(1)}s`);

    return { duration, result };
}

async function testPromptStyles() {
    console.log("\n" + "=".repeat(60));
    console.log("📝 测试 3: 提示词模板 (简洁版 vs 详细版)");
    console.log("=".repeat(60));

    console.log("\n--- 简洁版提示词 ---");
    console.log(getPromptByStyle("concise").slice(0, 200) + "...");

    console.log("\n--- 详细版提示词 ---");
    console.log(getPromptByStyle("detailed").slice(0, 500) + "...");

    return { conciseLength: getPromptByStyle("concise").length, detailedLength: getPromptByStyle("detailed").length };
}

async function testLearnableRouter() {
    console.log("\n" + "=".repeat(60));
    console.log("🔀 测试 4: 可学习路由器");
    console.log("=".repeat(60));

    // 模拟选择模型
    const selectedModel = await learnableRouter.selectModel(
        TEST_QUERY,
        TEST_STOCK,
        "complex"
    );

    console.log(`\n选择的模型: ${selectedModel}`);

    // 获取统计
    const stats = learnableRouter.getStats();
    if (stats.length > 0) {
        console.log(`\n历史统计:`);
        for (const s of stats) {
            console.log(`   ${s.model}: ${s.totalQueries} 次, 成功率 ${(s.successRate * 100).toFixed(1)}%, 平均耗时 ${(s.avgLatency / 1000).toFixed(1)}s`);
        }
    } else {
        console.log(`\n暂无历史数据 (首次运行)`);
    }

    return { selectedModel, stats };
}

async function main() {
    console.log("🚀 DragonFly Agent 优化效果测试");
    console.log("=".repeat(60));
    console.log(`测试股票: ${TEST_STOCK}`);
    console.log(`测试问题: ${TEST_QUERY}`);

    const results: any = {};

    try {
        // 测试 1: 基础 Agent
        results.baseline = await testBaselineAgent();
    } catch (e: any) {
        console.error("❌ 基础 Agent 测试失败:", e.message);
    }

    try {
        // 测试 2: 共识分析
        results.consensus = await testConsensusAnalysis();
    } catch (e: any) {
        console.error("❌ 共识分析测试失败:", e.message);
    }

    try {
        // 测试 3: 提示词模板
        results.prompts = await testPromptStyles();
    } catch (e: any) {
        console.error("❌ 提示词测试失败:", e.message);
    }

    try {
        // 测试 4: 路由器
        results.router = await testLearnableRouter();
    } catch (e: any) {
        console.error("❌ 路由器测试失败:", e.message);
    }

    // 总结
    console.log("\n" + "=".repeat(60));
    console.log("📋 测试总结");
    console.log("=".repeat(60));

    if (results.baseline) {
        console.log(`\n基础 Agent:`);
        console.log(`   耗时: ${results.baseline.duration.toFixed(1)}s`);
        console.log(`   输出: ${results.baseline.length} 字符`);
    }

    if (results.consensus) {
        console.log(`\n共识分析:`);
        console.log(`   耗时: ${results.consensus.duration.toFixed(1)}s`);
        console.log(`   方法: ${results.consensus.result.method}`);
        console.log(`   置信度: ${(results.consensus.result.confidence * 100).toFixed(1)}%`);
    }

    if (results.prompts) {
        console.log(`\n提示词模板:`);
        console.log(`   简洁版: ${results.prompts.conciseLength} 字符`);
        console.log(`   详细版: ${results.prompts.detailedLength} 字符`);
    }

    if (results.router) {
        console.log(`\n可学习路由器:`);
        console.log(`   选择模型: ${results.router.selectedModel}`);
    }

    console.log("\n✅ 测试完成!");
}

main().catch(console.error);
