# A-001: Frontend-Backend Connection

## 负责 Agent: 🟣 Amp (Claude Sonnet)

## 目标

连接前端 V3 到后端 API，实现完整的数据流：
1. AI 聊天 Streaming
2. WebSocket 实时行情
3. K 线图表数据

---

## 📋 任务概述

当前前端 V3 已经有完整的 UI，但数据都是 mock 的。需要接入后端真实 API。

### 后端 API 清单

| 功能 | 端点 | 类型 | 状态 |
|------|------|------|------|
| AI 聊天 | `/api/trpc/ai.chat` | tRPC + SSE | ✅ 后端就绪 |
| 行情推送 | `ws://localhost:5000/ws` | WebSocket | ✅ 后端就绪 |
| K 线数据 | `/api/trpc/stocks.kline` | tRPC | ✅ 后端就绪 |
| 自选股 | `/api/trpc/watchlist.*` | tRPC CRUD | ✅ 后端就绪 |

---

## 步骤

### Step 1: 检查后端 Router 结构 (5 分钟)

```bash
# 查看后端 tRPC router
cat server/_core/routers/ai-router.ts
cat server/_core/routers/stocks-router.ts
cat server/_core/routers/watchlist-router.ts
```

### Step 2: 连接 AI 聊天 Streaming (30 分钟)

**目标**: 让 `useStreamingChat` hook 连接到后端 `aiRouter.chat`

**文件**: `client/src/refactor_v2/hooks/useStreamingChat.ts`

**当前状态**:
- Hook 已实现 SSE 逻辑
- 需要确认端点 URL 和请求格式

**需要做**:
1. 检查 `aiRouter.chat` 的输入/输出类型
2. 更新 `useStreamingChat` 的 fetch URL
3. 确保 SSE 事件格式匹配
4. 测试: 发送消息，验证 streaming 响应

### Step 3: 连接 WebSocket 行情 (30 分钟)

**目标**: 让 `marketClient` 接收真实 tick 数据

**文件**: `client/src/refactor_v2/services/marketClient.ts`

**需要做**:
1. 检查后端 WebSocket 服务端口和路径
2. 更新 `marketClient.ts` 的连接 URL
3. 确保消息格式匹配 (tick, orderbook, kline)
4. 测试: 订阅 `300308`，验证价格更新

### Step 4: 连接 K 线图表数据 (20 分钟)

**目标**: 让 `StockChart` 显示真实 K 线

**文件**: `client/src/refactor_v2/components/StockChart.tsx`

**需要做**:
1. 创建 `useKlineData(symbol, period)` hook 调用 tRPC
2. 在 `StockChart` 或其父组件中使用这个 hook
3. 格式转换: 后端数据 → Lightweight Charts 格式
4. 测试: 切换周期，验证图表更新

### Step 5: 验证自选股 API (10 分钟)

**目标**: 确保侧边栏自选股数据来自后端

**需要做**:
1. 检查 `Sidebar.tsx` 的自选股数据源
2. 替换 mock 数据为 tRPC 调用
3. 测试: 添加/删除自选股

---

## 验收标准

- [ ] 发送聊天消息，AI 流式回复显示正常
- [ ] 股票价格实时更新 (WebSocket)
- [ ] K 线图表显示真实数据
- [ ] 自选股增删查改正常
- [ ] 无 TypeScript 错误 (`pnpm check`)

---

## 产出文件

```
client/src/refactor_v2/hooks/useStreamingChat.ts  (修改)
client/src/refactor_v2/services/marketClient.ts   (修改)
client/src/refactor_v2/hooks/useKlineData.ts      (新建)
client/src/refactor_v2/components/StockChart.tsx  (修改)
```

---

## 调试提示

```bash
# 启动后端
cd /Users/kckylechen/Desktop/DragonFly
pnpm start:all

# 检查后端日志
# 后端 tRPC 在 http://localhost:5000/api/trpc
# WebSocket 在 ws://localhost:5000/ws

# 测试 tRPC 端点
curl http://localhost:5000/api/trpc/stocks.info?input=%7B%22symbol%22%3A%22300308%22%7D
```
