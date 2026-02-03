import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TickBuffer } from "../tickBuffer";
import type { MarketTick } from "../../types/market";

describe("TickBuffer", () => {
  let buffer: TickBuffer;
  let flushCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    buffer = new TickBuffer();
    flushCallback = vi.fn();
    buffer.setFlushCallback(flushCallback);

    // Mock requestAnimationFrame
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      setTimeout(() => cb(0), 16); // 模拟 ~60fps
      return 0;
    });
  });

  afterEach(() => {
    buffer.clear();
    vi.unstubAllGlobals();
  });

  it("should buffer ticks and flush on animation frame", async () => {
    const tick: MarketTick = {
      symbol: "AAPL",
      price: 150.0,
      change: 1.5,
      changePercent: 1.0,
      volume: 1000000,
      timestamp: Date.now(),
    };

    buffer.add("AAPL", tick);
    expect(buffer.getBufferSize()).toBe(1);
    expect(flushCallback).not.toHaveBeenCalled();

    // 等待 rAF 执行
    await new Promise((r) => setTimeout(r, 20));

    expect(flushCallback).toHaveBeenCalledWith({ AAPL: tick });
    expect(buffer.getBufferSize()).toBe(0);
  });

  it("should only keep latest tick for same symbol", async () => {
    const tick1: MarketTick = {
      symbol: "AAPL",
      price: 150.0,
      change: 1.5,
      changePercent: 1.0,
      volume: 1000000,
      timestamp: Date.now(),
    };

    const tick2: MarketTick = {
      symbol: "AAPL",
      price: 151.0,
      change: 2.5,
      changePercent: 1.67,
      volume: 1100000,
      timestamp: Date.now() + 100,
    };

    buffer.add("AAPL", tick1);
    buffer.add("AAPL", tick2);

    expect(buffer.getBufferSize()).toBe(1);

    await new Promise((r) => setTimeout(r, 20));

    expect(flushCallback).toHaveBeenCalledWith({ AAPL: tick2 });
  });

  it("should handle multiple symbols", async () => {
    const tickAAPL: MarketTick = {
      symbol: "AAPL",
      price: 150.0,
      change: 1.5,
      changePercent: 1.0,
      volume: 1000000,
      timestamp: Date.now(),
    };

    const tickGOOG: MarketTick = {
      symbol: "GOOG",
      price: 2800.0,
      change: 50.0,
      changePercent: 1.82,
      volume: 500000,
      timestamp: Date.now(),
    };

    buffer.add("AAPL", tickAAPL);
    buffer.add("GOOG", tickGOOG);

    expect(buffer.getBufferSize()).toBe(2);

    await new Promise((r) => setTimeout(r, 20));

    expect(flushCallback).toHaveBeenCalledWith({
      AAPL: tickAAPL,
      GOOG: tickGOOG,
    });
  });

  it("should only schedule one rAF per frame", async () => {
    const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame");

    const tick: MarketTick = {
      symbol: "AAPL",
      price: 150.0,
      change: 1.5,
      changePercent: 1.0,
      volume: 1000000,
      timestamp: Date.now(),
    };

    // 连续添加 10 个 tick
    for (let i = 0; i < 10; i++) {
      buffer.add("AAPL", { ...tick, price: 150 + i });
    }

    // 应该只调用一次 rAF
    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it("should apply backpressure when buffer exceeds limit", async () => {
    const tick: MarketTick = {
      symbol: "AAPL",
      price: 150.0,
      change: 1.5,
      changePercent: 1.0,
      volume: 1000000,
      timestamp: Date.now(),
    };

    // 添加 15 个 tick，超过 10 个限制
    for (let i = 0; i < 15; i++) {
      buffer.add("AAPL", { ...tick, price: 150 + i });
    }

    await new Promise((r) => setTimeout(r, 20));

    // 应该只保留最新的 tick
    expect(flushCallback).toHaveBeenCalledWith({
      AAPL: expect.objectContaining({ price: 164 }),
    });
  });
});
