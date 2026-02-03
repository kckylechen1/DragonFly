# L-002: 创建 Chat 类型定义

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- L-001 (依赖安装)

## 目标
- [ ] 创建 `types/chat.ts` - 消息、工具调用、SSE 事件类型
- [ ] 创建 `types/index.ts` - 导出入口

---

## 参考文档

- `tasks/FutureShop/frontend-architecture-guide.md` 第 1-100 行

---

## 步骤

### Step 1: 创建目录

```bash
mkdir -p client/src/refactor_v2/types
```

### Step 2: 创建 types/chat.ts

```typescript
// client/src/refactor_v2/types/chat.ts

/**
 * 消息角色
 */
export type MessageRole = "user" | "assistant";

/**
 * 工具调用状态
 */
export type ToolCallStatus = "pending" | "running" | "completed" | "failed";

/**
 * 工具调用
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: ToolCallStatus;
  result?: unknown;
  startTime: number;
  endTime?: number;
}

/**
 * 思考步骤
 */
export interface ThinkingStep {
  title: string;
  summary: string;
  completed: boolean;
}

/**
 * 聊天消息
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  thinking?: ThinkingStep[];
}

/**
 * SSE 事件类型
 */
export type SSEEventType =
  | "message_start"
  | "content_delta"
  | "thinking_delta"
  | "tool_request"
  | "tool_result"
  | "message_complete"
  | "error";

/**
 * SSE 事件（带 seq 用于去重）
 */
export interface SSEEvent {
  type: SSEEventType;
  conversationId: string;
  messageId: string;
  seq: number;
  data: unknown;
}

/**
 * 聊天输入模式
 */
export type ChatMode = "analyze" | "trade" | "learn";
```

### Step 3: 创建 types/index.ts

```typescript
// client/src/refactor_v2/types/index.ts

export * from "./chat";
```

### Step 4: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `types/chat.ts` 已创建
- [ ] `types/index.ts` 已创建并导出
- [ ] `pnpm check` 通过
- [ ] 所有类型都有 JSDoc 注释

---

## 产出文件

- `client/src/refactor_v2/types/chat.ts`
- `client/src/refactor_v2/types/index.ts`
