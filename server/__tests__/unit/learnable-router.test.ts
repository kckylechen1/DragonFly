import { describe, it, expect } from "vitest";
import { LearnableRouter } from "../../_core/agent/learnable-router";

describe("LearnableRouter", () => {
  it("falls back to default route when history is insufficient", async () => {
    const router = new LearnableRouter();
    (router as any).history = [];
    const model = await router.selectModel("看看长城", "600001", "simple");
    expect(model).toBe("qwen");
  });

  it("selects best model from similar history", async () => {
    const router = new LearnableRouter();
    (router as any).history = [
      {
        id: "1",
        query: "分析长城",
        stockCode: "600001",
        complexity: "complex",
        intent: "analysis",
        usedModel: "grok",
        latency: 1200,
        tokenCount: 500,
        success: true,
        timestamp: 1,
      },
      {
        id: "2",
        query: "分析长城",
        stockCode: "600001",
        complexity: "complex",
        intent: "analysis",
        usedModel: "grok",
        latency: 1800,
        tokenCount: 520,
        success: true,
        timestamp: 2,
      },
      {
        id: "3",
        query: "分析长城",
        stockCode: "600001",
        complexity: "complex",
        intent: "analysis",
        usedModel: "glm",
        latency: 1000,
        tokenCount: 510,
        success: false,
        timestamp: 3,
      },
    ];

    const model = await router.selectModel("分析长城", "600001", "complex");
    expect(model).toBe("grok");
  });
});
