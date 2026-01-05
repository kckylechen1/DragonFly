import { describe, expect, it } from "vitest";
import * as eastmoney from "./eastmoney";

describe("Eastmoney API", () => {
  it("should convert stock code to eastmoney format", () => {
    expect(eastmoney.convertToEastmoneyCode("600000")).toBe("1.600000");
    expect(eastmoney.convertToEastmoneyCode("000001")).toBe("0.000001");
    expect(eastmoney.convertToEastmoneyCode("300750")).toBe("0.300750");
  });

  it("should convert eastmoney code to standard format", () => {
    expect(eastmoney.convertFromEastmoneyCode("1.600000")).toBe("600000");
    expect(eastmoney.convertFromEastmoneyCode("0.000001")).toBe("000001");
  });

  it("should get stock quote", async () => {
    // 测试获取贵州茅台(600519)的行情
    const quote = await eastmoney.getStockQuote("600519");
    
    expect(quote).toBeDefined();
    expect(quote.code).toBe("600519");
    expect(quote.name).toBe("贵州茅台");
    expect(quote.price).toBeGreaterThan(0);
  }, 10000); // 10秒超时

  it("should search stocks", async () => {
    const results = await eastmoney.searchStock("茅台");
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    // 应该包含贵州茅台
    const maotai = results.find((stock: any) => stock.code === "600519");
    expect(maotai).toBeDefined();
  }, 10000);

  it("should get kline data", async () => {
    // 测试获取贵州茅台的日K线数据
    const klines = await eastmoney.getKlineData("600519", "day");
    
    expect(klines).toBeDefined();
    expect(Array.isArray(klines)).toBe(true);
    expect(klines.length).toBeGreaterThan(0);
    
    // 检查数据结构
    const firstKline = klines[0];
    expect(firstKline).toHaveProperty("date");
    expect(firstKline).toHaveProperty("open");
    expect(firstKline).toHaveProperty("close");
    expect(firstKline).toHaveProperty("high");
    expect(firstKline).toHaveProperty("low");
    expect(firstKline).toHaveProperty("volume");
  }, 15000); // 15秒超时
});
