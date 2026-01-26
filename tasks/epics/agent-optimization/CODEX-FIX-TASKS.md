# Codex 修复任务清单

> **创建日期**: 2026-01-26  
> **来源**: Amp Code Review + Antigravity 测试发现

---

## 🔴 P0 - 阻塞上线

### 后端

| ID | 问题 | 文件 | 修复方案 |
|----|------|------|----------|
| B1 | 批量任务无并发限制 | `server/routers/stocks.ts` L313-404 | 用 `p-limit(4)` 包裹 `Promise.all` |
| B2 | 外部请求无超时 | `server/_core/agent/consensus-analysis.ts` L45-76 | 加 AbortController + 15s 超时 |
| B3 | ~~BaseAgent 多轮状态 bug~~ | `server/_core/agent/base-agent.ts` | ✅ 已有 `beginTurn()` |
| B4 | ~~JSON.parse 失败当成功~~ | `server/_core/agent/base-agent.ts` L511-519 | ✅ 已返回错误信息 |
| B5 | Orchestrator 模型选择不生效 | `server/_core/agent/orchestrator.ts` L152-169 | `createAgent()` 需传入 llmConfig |
| B6 | API Key 泄露风险 | `server/_core/env.ts` | 加 `if (typeof window !== "undefined") throw` |
| B7 | ~~Todo 列表重复~~ | `server/_core/session/session-store.ts` | ✅ 已修复 upsertTodoForToolCall |

### 前端

| ID | 问题 | 文件 | 修复方案 |
|----|------|------|----------|
| F1 | Watchlist N+1 请求 | `client/src/refactor_v2/components/LeftPane.tsx` L42-45 | 后端加批量接口 + 前端改用 `useStockQuotes` |
| F2 | ~~AI 面板主题不跟随~~ | `stores/theme.store.ts` | ✅ 已添加 `--panel-bg` |
| F3 | ~~CSS 变量冲突~~ | `client/src/index.css` | ✅ 已删除重复变量 |
| F4 | 请求失败错误处理 | `AIChatPanel.tsx` / `useAIStream.ts` | 优化错误消息 + 添加重试按钮 |
| F5 | 任务面板状态不同步 | `TaskExecutionPanel.tsx` | 确保 SSE 结束时更新状态 |
| F6 | 搜索框不响应面板缩放 | `LeftPane.tsx` | 检查容器 `min-width` 或改用 `flex-1` |

---

## 🟡 P1 - 影响稳定性/性能

### 后端

| ID | 问题 | 文件 | 修复方案 |
|----|------|------|----------|
| B8 | getDetail 串行改并行 | `server/routers/stocks.ts` L80-98 | 用 `Promise.all` 并行执行 4 个请求 |
| B9 | ~~Agent 内存增长~~ | `base-agent.ts` | ✅ 已有 `trimMessages()` |
| B10 | Router 同步写文件 | `learnable-router.ts` | 改用 debounce 或异步写 |
| B11 | 错误参与共识投票 | `consensus-analysis.ts` | 过滤 `ok: false` 的结果 |

### 前端

| ID | 问题 | 文件 | 修复方案 |
|----|------|------|----------|
| F7 | Zustand setTimeout 顺序 | `watchlist.store.ts` L16-27 | 用 `queueMicrotask` |
| F8 | Bundle 623KB | 多处 | lazy load 图表 + lucide 按需导入 |
| F9 | Todo 执行完成显示 2/8 | `server/routers/ai.ts` + `TaskExecutionPanel.tsx` | 工具执行完成后没有正确更新 todo 状态 |
| F10 | 搜索框不随面板缩放 | `LeftPane.tsx` | 检查容器 min-width 或宽度约束 |

---

## 修复详情

### B1: 批量任务并发限制

```typescript
// server/routers/stocks.ts
import pLimit from "p-limit";
const limit = pLimit(4);

// 修改 getTopStocks 中的 Promise.all
await Promise.all(watchlist.map(stock => 
  limit(() => processStock(stock))
));
```

### B2: 外部请求超时

```typescript
// server/_core/agent/consensus-analysis.ts
async function callModel(...) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      ...options
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
```

### B5: Orchestrator 模型配置传递

```typescript
// orchestrator.ts createAgent()
const modelConfig = this.selectModel(agentType);
return new ResearchAgent({ 
  llm: modelConfig  // 传入配置
});
```

### B6: API Key 安全隔离

```typescript
// server/_core/env.ts 顶部添加
if (typeof window !== "undefined") {
  throw new Error("server-only module imported in browser");
}
```

### B8: getDetail 并行请求

```typescript
// server/routers/stocks.ts getDetail
const [quote, rankData, stockInfo, capitalFlowData] = await Promise.all([
  getQuoteWithFallback(input.code),
  getCachedRankData(input.code),
  akshare.getStockInfo(input.code),
  fundflow.getStockFundFlow(input.code),
]);
```

### F1: 批量行情接口

```typescript
// 1. 后端 server/routers/stocks.ts 新增
getQuotes: publicProcedure
  .input(z.object({ codes: z.array(z.string()) }))
  .query(async ({ input }) => {
    const results = await Promise.all(
      input.codes.map(code => getQuoteWithFallback(code))
    );
    return Object.fromEntries(
      input.codes.map((code, i) => [code, results[i]])
    );
  })

// 2. 前端 LeftPane.tsx
const codes = watchlistItems.map(i => i.symbol);
const { data: quotesMap } = useStockQuotes(codes);
// WatchlistRow 从 quotesMap 读取
```

### F4: 请求失败错误处理

```typescript
// AIChatPanel.tsx 错误展示
{error && (
  <div className="flex items-center gap-2">
    <span>请求失败</span>
    <button onClick={retry}>重试</button>
  </div>
)}
```

### F6: 搜索框响应式

```css
/* 检查 LeftPane 容器是否有 min-width */
/* 确保搜索框父容器使用 flex-1 或 w-full */
```

### F9: Todo 执行状态不同步

问题：执行完成后显示 2/8，应该是 8/8

排查思路：
1. 检查 `server/routers/ai.ts` 中工具执行完成后是否调用 `updateTodo` 更新状态
2. 检查 SSE 流是否正确发送 todo_update 事件
3. 检查前端 `useAIStream.ts` 是否正确接收并更新状态

### F10: 搜索框不随面板缩放

问题：左侧面板缩小时搜索框宽度不变

排查：
1. 检查 `LeftPane.tsx` 第 288-298 行搜索框 CSS
2. 可能需要移除 min-width 或改用 flex 布局

---

## 验证命令

```bash
pnpm check    # TypeScript 检查
pnpm build    # 构建
pnpm test     # 运行测试
```

---

## 优先级执行顺序

1. **第一批 (30min)**: B1, B2, B8, F6
2. **第二批 (1-2h)**: B5, B6, F1, F4, F5
3. **第三批 (2h+)**: B10, B11, F7, F8
