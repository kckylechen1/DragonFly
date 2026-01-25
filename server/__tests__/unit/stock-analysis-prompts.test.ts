import { describe, it, expect } from "vitest";
import { getPromptByStyle } from "../../_core/prompts/stock-analysis-prompts";

describe("stock-analysis-prompts", () => {
  it("returns concise prompt by default", () => {
    const prompt = getPromptByStyle("concise");
    expect(prompt).toContain("结论");
    expect(prompt).toContain("具体点位");
  });

  it("returns detailed prompt when requested", () => {
    const prompt = getPromptByStyle("detailed");
    expect(prompt).toContain("输出至少 1500 字");
    expect(prompt).toContain("技术分析报告");
  });
});
