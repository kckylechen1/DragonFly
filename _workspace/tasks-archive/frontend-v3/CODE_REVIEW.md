# 🔍 Frontend V3 代码审阅报告

> **审阅日期**: 2026-01-30  
> **审阅范围**: C-001 ~ C-008 Codex 任务 + Wave 0 护栏代码  
> **结论**: ⚠️ 功能基本完成，需修复 3 个 P0 问题后可投入使用

---

## 📊 总体评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 功能完整性 | ⭐⭐⭐⭐⭐ | 8 个任务全部完成，代码可运行 |
| 架构合规 | ⭐⭐⭐⭐ | 遵循 Oracle 建议的架构模式 |
| 护栏集成 | ⭐⭐⭐ | 护栏代码存在但未完全集成 |
| 性能优化 | ⭐⭐⭐ | 方向正确，有 1 个关键问题 |
| 类型安全 | ⭐⭐⭐⭐⭐ | TypeScript 类型完整 |
| 测试覆盖 | ⭐⭐⭐⭐ | 核心模块有单元测试 |

---

## ✅ 已正确实现的部分

### 1. TickBuffer (C-001) ✅

```typescript
// ✅ 正确: rAF 批处理
if (!this.flushScheduled) {
  this.flushScheduled = true;
  requestAnimationFrame(() => this.flush());
}

// ✅ 正确: 背压策略 (超过 10 条只保留最新)
if (symbolBuffer.length >= 10) {
  this.buffer.set(symbol, [tick]);
}

// ✅ 正确: 采样策略 (flush 只取最新)
latestUpdates[symbol] = ticks[ticks.length - 1];
```

### 2. SSE 去重 (C-003) ✅

```typescript
// ✅ 正确: eventId 滑动窗口去重
if (this.seen.size >= this.maxWindow) {
  const arr = Array.from(this.seen);
  const keep = arr.slice(arr.length / 2);
  this.seen = new Set(keep);
}

// ✅ 正确: seq 单调递增检查
if (event.seq <= lastSeqRef.current) return;
lastSeqRef.current = event.seq;
```

### 3. Markdown 50ms 批量 (C-004) ✅

```typescript
// ✅ 正确: 50ms 批量 commit
const interval = setInterval(() => {
  if (pendingRef.current) {
    setDisplayContent((prev) => prev + pendingRef.current);
    pendingRef.current = "";
  }
}, 50);
```

### 4. KLinePanel Imperative 更新 (C-006) ✅

```typescript
// ✅ 正确: 绕过 React state，直接调用图表 API
candleSeriesRef.current.update({
  time,
  open: tick.price,
  high: tick.price,
  low: tick.price,
  close: tick.price,
});
```

### 5. lightweight-charts v5 适配 ✅

```typescript
// ✅ 正确: 使用 v5 API
const candleSeries = chart.addSeries(CandlestickSeries, {...});
const volumeSeries = chart.addSeries(HistogramSeries, {...});
```

---

## 🔴 必须修复的问题 (P0)

### 1. ConnectionStateMachine 未集成到 MarketClient

**问题**: `connectionStateMachine.ts` 已创建但 `marketClient.ts` 未使用

**风险**: 
- React 18 StrictMode 双执行会创建重复 WebSocket
- `connect()` 仅检查 `OPEN`，不检查 `CONNECTING`

**当前代码**:
```typescript
// marketClient.ts - 问题代码
connect(url: string = "wss://market-api/ws") {
  if (this.ws?.readyState === WebSocket.OPEN) {
    return; // ❌ 不检查 CONNECTING 状态
  }
  // ...
}
```

**修复方案**:
```typescript
// marketClient.ts - 修复后
private fsm = new ConnectionStateMachine('IDLE');
private connectGen = 0;

connect(url: string = "wss://market-api/ws") {
  this.url = url;

  // ✅ 幂等检查: OPEN 或 CONNECTING 都返回
  if (this.ws && (
    this.ws.readyState === WebSocket.OPEN || 
    this.ws.readyState === WebSocket.CONNECTING
  )) {
    return;
  }

  const gen = ++this.connectGen; // ✅ 代数 token 防止 stale callback
  this.fsm.transition('CONNECTING');
  // ...

  this.ws.onopen = () => {
    if (gen !== this.connectGen) return; // ✅ stale 检查
    this.fsm.transition('OPEN');
    // ...
  };
}
```

---

### 2. KLinePanel Zustand 订阅导致性能问题

**问题**: 订阅整个 store 而非特定 selector

**风险**: 任何 store 更新（orderbook、其他 symbol）都会触发回调，严重影响 60fps

**当前代码**:
```typescript
// KLinePanel.tsx - 问题代码
const unsubscribe = useMarketStore.subscribe((state) => {
  const tick = state.data[symbol]; // ❌ 订阅整个 state
  // ...
});
```

**修复方案**:
```typescript
// 方案 A: 使用 subscribeWithSelector middleware
import { subscribeWithSelector } from 'zustand/middleware';

// market.store.ts
export const useMarketStore = create<...>()(
  subscribeWithSelector((set) => ({ ... }))
);

// KLinePanel.tsx
const unsubscribe = useMarketStore.subscribe(
  (s) => s.data[symbol],
  (tick) => {
    if (!tick || !candleSeriesRef.current) return;
    // imperative update
  },
  { equalityFn: (a, b) => a?.timestamp === b?.timestamp }
);
```

---

### 3. RealtimeDebug 未被调用

**问题**: `realtimeDebug.ts` 存在但无处调用

**风险**: 无法监控实时数据层性能，问题难以定位

**需要添加的调用点**:

```typescript
// tickBuffer.ts
import { realtimeDebug } from './realtimeDebug';

add(symbol: string, tick: MarketTick) {
  const dropped = symbolBuffer.length >= 10;
  realtimeDebug.recordTick(dropped); // ✅ 添加
  // ...
}

private flush() {
  const startTime = performance.now();
  // ...
  realtimeDebug.recordFlush(performance.now() - startTime); // ✅ 添加
}

// marketClient.ts
this.ws.onopen = () => {
  realtimeDebug.setWsState('OPEN'); // ✅ 添加
  // ...
};

this.ws.onerror = () => {
  realtimeDebug.setError('WebSocket error'); // ✅ 添加
  // ...
};

// useStreamingChat.ts
es.onopen = () => {
  realtimeDebug.setSseState('OPEN'); // ✅ 添加
  // ...
};
```

---

## 🟡 建议修复的问题 (P1)

### 4. SSE Deduplicator 是全局单例

**问题**: 所有 hook 实例共享同一个 dedup Set

**风险**: 切换 conversation 时可能误抑制有效事件

**修复**:
```typescript
// useStreamingChat.ts
export function useStreamingChat(options: UseStreamingChatOptions = {}) {
  const dedupRef = useRef(new SSEDeduplicator()); // ✅ 每个实例独立

  const connect = useCallback((convId: string) => {
    dedupRef.current.clear(); // ✅ 重连时清空
    // ...
  }, []);
}
```

---

### 5. useStreamingChat 缺少自动清理

**问题**: unmount 时不会自动断开 SSE

**修复**:
```typescript
// useStreamingChat.ts
useEffect(() => {
  return () => {
    disconnect(); // ✅ unmount 时自动断开
  };
}, [disconnect]);
```

---

### 6. RealtimeDebugger 的 interval 无法清理

**问题**: `startPeriodicLog()` 创建的 interval 无 handle

**修复**:
```typescript
class RealtimeDebugger {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  startPeriodicLog() {
    if (!DEBUG_ENABLED || this.intervalId) return;
    this.intervalId = setInterval(() => {
      console.table(this.getStats());
    }, 10000);
  }

  stopPeriodicLog() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

---

## 📋 修复优先级清单

| 优先级 | 问题 | 文件 | 预估时间 |
|--------|------|------|----------|
| 🔴 P0 | ConnectionStateMachine 集成 | `marketClient.ts` | 30min |
| 🔴 P0 | Zustand selector 订阅 | `KLinePanel.tsx` + `market.store.ts` | 20min |
| 🔴 P0 | RealtimeDebug 调用点 | `tickBuffer.ts`, `marketClient.ts`, `useStreamingChat.ts` | 15min |
| 🟡 P1 | SSE Deduplicator 实例化 | `useStreamingChat.ts` | 10min |
| 🟡 P1 | useStreamingChat 清理 | `useStreamingChat.ts` | 5min |
| 🟡 P1 | Debugger interval 清理 | `realtimeDebug.ts` | 5min |

**总计修复时间**: ~1.5h

---

## 📊 代码质量统计

| 指标 | 数值 | 评价 |
|------|------|------|
| TypeScript 类型覆盖 | 100% | ✅ 优秀 |
| 单元测试 | 2 个模块 | ✅ 核心覆盖 |
| ESLint 错误 | 0 | ✅ |
| `pnpm check` | 通过 | ✅ |
| `pnpm build` | 通过 | ✅ |
| `pnpm test` | 通过 | ✅ |

---

## 🏁 结论

### 可以投入使用的条件

1. ✅ 修复 3 个 P0 问题
2. ✅ 运行 `pnpm check` + `pnpm build` + `pnpm test`
3. ✅ Dev 环境验证无双 WebSocket 连接

### 后续优化建议

1. **性能监控**: 添加 Performance panel 展示 realtimeDebug stats
2. **错误边界**: 为 KLinePanel 添加 ErrorBoundary
3. **测试增强**: 添加 SSE streaming 集成测试

---

**审阅状态**: ✅ 完成  
**下一步**: 按 P0 清单修复后即可发布
