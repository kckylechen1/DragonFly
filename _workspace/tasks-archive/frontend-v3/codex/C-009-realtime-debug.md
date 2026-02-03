# C-000: 实时数据调试器 (realtimeDebug)

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 2026-01-30 00:34
- ✅ 结束时间: 2026-01-30 00:36

## ⚠️ Oracle P1 护栏 - 增强可观测性

## 目标
- [ ] 创建 `realtime/realtimeDebug.ts`
- [ ] 监控实时数据的入队率、丢包率、Flush 耗时
- [ ] 监控 WS/SSE 连接状态
- [ ] 开发环境下每 10s 输出一次统计摘要

---

## 参考文档

- `tasks/epics/frontend-v3/ORACLE_REVIEW.md` 第 311-384 行

---

## 步骤

### Step 1: 创建 realtimeDebug.ts

```typescript
// client/src/refactor_v2/realtime/realtimeDebug.ts

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

interface RealtimeStats {
  ticksIn: number;
  ticksDropped: number;
  flushCount: number;
  avgFlushMs: number;
  wsState: string;
  sseState: string;
  lastError: string | null;
}

/**
 * 实时数据层监视器
 * 
 * 作用：在开发环境下收集性能指标，帮助识别是数据源过载还是 React 渲染瓶颈。
 */
class RealtimeDebugger {
  private stats: RealtimeStats = {
    ticksIn: 0,
    ticksDropped: 0,
    flushCount: 0,
    avgFlushMs: 0,
    wsState: 'IDLE',
    sseState: 'IDLE',
    lastError: null,
  };
  
  private flushTimes: number[] = [];
  
  /**
   * 记录收到的 tick
   */
  recordTick(dropped: boolean = false) {
    if (!DEBUG_ENABLED) return;
    this.stats.ticksIn++;
    if (dropped) this.stats.ticksDropped++;
  }
  
  /**
   * 记录一次批处理耗时
   */
  recordFlush(durationMs: number) {
    if (!DEBUG_ENABLED) return;
    this.stats.flushCount++;
    this.flushTimes.push(durationMs);
    if (this.flushTimes.length > 100) this.flushTimes.shift();
    
    this.stats.avgFlushMs = 
      this.flushTimes.reduce((a, b) => a + b, 0) / this.flushTimes.length;
    
    // 性能报警：如果一帧处理超过 16ms
    if (durationMs > 16) {
      console.warn(`[realtime] ⚠️ Flush took ${durationMs.toFixed(1)}ms (>16ms budget)`);
    }
  }
  
  setWsState(state: string) { this.stats.wsState = state; }
  setSseState(state: string) { this.stats.sseState = state; }
  setError(error: string) { this.stats.lastError = error; }
  
  getStats(): RealtimeStats { return { ...this.stats }; }
  
  /**
   * 启动周期性日志输出
   */
  startPeriodicLog() {
    if (!DEBUG_ENABLED) return;
    setInterval(() => {
      console.table(this.getStats());
    }, 10000);
  }
}

export const realtimeDebug = new RealtimeDebugger();
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `realtimeDebug.ts` 已创建
- [ ] 导出 `realtimeDebug` 单例
- [ ] 支持 Flush 耗时监控和报警
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/realtime/realtimeDebug.ts`
