/**
 * 单股票AI Agent测试 - 快速验证
 */

import { describe, it } from "vitest";
import { createSmartAgent } from "../../_core/agent";

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true";
const itIntegration = runIntegration ? it : it.skip;

async function testSingleStock() {
  console.log("🚀 测试单只股票AI Agent功能\n");

  try {
    // 创建Agent
    console.log("🤖 创建SmartAgent...");
    const agent = createSmartAgent({
      stockCode: "002594", // 比亚迪
      preferredModel: "grok",
    });

    // 执行技术分析查询
    const query =
      "请对002594进行技术分析，给出买入/持有/卖出的投资建议，并说明理由。当前时间是2025年9月15日。";
    console.log(`查询: ${query}\n`);

    const startTime = Date.now();
    const result = await agent.chat(query);
    const duration = Date.now() - startTime;

    console.log(`✅ 分析完成 (${duration}ms)`);
    console.log("📊 分析结果:");
    console.log(result.response);
    console.log("\n🔧 工具调用:", result.toolCalls);
    console.log("🧠 推理次数:", result.iterations);
  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
}

describe("integration.single_stock", () => {
  itIntegration(
    "runs single stock test",
    async () => {
      await testSingleStock();
    },
    1000 * 60 * 5
  );
});
