# C-008: 前后端连接 (分步执行)

## 负责 Agent: 🟢 Codex

## ⚠️ 重要规则

1. **每步做完必须验证** - 运行 `pnpm dev` 确认页面正常
2. **每步单独 commit** - 不要累积多个改动
3. **遇到问题立即停止** - 不要尝试自己修复，记录问题并停止

---

## Step 1: 验证当前状态 (必做)

```bash
cd /Users/kckylechen/Desktop/DragonFly
pnpm dev
```

**可忽略的警告**:
- ✅ `OAUTH_SERVER_URL is not configured` - 正常，OAuth 是可选功能
- ✅ `Port 6888 is busy, using port 68XX` - 正常，用显示的端口访问即可

**打开显示的端口** (如 http://localhost:6891)

**验收条件**:
- 页面显示正常（有侧边栏、聊天区域）
- 没有白屏或无限刷新
- 如果白屏，停止；否则继续 Step 2

---

## Step 2: 检查后端 tRPC 端点

```bash
# 查看可用的 tRPC router
cat server/_core/routers/index.ts
```

记录可用的 router 和 procedure 名称。

---

## Step 3: 连接 AI 聊天 (最小改动)

**目标**: 让聊天消息发送到后端

**文件**: `client/src/refactor_v2/hooks/useStreamingChat.ts`

**只改这一行** (找到 fetch URL):
```typescript
// 原来可能是 mock 或 /api/chat
// 改成 tRPC 端点
const response = await fetch('/api/trpc/ai.chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: input })
});
```

**验证**:
```bash
pnpm dev
# 发送一条消息，查看 Network 面板是否有请求发出
# 如果页面白屏，立即 git checkout -- client/ 回滚
```

**commit**:
```bash
git add client/src/refactor_v2/hooks/useStreamingChat.ts
git commit -m "feat: connect chat to backend tRPC endpoint"
```

---

## Step 4: 连接行情数据 (如果 Step 3 成功)

**目标**: 显示真实股票价格

**文件**: `client/src/refactor_v2/realtime/marketClient.ts`

**只改** WebSocket URL:
```typescript
// 找到 WebSocket 连接代码
const ws = new WebSocket('ws://localhost:6888/ws');
```

**验证**:
```bash
pnpm dev
# 查看股票面板是否有价格更新
# Console 里是否有 WebSocket 连接日志
```

**commit**:
```bash
git add client/src/refactor_v2/realtime/marketClient.ts
git commit -m "feat: connect market data WebSocket"
```

---

## 完成后汇报

执行完成后，运行:
```bash
git log --oneline -5
pnpm check
```

并截图证明应用正常运行。
