/**
 * Tick 缓冲层
 *
 * 负责人: 🟢 Codex
 * ⏱️ 开始时间: 2026-01-30 00:00
 *
 * 作用：将高频 tick 数据缓冲，每帧只更新一次 Zustand store
 *
 * 核心原理：
 * 1. 每个 tick 进来时，记录到 buffer
 * 2. 背压策略：如果单 symbol 积压超过 10 条，丢弃旧数据，只保留最新。
 * 3. 采样策略：flush 时只取每 symbol 最新一条提交给 Store。
 */

import type { MarketTick } from "../types/market";
import { realtimeDebug } from "./realtimeDebug";

class TickBuffer {
  private buffer = new Map<string, MarketTick[]>();
  private flushScheduled = false;
  private flushCallback:
    | ((updates: Record<string, MarketTick>) => void)
    | null = null;

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
      realtimeDebug.recordTick(true); // 记录丢包
    } else {
      symbolBuffer.push(tick);
      this.buffer.set(symbol, symbolBuffer);
      realtimeDebug.recordTick(false);
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

    realtimeDebug.recordFlush(performance.now() - startTime);
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
