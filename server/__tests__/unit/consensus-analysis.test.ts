import { describe, it, expect, vi, afterEach } from "vitest";

const mockResponse = (content: string) =>
  Promise.resolve({
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  });

describe("consensusAnalysis", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns unanimous result when all models agree", async () => {
    process.env.NODE_ENV = "test";
    process.env.GROK_API_KEY = "test";
    process.env.GLM_API_KEY = "test";
    process.env.BUILT_IN_FORGE_API_KEY = "test";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(await mockResponse("结论：买入"))
      .mockResolvedValueOnce(await mockResponse("建议：买入"))
      .mockResolvedValueOnce(await mockResponse("买入"));

    vi.stubGlobal("fetch", fetchMock);

    const { consensusAnalysis } = await import(
      "../../_core/agent/consensus-analysis"
    );

    const result = await consensusAnalysis("应该买吗", "600000", "数据...");
    expect(result.method).toBe("unanimous");
    expect(result.recommendation).toBe("买入");
  });

  it("returns weighted majority when models disagree", async () => {
    process.env.NODE_ENV = "test";
    process.env.GROK_API_KEY = "test";
    process.env.GLM_API_KEY = "test";
    process.env.BUILT_IN_FORGE_API_KEY = "test";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(await mockResponse("结论：买入"))
      .mockResolvedValueOnce(await mockResponse("结论：卖出"))
      .mockResolvedValueOnce(await mockResponse("建议：买入"));

    vi.stubGlobal("fetch", fetchMock);

    const { consensusAnalysis } = await import(
      "../../_core/agent/consensus-analysis"
    );

    const result = await consensusAnalysis("应该买吗", "600000", "数据...");
    expect(result.method).toBe("majority");
    expect(result.recommendation).toBe("买入");
    expect(result.confidence).toBeGreaterThanOrEqual(0.67);
  });
});
