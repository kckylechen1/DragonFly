# C-001: 创建 Tick 缓冲层

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## ⚠️ CRITICAL - 这是性能关键代码

## 目标
- [ ] 创建 `realtime/tickBuffer.ts`
- [ ] 实现 requestAnimationFrame 批处理
- [ ] 创建单元测试

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 435-478 行

---

## 问题背景

当前方案将每个 WebSocket tick 直接写入 Zustand store，会导致：

- 每秒数十次的 React 重渲染
- GC 抖动（大量对象拷贝）
- 60fps 无法保证

**解决方案**: 使用缓冲区 + requestAnimationFrame，每帧最多更新一次。

---

## 步骤

### Step 1: 创建目录

```bash
mkdir -p client/src/refactor_v2/realtime
mkdir -p client/src/refactor_v2/realtime/__tests__
```

### Step 2: 创建 tickBuffer.ts

```typescript
// client/src/refactor_v2/realtime/tickBuffer.ts

import type { MarketTick } from "../types/market";

/**
 * Tick 缓冲层
 * 
 * 作用：将高频 tick 数据缓冲，每帧只更新一次 Zustand store
 * 
 * 核心原理：
 * 1. 每个 tick 进来时，只更新 buffer（O(1) Map 操作）
 * 2. 使用 requestAnimationFrame 调度 flush
 * 3. flush 时批量更新 Zustand，触发一次 React 重渲染
 */
/**
 * Tick 缓冲层 (带背压策略)
 * 
 * 作用：将高频 tick 数据缓冲，每帧只更新一次 Zustand store
 * 
 * 核心原理：
 * 1. 每个 tick 进来时，记录到 buffer
 * 2. 背压策略：如果单 symbol 积压超过 10 条，丢弃旧数据，只保留最新。
 * 3. 采样策略：flush 时只取每 symbol 最新一条提交给 Store。
 */
class TickBuffer {
  private buffer = new Map<string, MarketTick[]>();
  private flushScheduled = false;
  private flushCallback: ((updates: Record<string, MarketTick>) => void) | null = null;

  setFlushCallback(callback: (updates: Record<string, MarketTick>) => void) {
    this.flushCallback = callback;
  }

  /**
   * 添加 tick 到缓冲区（带背压）
   */
  add(symbol: string, tick: MarketTick) {
    const symbolBuffer = this.buffer.get(symbol) || [];
    
    // ⚠️ Oracle 护栏：背压策略
    // 如果缓冲区太大，说明消费跟不上生产，丢弃旧数据
    if (symbolBuffer.length >= 10) {
      this.buffer.set(symbol, [tick]); // 只保留最新
      // realtimeDebug.recordTick(true); // 记录丢包
    } else {
      symbolBuffer.push(tick);
      this.buffer.set(symbol, symbolBuffer);
      // realtimeDebug.recordTick(false);
    }

    if (!this.flushScheduled) {
      this.flushScheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  /**
   * 刷新缓冲区
   */
  private flush() {
    const startTime = performance.now();
    this.flushScheduled = false;

    if (this.buffer.size === 0) return;

    // 采样策略：每 symbol 只取最新一条
    const latestUpdates: Record<string, MarketTick> = {};
    for (const [symbol, ticks] of this.buffer) {
      if (ticks.length > 0) {
        latestUpdates[symbol] = ticks[ticks.length - 1];
      }
    }
    
    this.buffer.clear();

    if (this.flushCallback) {
      this.flushCallback(latestUpdates);
    }

    // realtimeDebug.recordFlush(performance.now() - startTime);
  }

  /**
   * 获取当前缓冲区大小（用于测试）
   */
  getBufferSize(): number {
    return this.buffer.size;
  }

  /**
   * 清空缓冲区（用于测试和清理）
   */
  clear() {
    this.buffer.clear();
    this.flushScheduled = false;
  }
}

// 单例导出
export const tickBuffer = new TickBuffer();

// 也导出类供测试使用
export { TickBuffer };
```

### Step 3: 创建初始化代码

```typescript
// client/src/refactor_v2/realtime/index.ts

import { tickBuffer } from "./tickBuffer";
import { useMarketStore } from "../stores/market.store";

/**
 * 初始化实时数据层
 * 在应用启动时调用一次
 */
export function initRealtime() {
  // 连接 tickBuffer 到 Zustand store
  tickBuffer.setFlushCallback((updates) => {
    useMarketStore.getState().batchUpdateTicks(updates);
  });
}

export { tickBuffer } from "./tickBuffer";
```

### Step 4: 创建单元测试

```typescript
// client/src/refactor_v2/realtime/__tests__/tickBuffer.test.ts

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
});
```

### Step 5: 验证

```bash
pnpm check
pnpm test -- --grep "tickBuffer"
```

---

## 验收标准

- [ ] `tickBuffer.ts` 已创建
- [ ] 使用 requestAnimationFrame 调度 flush
- [ ] 每个 symbol 只保留最新 tick
- [ ] 单元测试通过
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/realtime/tickBuffer.ts`
- `client/src/refactor_v2/realtime/index.ts`
- `client/src/refactor_v2/realtime/__tests__/tickBuffer.test.ts`
