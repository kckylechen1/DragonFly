# 🔵 GLM 任务指南: AI 前端集成 + Agent 增强

> **负责 Agent**: GLM-4.7  
> **预计时间**: 3-4 小时  
> **并行组**: A (与 Codex 并行执行 Phase 1)

---

## ⚠️ 重要提醒

```
按 AI-COLLAB-PLAYBOOK 工作
遇到问题立即停下，不要猜测
每完成一个任务运行 pnpm check 验证
```

---

## ⚠️ 文件所有权声明

### ✅ 本任务拥有 (可修改)
- `client/src/refactor_v2/components/FloatingAIChatInput.tsx`
- `client/src/refactor_v2/components/AIChatPanel.tsx`
- `client/src/refactor_v2/stores/aiChat.store.ts`
- `server/_core/agent/orchestrator.ts` (Phase 4)

### 🔒 只读参考 (不要修改)
- `client/src/refactor_v2/api/ai.ts`
- `client/src/refactor_v2/api/client.ts`
- `server/routers/ai.ts` (Codex 负责)
- `server/_core/llm.ts` (Codex 负责)

### 🚫 禁止触碰 (Codex 负责)
- `client/src/refactor_v2/api/useAIStream.ts`
- `server/_core/model-router.ts`

---

## 📋 任务清单

### GLM-001: FloatingAIChatInput 连接真实 API [Phase 1]

**目标**: 移除 mock，调用真实 AI API

**Step 1: 理解现状**

查看当前文件:
```bash
cat client/src/refactor_v2/components/FloatingAIChatInput.tsx
```

找到第 38-43 行的 mock 代码:
```typescript
setTimeout(() => {
  addMessage({
    role: "assistant",
    content: "这是 AI 的示例回答。在实际实现中，这里会调用 AI API。",
  });
}, 1000);
```

**Step 2: 导入 API Hook**

在文件顶部添加:
```typescript
import { useSendMessage } from "@/refactor_v2/api";
```

**Step 3: 使用 Hook**

在组件内部添加:
```typescript
const sendMessageMutation = useSendMessage();
```

**Step 4: 替换 handleSend 函数**

```typescript
const handleSend = async () => {
  if (!input.trim()) return;
  if (sendMessageMutation.isPending) return; // 防止重复发送

  // 1. 添加用户消息
  addMessage({
    role: "user",
    content: input,
  });
  
  const userMessage = input;
  setInput(""); // 立即清空输入框
  open(); // 打开面板

  try {
    // 2. 调用真实 API
    const result = await sendMessageMutation.mutateAsync({
      messages: [{ role: "user", content: userMessage }],
      // stockCode: selectedStock?.code, // 如果有选中的股票
    });
    
    // 3. 添加 AI 响应
    addMessage({
      role: "assistant",
      content: result.content || "抱歉，暂时无法获取回复。",
    });
  } catch (error) {
    console.error("AI 请求失败:", error);
    addMessage({
      role: "assistant",
      content: "❌ 请求失败，请稍后重试。",
    });
  }
};
```

**Step 5: 验证**
```bash
pnpm check
```

---

### GLM-002: AIChatPanel 加载状态和错误处理 [Phase 1]

**目标**: 添加加载状态显示

**Step 1: 添加 Store 状态**

修改 `client/src/refactor_v2/stores/aiChat.store.ts`:

```typescript
interface AIChatStore {
  messages: Message[];
  isLoading: boolean;  // 新增
  error: string | null; // 新增
  
  addMessage: (msg: Omit<Message, "id">) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void; // 新增
  setError: (error: string | null) => void; // 新增
}
```

在 store 实现中添加:
```typescript
isLoading: false,
error: null,

setLoading: (loading) => set({ isLoading: loading }),
setError: (error) => set({ error }),
```

**Step 2: 在 FloatingAIChatInput 中使用**

```typescript
const { addMessage, setLoading, setError } = useAIChatStore();

const handleSend = async () => {
  // ...
  setLoading(true);
  setError(null);
  
  try {
    const result = await sendMessageMutation.mutateAsync({...});
    addMessage({ role: "assistant", content: result.content });
  } catch (error) {
    setError("请求失败，请稍后重试");
    addMessage({ role: "assistant", content: "❌ 请求失败" });
  } finally {
    setLoading(false);
  }
};
```

**Step 3: 在 AIChatPanel 中显示加载状态**

修改 `AIChatPanel.tsx`:

```typescript
const { messages, isLoading, error, clearMessages } = useAIChatStore();

// 在消息列表末尾添加加载指示器
{isLoading && (
  <div className="flex justify-start">
    <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded-lg">
      <span className="animate-pulse">AI 正在思考...</span>
    </div>
  </div>
)}

{error && (
  <div className="text-center text-red-400 text-sm py-2">
    {error}
  </div>
)}
```

**Step 4: 验证**
```bash
pnpm check
```

---

### GLM-003: Orchestrator 模型选择增强 [Phase 4]

> ⚠️ 等待 Codex 完成 Phase 3 (model-router.ts) 后再开始

**目标**: 让 Orchestrator 为不同子 Agent 选择合适的模型

**前置条件**: 确认 `server/_core/model-router.ts` 已存在

**Step 1: 导入模型选择器**

修改 `server/_core/agent/orchestrator.ts`:

```typescript
import { selectModelForTask, ModelPreference } from "../model-router";
```

**Step 2: 修改 createAgent 方法**

```typescript
private createAgent(type: string): BaseAgent {
  // 根据 Agent 类型选择最佳模型
  const modelPreference = this.getModelPreferenceForAgent(type);
  
  switch (type) {
    case "research":
      return new ResearchAgent({ preferredModel: modelPreference });
    case "analysis":
      return new AnalysisAgent({ preferredModel: modelPreference });
    case "backtest":
      return new BacktestAgent({ preferredModel: modelPreference });
    default:
      return new AnalysisAgent({ preferredModel: modelPreference });
  }
}

private getModelPreferenceForAgent(type: string): ModelPreference {
  switch (type) {
    case "research":
      // 调研任务用 Grok (擅长实时搜索)
      return { provider: "grok", reason: "实时搜索能力" };
    case "analysis":
      // 分析任务用 GLM (便宜快速)
      return { provider: "glm", reason: "高性价比" };
    case "backtest":
      // 回测任务用 DeepSeek (擅长推理)
      return { provider: "deepseek", reason: "强推理能力" };
    default:
      return { provider: "glm", reason: "默认选择" };
  }
}
```

**Step 3: 验证**
```bash
pnpm check
```

---

## ✅ 完成检查清单

```
[ ] GLM-001: FloatingAIChatInput 连接 API
    [ ] 移除 setTimeout mock
    [ ] 导入并使用 useSendMessage
    [ ] pnpm check 通过

[ ] GLM-002: 加载状态和错误处理
    [ ] Store 添加 isLoading/error 状态
    [ ] FloatingAIChatInput 设置加载状态
    [ ] AIChatPanel 显示加载指示器
    [ ] pnpm check 通过

[ ] GLM-003: Orchestrator 模型选择 (Phase 4)
    [ ] 确认 model-router.ts 已完成
    [ ] 导入模型选择器
    [ ] 为不同 Agent 选择不同模型
    [ ] pnpm check 通过
```

---

## 🛑 阻塞处理

如果遇到以下情况，**立即停下并记录**:

1. **类型错误**: 如果 `useSendMessage` 返回类型与预期不符
2. **Store 不存在**: 如果 `aiChat.store.ts` 结构不同于预期
3. **Phase 4 依赖**: 如果 `model-router.ts` 不存在，GLM-003 必须等待

记录格式:
```
### 🔴 阻塞: [任务ID]

**时间**: YYYY-MM-DD HH:MM
**问题描述**: ...
**尝试的解决方案**: ...
**需要的帮助**: ...
```

---

## 📤 完成后

1. 确保所有任务 `pnpm check` 通过
2. 在 README.md 更新任务状态
3. 提交代码:
```bash
git add -A
git commit -m "feat(ai): GLM 完成前端 AI 集成和 Orchestrator 增强"
```

---

**任务版本**: v1.0  
**创建时间**: 2026-01-20 21:36
