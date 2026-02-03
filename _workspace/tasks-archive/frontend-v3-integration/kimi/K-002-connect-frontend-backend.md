# K-002: 前后端连接 (AI 聊天 + 行情数据)

## 负责 Agent: 🟠 Kimi

## ⚠️ 关键规则

1. **每步做完验证页面正常** - 不是白屏就继续
2. **每步单独 commit**
3. **出问题立即 `git checkout -- client/` 回滚并停止**

---

## 背景

当前前端是 mock 数据，需要连接到后端 tRPC API。

**后端已就绪**:
- tRPC server 在 `/api/trpc`
- WebSocket 在 `/ws`

---

## Step 1: 检查后端 API (5 分钟)

```bash
# 启动服务
pnpm dev

# 另开终端测试 API
curl "http://localhost:6888/api/trpc/stocks.list" 2>/dev/null | head -100
```

记录可用的 tRPC 端点。

---

## Step 2: 连接 AI 聊天 (15 分钟)

**文件**: `client/src/refactor_v2/hooks/useStreamingChat.ts`

**查看当前实现**:
```bash
cat client/src/refactor_v2/hooks/useStreamingChat.ts
```

**需要确认**:
1. 当前是否已经在调用 `/api/trpc/ai.chat` 或类似端点
2. 如果是 mock，改成真实 API 调用

**关键**: 只改最小必要的代码，不要重构整个文件！

**验证**:
```bash
pnpm dev
# 打开浏览器发送消息
# 查看 Network 面板是否有请求
```

**commit**:
```bash
git add client/src/refactor_v2/hooks/useStreamingChat.ts
git commit -m "feat: connect AI chat to backend tRPC"
```

---

## Step 3: 连接行情 WebSocket (15 分钟)

**文件**: `client/src/refactor_v2/realtime/marketClient.ts`

**查看当前实现**:
```bash
cat client/src/refactor_v2/realtime/marketClient.ts
```

**需要确认**:
1. WebSocket URL 是否正确 (`ws://localhost:6888/ws`)
2. 订阅消息格式是否匹配后端

**验证**:
```bash
pnpm dev
# 查看 Console 是否有 WebSocket 连接日志
```

**commit**:
```bash
git add client/src/refactor_v2/realtime/marketClient.ts
git commit -m "feat: connect market data WebSocket"
```

---

## 完成后

```bash
git log --oneline -5
pnpm check
```

报告结果。
