import { describe, it, expect, vi, afterEach } from "vitest";

describe("parallelAnalysis", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("returns config warnings when Grok key is missing", async () => {
    process.env.NODE_ENV = "test";
    process.env.GROK_API_KEY = "";
    process.env.XAI_API_KEY = "";

    const { parallelAnalysis } = await import(
      "../../_core/agent/parallel-reasoning"
    );

    const result = await parallelAnalysis("600000", "数据...");
    expect(result.technical).toContain("not configured");
    expect(result.capital).toContain("not configured");
    expect(result.fundamental).toContain("not configured");
    expect(result.sentiment).toContain("not configured");
    expect(result.synthesis).toContain("not configured");
  });
});
