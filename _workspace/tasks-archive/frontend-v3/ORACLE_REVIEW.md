# 🔮 Oracle 深度评审报告

> **评审日期**: 2026-01-30  
> **评审范围**: Frontend V3 重构方案  
> **评审文档**: FRONTEND_REFACTOR_REVIEW.md, 任务分配文件, 架构指南  
> **结论**: ✅ 方向正确，⚠️ 需补齐护栏后启动

---

## 📊 总体评价

| 维度 | 评分 | Oracle 评语 |
|------|------|-------------|
| 架构设计 | ⭐⭐⭐⭐ | 三栏 + 面板插件化方向正确 |
| 实时数据策略 | ⭐⭐⭐⭐ | WS/SSE 分离 + tickBuffer+rAF 符合高频场景 |
| 性能优化 | ⭐⭐⭐ | 方向对，但缺硬约束和降级开关 |
| 连接管理 | ⭐⭐ | 缺幂等性、重连语义、背压策略 |
| 任务分解 | ⭐⭐⭐⭐ | 结构好，缺集成闸门和冲突规避 |
| 可观测性 | ⭐⭐ | 无 debug 日志，问题定位困难 |

**Oracle 结论**: 可以启动过夜任务，但建议先执行 **Wave 0 (1-3h)** 补齐关键护栏。

---

## ✅ Oracle 认可的设计决策

### 1. 架构层面

| 决策 | Oracle 评价 |
|------|-------------|
| 三栏布局 (Sidebar + Chat + Stock) | ✅ 布局合理，插件化面板设计优秀 |
| WS (行情) / SSE (对话) 分离 | ✅ 正确的通道分离，各司其职 |
| Zustand 状态管理 | ✅ 选型正确，适合高频更新场景 |
| React Query 缓存 REST 数据 | ✅ 标准做法，减少重复请求 |
| TradingView Lightweight Charts | ✅ 金融图表的业界标准选择 |

### 2. 性能策略

| 决策 | Oracle 评价 |
|------|-------------|
| tickBuffer + rAF 批处理 | ✅ 正确防止 React 重渲染风暴 |
| 图表 imperative 更新 | ✅ 绕过 React state 是必须的 |
| 面板懒加载 (dynamic import) | ✅ 减少首屏 bundle 体积 |
| Effect budget 概念 | ✅ 方向对，需落地为硬约束 |

### 3. 任务分解

| 决策 | Oracle 评价 |
|------|-------------|
| 4 Agent 分工 (GLM/Codex/Droid/Amp) | ✅ 按能力分配合理 |
| Wave 1-4 执行顺序 | ✅ 依赖关系正确 |
| 每个任务独立文件 | ✅ 符合 Playbook 规范 |
| ISSUES.md 阻塞记录 | ✅ 有问题处理机制 |

---

## 🔴 必须补齐的问题 (Wave 0)

### 1. 连接管理层缺失

**问题**: marketClient / chatClient 缺少完整的连接生命周期管理

**风险**: 
- React 18 StrictMode 双执行 effect → 双连接/双订阅
- 断线后无法自动恢复订阅列表
- 无心跳检测，静默断连无法感知

**解决方案**:

```typescript
// realtime/connectionStateMachine.ts
type ConnectionState = 
  | 'IDLE'
  | 'CONNECTING' 
  | 'OPEN' 
  | 'RECONNECTING' 
  | 'CLOSED' 
  | 'ERROR';

interface ConnectionManager {
  state: ConnectionState;
  connect(): void;
  disconnect(): void;
  subscribe(symbol: string): void;
  unsubscribe(symbol: string): void;
  
  // 关键：幂等性保证
  isConnecting(): boolean;
  getActiveSubscriptions(): Set<string>;
}

// 实现要点：
// 1. connect() 必须幂等：if (state === 'CONNECTING' || state === 'OPEN') return;
// 2. 重连后自动重放 subscriptions
// 3. 心跳检测：每 30s ping，超时 10s 判定断连
```

**新增任务**: `C-000-connection-state-machine.md` (Codex, 45min)

---

### 2. 背压策略未定义

**问题**: tickBuffer 缺少上限策略，极端行情下会"越积越多"

**风险**:
- 内存持续增长
- 处理延迟越来越大
- 最终 OOM 或 UI 完全卡死

**解决方案**:

```typescript
// realtime/tickBuffer.ts
const TICK_BUFFER_CONFIG = {
  flushHz: 10,           // 100ms flush 一次
  maxTicksPerFlush: 100, // 每帧最多处理 100 条
  dropPolicy: 'keep-latest' as const, // 超限时只保留每 symbol 最新 tick
};

class TickBuffer {
  private buffer: Map<string, MarketTick[]> = new Map();
  private stats = { ticksIn: 0, ticksDropped: 0 };
  
  push(symbol: string, tick: MarketTick) {
    this.stats.ticksIn++;
    const symbolBuffer = this.buffer.get(symbol) || [];
    
    // 背压策略：每 symbol 只保留最新 N 条
    if (symbolBuffer.length >= 10) {
      this.stats.ticksDropped += symbolBuffer.length - 1;
      this.buffer.set(symbol, [tick]); // 只保留最新
    } else {
      symbolBuffer.push(tick);
      this.buffer.set(symbol, symbolBuffer);
    }
  }
  
  flush(): Map<string, MarketTick> {
    const latest = new Map<string, MarketTick>();
    for (const [symbol, ticks] of this.buffer) {
      if (ticks.length > 0) {
        latest.set(symbol, ticks[ticks.length - 1]); // 只取最新
      }
    }
    this.buffer.clear();
    return latest;
  }
  
  getStats() { return { ...this.stats }; }
}
```

**更新任务**: `C-001-tick-buffer.md` 添加背压策略

---

### 3. SSE 去重窗口未定义

**问题**: seq/eventId 去重提到了，但未定义窗口大小和作用域

**风险**:
- 缓存无限增长 → 内存泄漏
- 跨 conversation 的 eventId 冲突

**解决方案**:

```typescript
// realtime/sseDeduplicator.ts
const SSE_DEDUP_CONFIG = {
  maxWindowSize: 2000,     // 只保留最近 2000 个 eventId
  scopeBy: 'conversation', // 按 conversation 隔离
};

class SSEDeduplicator {
  private seen: Map<string, Set<string>> = new Map(); // conversationId -> Set<eventId>
  
  isDuplicate(conversationId: string, eventId: string): boolean {
    const scope = this.seen.get(conversationId) || new Set();
    
    if (scope.has(eventId)) {
      return true;
    }
    
    // 窗口滑动：超过上限时清理最旧的一半
    if (scope.size >= SSE_DEDUP_CONFIG.maxWindowSize) {
      const arr = Array.from(scope);
      const keep = arr.slice(arr.length / 2);
      this.seen.set(conversationId, new Set(keep));
    }
    
    scope.add(eventId);
    this.seen.set(conversationId, scope);
    return false;
  }
  
  clearConversation(conversationId: string) {
    this.seen.delete(conversationId);
  }
}
```

**更新任务**: `C-003-streaming-chat.md` 添加去重窗口实现

---

### 4. 集成闸门缺失

**问题**: 过夜执行无法定位是哪一波引入问题

**风险**:
- 第二天发现问题，无法快速回滚到稳定点
- 多 Agent 并行改动，合并冲突难以追溯

**解决方案**:

每个 Wave 结束时执行:

```bash
# Wave N Checkpoint
pnpm check
pnpm test -- --grep "core"  # 核心模块测试
pnpm build

# 打标签
git add .
git commit -m "checkpoint: wave-N complete"
git tag wave-N-checkpoint
```

**新增文件**: 在每个 Agent Guide 中添加 Checkpoint 章节

```markdown
## 🚦 Wave Checkpoint

每完成一个 Wave 后，执行：

1. `pnpm check` - 类型检查通过
2. `pnpm test` - 核心测试通过
3. `pnpm build` - 构建成功
4. `git commit -m "checkpoint: wave-X complete"`

⚠️ 如果任何一步失败，停止并记录到 ISSUES.md
```

---

### 5. 性能开关未硬编码

**问题**: Effect budget 只是概念，无法实际执行

**风险**:
- UI 特效吞掉 rAF batching 的性能红利
- 用户无法在低端设备降级

**解决方案**:

```typescript
// stores/performance.store.ts
interface PerformanceState {
  performanceMode: 'full' | 'reduced' | 'minimal';
  prefersReducedMotion: boolean;
  
  // 计算属性
  shouldAnimate: boolean;
  shouldBlur: boolean;
  shouldGlow: boolean;
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  performanceMode: 'full',
  prefersReducedMotion: 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false,
  
  get shouldAnimate() {
    const s = get();
    return s.performanceMode === 'full' && !s.prefersReducedMotion;
  },
  
  get shouldBlur() {
    return get().performanceMode === 'full';
  },
  
  get shouldGlow() {
    return get().performanceMode !== 'minimal';
  },
}));

// 使用示例
const PriceDisplay = ({ price, change }) => {
  const shouldGlow = usePerformanceStore(s => s.shouldGlow);
  
  return (
    <span className={cn(
      'font-mono',
      change > 0 ? 'text-up' : 'text-down',
      shouldGlow && 'neon-glow-subtle' // 条件应用特效
    )}>
      {price}
    </span>
  );
};
```

**新增任务**: `D-000-performance-mode-toggle.md` (Droid, 30min)

---

### 6. 可观测性不足

**问题**: 无 debug 日志，第二天无法判断是渲染慢还是数据堆积

**风险**:
- 问题定位耗时 2-4x
- 无法区分前端/后端问题

**解决方案**:

```typescript
// realtime/realtimeDebug.ts
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
  
  recordTick(dropped: boolean = false) {
    if (!DEBUG_ENABLED) return;
    this.stats.ticksIn++;
    if (dropped) this.stats.ticksDropped++;
  }
  
  recordFlush(durationMs: number) {
    if (!DEBUG_ENABLED) return;
    this.stats.flushCount++;
    this.flushTimes.push(durationMs);
    if (this.flushTimes.length > 100) this.flushTimes.shift();
    this.stats.avgFlushMs = 
      this.flushTimes.reduce((a, b) => a + b, 0) / this.flushTimes.length;
    
    // 性能警告
    if (durationMs > 16) {
      console.warn(`[realtime] flush took ${durationMs.toFixed(1)}ms (>16ms frame budget)`);
    }
  }
  
  setWsState(state: string) { this.stats.wsState = state; }
  setSseState(state: string) { this.stats.sseState = state; }
  setError(error: string) { this.stats.lastError = error; }
  
  getStats(): RealtimeStats { return { ...this.stats }; }
  
  // 每 10s 输出一次摘要
  startPeriodicLog() {
    if (!DEBUG_ENABLED) return;
    setInterval(() => {
      console.log('[realtime stats]', this.getStats());
    }, 10000);
  }
}

export const realtimeDebug = new RealtimeDebugger();
```

**新增任务**: `C-002-market-client.md` 集成 realtimeDebug

---

## 🟡 额外风险点及护栏

### 1. React 18 StrictMode 双执行

**问题**: dev 环境下 effect 执行两次，WS/SSE 连接代码如果没做幂等，会出现双连接

**护栏**:

```typescript
// ❌ 错误做法
useEffect(() => {
  const ws = new WebSocket(url);
  return () => ws.close();
}, []);

// ✅ 正确做法
useEffect(() => {
  // 使用状态机管理，确保幂等
  if (marketClient.isConnecting() || marketClient.isOpen()) {
    return;
  }
  marketClient.connect();
  return () => marketClient.disconnect();
}, []);
```

**验证方法**: 在 dev 环境打开 React DevTools，确认只有一个 WS 连接

---

### 2. localStorage 拖拽写入阻塞

**问题**: `react-resizable-panels` 的 autoSave 可能在拖拽过程中频繁写入 localStorage

**护栏**:

```typescript
// 使用 onLayout 而非 autoSaveId，手动 debounce
const saveLayout = useDebouncedCallback((sizes: number[]) => {
  localStorage.setItem('panel-layout', JSON.stringify(sizes));
}, 500);

<PanelGroup onLayout={saveLayout}>
  ...
</PanelGroup>
```

---

### 3. Resize 事件风暴

**问题**: 图表容器 resize + panel 切换 + sidebar 动画，会触发图表 resize() 频繁调用

**护栏**:

```typescript
// hooks/useThrottledResize.ts
export function useThrottledResize(
  ref: RefObject<HTMLElement>,
  callback: (width: number, height: number) => void
) {
  useEffect(() => {
    if (!ref.current) return;
    
    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { width, height } = entries[0].contentRect;
        callback(width, height);
      });
    });
    
    observer.observe(ref.current);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [ref, callback]);
}
```

---

### 4. Zustand 高频写入 GC 抖动

**问题**: `{ ...state.data, [symbol]: tick }` 高频扩展对象会触发大量 GC

**护栏**:

```typescript
// ❌ 错误做法
set(state => ({
  data: { ...state.data, [symbol]: tick }
}));

// ✅ 正确做法：使用 immer 或只更新引用
import { produce } from 'immer';

set(produce(state => {
  state.data[symbol] = tick;
}));

// 或者更激进：store 只存"当前 symbol"的数据
set({ currentTick: tick }); // 而非 data[symbol]
```

---

## 📋 Wave 0 任务清单

在发起过夜任务前，必须完成以下 Wave 0 任务（预计 2-3h）：

| 序号 | 任务 | 负责 | 预计时间 | 优先级 |
|------|------|------|----------|--------|
| W0-1 | 创建 `connectionStateMachine.ts` | Codex | 45min | 🔴 P0 |
| W0-2 | 更新 `C-001` 添加背压策略 | Codex | 20min | 🔴 P0 |
| W0-3 | 更新 `C-003` 添加去重窗口 | Codex | 20min | 🔴 P0 |
| W0-4 | 创建 `realtimeDebug.ts` | Codex | 20min | 🟡 P1 |
| W0-5 | 创建 `PerformanceModeToggle` 组件 | Droid | 30min | 🔴 P0 |
| W0-6 | 创建 `performance.store.ts` | GLM | 20min | 🔴 P0 |
| W0-7 | 更新所有 Guide 添加 Checkpoint | Amp | 15min | 🟡 P1 |
| W0-8 | 定义文件所有权表 | Amp | 10min | 🟡 P1 |

**总计**: ~3h

---

## 📁 文件所有权表

为避免并行改动冲突，明确各 Agent 的文件所有权：

| 目录/文件 | 所有者 | 其他 Agent 权限 |
|-----------|--------|----------------|
| `realtime/*` | Codex | 只读 |
| `hooks/useStreaming*.ts` | Codex | 只读 |
| `hooks/useMarketWebSocket.ts` | Codex | 只读 |
| `components/panels/KLinePanel.tsx` | Codex | 只读 |
| `types/*` | GLM | Codex 可扩展 |
| `stores/*` | GLM | Codex 可扩展 market.store |
| `components/layout/*` | GLM | 只读 |
| `components/chat/*` | GLM | Codex 可扩展 ToolCard |
| `components/panels/*` (除 KLine) | GLM | 只读 |
| `styles/*` | Droid | 只读 |
| `components/settings/*` | Droid | 只读 |

---

## ⚡ 性能预算表

| 指标 | 预算 | 警告阈值 | 护栏 |
|------|------|----------|------|
| 帧时间 | <16ms | >12ms | console.warn |
| Tick flush | <8ms | >5ms | 丢弃旧 tick |
| SSE parse | <2ms | >1ms | - |
| 组件渲染 | <4ms | >3ms | React.memo |
| 最大 blur 元素 | 2 | 3 | lint 规则 |
| 最大 text-shadow | 3 | 5 | lint 规则 |
| 订单簿行数 | 虚拟列表 | - | 强制使用 |

---

## 🔄 回滚策略

### 方案 A: 按 Wave 回滚

```bash
# 查看所有 checkpoint
git tag -l "wave-*"

# 回滚到特定 Wave
git reset --hard wave-2-checkpoint
```

### 方案 B: 按文件回滚

```bash
# 只回滚特定目录
git checkout wave-1-checkpoint -- client/src/refactor_v2/realtime/
```

### 方案 C: 创建修复分支

```bash
git checkout -b fix/frontend-v3-issues
# 在新分支上修复，验证后合并
```

---

## ✅ 启动前检查清单

- [ ] Wave 0 所有任务完成
- [ ] `connectionStateMachine.ts` 已创建并测试
- [ ] `PerformanceModeToggle` 组件已实现
- [ ] 每个 Agent Guide 已添加 Checkpoint 章节
- [ ] 文件所有权表已添加到 README
- [ ] `pnpm check` 通过
- [ ] `pnpm build` 成功
- [ ] Dev 环境验证无双 WS 连接

---

## 📚 参考资料

- [React 18 StrictMode 行为](https://react.dev/reference/react/StrictMode)
- [Zustand 性能优化](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)
- [SSE Last-Event-ID 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [requestAnimationFrame 批处理模式](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

---

**评审状态**: ✅ 完成  
**下一步**: 执行 Wave 0 → 重新检查 → 发起过夜任务
