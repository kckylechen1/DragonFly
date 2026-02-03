/**
 * 测试 SmartAgent 回答质量
 * 对比 Grok 网站的分析水平
 */

import { createSmartAgent } from "../_core/agent/smart-agent";

async function testAgentResponse() {
    console.log("🧪 测试 DragonFly Agent 回答质量\n");
    console.log("=".repeat(60));

    // 测试问题 - 与 Grok 网站相同的问题
    const testQueries = [
        {
            code: "600879",
            query: "按照技术分析框架分析一下航天电子",
            description: "航天电子技术分析"
        },
        {
            code: "000066",
            query: "中国长城怎么样，叠加CPU的逻辑",
            description: "中国长城基本面+CPU逻辑"
        }
    ];

    for (const test of testQueries) {
        console.log(`\n📊 测试: ${test.description}`);
        console.log(`   股票: ${test.code}`);
        console.log(`   问题: ${test.query}`);
        console.log("-".repeat(60));

        const startTime = Date.now();

        try {
            const agent = createSmartAgent({
                stockCode: test.code,
                verbose: false,
                thinkHard: false, // 先用普通模式
            });

            // 收集流式响应
            const events: any[] = [];
            let fullResponse = "";
            let toolCalls: string[] = [];

            for await (const event of agent.stream(test.query)) {
                events.push(event);

                if (event.type === "content" && event.data) {
                    fullResponse += event.data;
                }
                if (event.type === "tool_call") {
                    toolCalls.push(event.data?.name || "unknown");
                }
                if (event.type === "thinking") {
                    console.log(`   💭 ${event.data}`);
                }
            }

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log(`\n   ⏱️ 耗时: ${elapsed}s`);
            console.log(`   🔧 工具调用: ${toolCalls.length > 0 ? toolCalls.join(", ") : "无"}`);
            console.log(`   📝 回答长度: ${fullResponse.length} 字符`);
            console.log("\n   📄 回答内容:");
            console.log("   " + "-".repeat(56));

            // 输出回答（限制长度便于查看）
            const lines = fullResponse.split("\n");
            for (const line of lines.slice(0, 50)) {
                console.log("   " + line);
            }
            if (lines.length > 50) {
                console.log(`   ... (省略 ${lines.length - 50} 行)`);
            }

            agent.cleanup();

        } catch (error: any) {
            console.log(`   ❌ 错误: ${error.message}`);
        }

        console.log("\n" + "=".repeat(60));
    }

    console.log("\n✅ 测试完成");
}

// 运行测试
testAgentResponse().catch(console.error);
