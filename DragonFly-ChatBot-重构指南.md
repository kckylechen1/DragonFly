# DragonFly AI 股票聊天机器人重构指南

> 参考 OpenClaw 架构，将 DragonFly 打造成专业的 AI 股票分析聊天机器人

---

## 🧠 Oracle 架构建议 (核心指导原则)

### 整体策略
> **增量包装，而非重写**：用新的 AgentRunner 包装现有的 `smartStreamChat.ts`、`SessionStore` 和 `stockTools.ts`，而不是重写它们。

### 三层架构设计

| 层 | 职责 | 原则 |
|----|------|------|
| **AgentRunner** | 编排器：加载会话、构建 prompt、协调 LLM 流、发射事件 | 保持"薄"，只做状态机协调 |
| **ToolExecutor** | 安全边界：输入验证、权限检查、错误规范化、输出截断 | **唯一**可以调用 stockTools 的地方 |
| **StreamHandler** | 传输适配：事件格式转换、背压缓冲、token 合并 | 保持"笨"，无业务逻辑 |

### StreamEvent 设计原则

1. **Append-only 语义**：事件永远不需要"修补历史"，UI 应该能通过 reduce 事件得到状态
2. **稳定 ID**：`runId` + `toolCallId` 必须一致，防止 UI 闪烁或重复
3. **Schema 版本化**：包含 `eventVersion: 1`，为未来扩展预留
4. **大小保护**：股票数据可能很大，分离 `summary`（用于展示）和 `raw`（存储引用）

### 股票聊天机器人特有风险

| 风险 | 防护措施 |
|------|----------|
| **工具输出过大** | 截断 + 摘要后再发送给模型和 UI |
| **数据时效性** | 工具结果添加 `{ asOf, source, latencyMs }` 元数据 |
| **Prompt 注入** | 系统提示中指示模型不执行来自工具输出的指令 |
| **并行工具调用** | 先用**顺序执行**，后期再加并行 |
| **取消支持** | 必须端到端支持（abort fetch、abort 模型流） |
| **合规/信任** | 工具卡片必须标注数据来源和"截止时间" |

### useChat 状态管理

> **核心建议**：把流式状态当作 StreamEvent 的 Reducer 来处理

```typescript
// 推荐的内部状态结构
interface ChatState {
  messages: ChatMessage[];
  toolCalls: Record<string, ToolCallState>;  // by toolCallId
  runs: Record<string, RunState>;            // by runId
  activeRunId?: string;
}

// API
sendMessage(text)  // 开始 run，订阅流
cancel()           // 中止活跃 run (重要！股票工具可能很慢)
retry(runId)       // 可选，后期加
```

### 何时考虑高级方案

只有遇到以下情况才需要更复杂的架构：
- 需要**并行工具执行**（顺序执行太慢）
- 需要**可重放的运行**（持久化所有事件用于调试）
- 需要**多智能体**分析（规划者/评论者分离）

---

## 📊 现状分析

### 你已有的优势

| 模块 | 现有实现 | 状态 |
|------|----------|------|
| **Session 管理** | `server/_core/session/session-store.ts` | ✅ 完善 |
| **Stock Tools** | `server/_core/stockTools.ts` (1700+ 行) | ✅ 丰富 |
| **流式聊天** | `server/_core/smartStreamChat.ts` | ✅ 可用 |
| **Agent 系统** | `server/_core/agent/` | ✅ 基础完成 |
| **tRPC API** | `server/routers/ai.ts` | ✅ 可用 |
| **前端组件** | `client/src/components/chat/` | ⚠️ 需优化 |

### 与 OpenClaw 的差距

| OpenClaw 特性 | DragonFly 现状 | 优先级 |
|---------------|----------------|--------|
| 工具执行可视化 (Tool UI) | 有 TodoRun 但展示弱 | 🔴 高 |
| 流式 Markdown 渲染 | 基础实现 | 🟡 中 |
| 多轮对话上下文压缩 | 未实现 | 🟡 中 |
| 会话历史列表 | 未实现 | 🔴 高 |
| 代码块高亮 | 未实现 | 🟢 低 |

---

## 🎯 重构目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ ChatPanel    │  │ SessionList  │  │ ToolExecution    │  │
│  │ (对话界面)    │  │ (历史会话)    │  │ (工具调用可视化)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket / tRPC
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Agent Runner                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ SessionMgr   │  │ ToolExecutor │  │ StreamHandler    │  │
│  │ (会话管理)    │  │ (工具执行)    │  │ (流式输出)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Stock Tools                        │  │
│  │  search_stock | get_quote | analyze | backtest       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI Providers                            │
│        GLM-4 / Grok / DeepSeek / OpenAI / Claude            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 文件结构规划

```
dragonfly/
├── server/
│   ├── _core/
│   │   ├── agent/
│   │   │   ├── runner.ts          # 🆕 Agent 运行器 (类似 pi-embedded-runner)
│   │   │   ├── tool-executor.ts   # 🆕 工具执行器 (带可视化事件)
│   │   │   ├── stream-handler.ts  # 🆕 流式输出处理器
│   │   │   └── types.ts           # 现有，需扩展
│   │   ├── session/
│   │   │   ├── session-store.ts   # 现有 ✅
│   │   │   ├── compaction.ts      # 🆕 上下文压缩
│   │   │   └── transcript.ts      # 🆕 对话记录导出
│   │   ├── stockTools.ts          # 现有 ✅
│   │   └── smartStreamChat.ts     # 现有，需重构
│   └── routers/
│       └── ai.ts                  # 现有，需扩展
│
├── client/
│   └── src/
│       ├── components/
│       │   ├── chat/
│       │   │   ├── ChatPanel.tsx       # 🔄 重构
│       │   │   ├── MessageList.tsx     # 🆕 消息列表
│       │   │   ├── MessageBubble.tsx   # 🆕 消息气泡
│       │   │   ├── ToolCallCard.tsx    # 🆕 工具调用卡片
│       │   │   ├── StreamingText.tsx   # 🆕 流式文本渲染
│       │   │   └── SessionSidebar.tsx  # 🆕 会话侧边栏
│       │   └── ui/                     # 现有 ✅
│       ├── hooks/
│       │   ├── useChat.ts              # 🆕 聊天核心 Hook
│       │   ├── useStreamingMessage.ts  # 🆕 流式消息 Hook
│       │   └── useSessions.ts          # 🆕 会话管理 Hook
│       └── stores/
│           └── chatStore.ts            # 🆕 聊天状态管理
```

---

## 🔧 Phase 1: 后端重构 (预计 2-3 天)

### 1.1 创建 Agent Runner (编排层)

```typescript
// server/_core/agent/runner.ts

import type { Session } from "../session/session-store";
import type { StreamEvent } from "./types";
import { ToolExecutor } from "./tool-executor";
import { smartStreamChat } from "../smartStreamChat"; // 包装现有实现

export interface AgentRunParams {
  sessionId: string;
  message: string;
  stockCode?: string;
  stockContext?: StockContextData;
  thinkHard?: boolean;
  abortSignal?: AbortSignal;  // 取消支持
}

export async function* runAgent(
  params: AgentRunParams
): AsyncGenerator<StreamEvent> {
  const runId = crypto.randomUUID();
  const toolExecutor = new ToolExecutor();
  
  // 1. 发射 run 开始事件
  yield { 
    type: "run_start", 
    runId, 
    sessionId: params.sessionId,
    eventVersion: 1 
  };
  
  try {
    // 2. 获取或创建 Session
    const session = await resolveSession(params.sessionId);
    
    // 3. 构建上下文 (复用现有逻辑)
    const context = buildContext(session, params);
    
    // 4. 包装现有的 smartStreamChat，转换为 StreamEvent
    for await (const event of wrapSmartStreamChat(context, {
      runId,
      toolExecutor,
      abortSignal: params.abortSignal,
    })) {
      yield event;
    }
    
    // 5. 保存会话
    await saveSession(session);
    
    yield { 
      type: "run_end", 
      runId, 
      usage: session.metadata.tokenUsage,
      status: "completed" 
    };
  } catch (error) {
    yield { 
      type: "error", 
      runId, 
      message: error.message,
      code: error.code 
    };
    yield { type: "run_end", runId, usage: {}, status: "failed" };
  }
}
```

### 1.2 创建 Tool Executor (安全边界)

```typescript
// server/_core/agent/tool-executor.ts

import { stockTools, executeStockTool } from "../stockTools";
import { z } from "zod";

export interface ToolResult {
  success: boolean;
  summary: string;       // 用于 UI 展示的摘要
  rawData?: any;         // 原始数据 (可能被截断)
  meta: {
    asOf: string;
    source: string;
    latencyMs: number;
    truncated: boolean;
  };
}

export class ToolExecutor {
  private static MAX_RESULT_LENGTH = 2000;  // 截断阈值
  
  async execute(
    toolName: string, 
    args: Record<string, any>
  ): Promise<ToolResult> {
    const startTime = Date.now();
    
    // 1. 验证工具存在
    const tool = stockTools.find(t => t.function.name === toolName);
    if (!tool) {
      return this.errorResult(`Unknown tool: ${toolName}`, startTime);
    }
    
    // 2. 验证参数 (使用 zod)
    try {
      this.validateArgs(tool, args);
    } catch (e) {
      return this.errorResult(`Invalid args: ${e.message}`, startTime);
    }
    
    // 3. 执行工具
    try {
      const rawResult = await executeStockTool(toolName, args);
      return this.formatResult(rawResult, toolName, startTime);
    } catch (e) {
      return this.errorResult(e.message, startTime);
    }
  }
  
  private formatResult(raw: any, toolName: string, startTime: number): ToolResult {
    const latencyMs = Date.now() - startTime;
    const summary = this.summarize(raw, toolName);
    const truncated = JSON.stringify(raw).length > ToolExecutor.MAX_RESULT_LENGTH;
    
    return {
      success: true,
      summary,
      rawData: truncated ? undefined : raw,  // 太大就不传
      meta: {
        asOf: new Date().toISOString(),
        source: this.getSource(toolName),
        latencyMs,
        truncated,
      },
    };
  }
  
  private summarize(raw: any, toolName: string): string {
    // 根据工具类型生成摘要
    if (toolName === "get_stock_quote" && raw) {
      return `${raw.name} (${raw.code}): ¥${raw.price} ${raw.changePercent >= 0 ? "📈" : "📉"}${raw.changePercent}%`;
    }
    // ... 其他工具的摘要逻辑
    return JSON.stringify(raw).slice(0, 200);
  }
  
  private getSource(toolName: string): string {
    const sourceMap: Record<string, string> = {
      get_stock_quote: "东方财富",
      get_kline_data: "东方财富",
      get_fund_flow: "东方财富",
      search_stock: "AkShare",
    };
    return sourceMap[toolName] || "unknown";
  }
}
```

### 1.2 增强流式事件类型

```typescript
// server/_core/agent/types.ts

export type StreamEvent =
  // 文本事件
  | { type: "text_start" }
  | { type: "text_delta"; content: string }
  | { type: "text_end"; fullContent: string }
  
  // 工具事件 (关键！前端需要这些来渲染工具卡片)
  | { type: "tool_call_start"; toolName: string; toolCallId: string; runId: string }
  | { type: "tool_call_args_delta"; toolCallId: string; argsDelta: string }  // 增量 JSON 参数
  | { type: "tool_call_args_complete"; toolCallId: string; args: Record<string, any> }
  | { type: "tool_result"; toolCallId: string; summary: string; success: boolean; meta: ToolResultMeta }
  | { type: "tool_error"; toolCallId: string; error: string; code?: string }
  
// 工具结果元数据 (股票数据特有)
interface ToolResultMeta {
  asOf: string;           // 数据截止时间
  source: string;         // 数据来源 (eastmoney/akshare/yahoo)
  latencyMs: number;      // 执行耗时
  truncated?: boolean;    // 是否被截断
  rawRef?: string;        // 完整数据的引用 ID (如果太大)
}
  
  // 思考事件 (可选)
  | { type: "thinking_start" }
  | { type: "thinking_delta"; content: string }
  | { type: "thinking_end" }
  
  // 生命周期
  | { type: "run_start"; runId: string; sessionId: string; eventVersion: 1 }
  | { type: "run_end"; runId: string; usage: TokenUsage; status: "completed" | "cancelled" | "failed" }
  | { type: "error"; runId: string; message: string; code?: string };
```

### 1.3 重构 tRPC Router

```typescript
// server/routers/ai.ts - 新增/修改的 procedures

export const aiRouter = router({
  // 现有的保留...
  
  // 🆕 获取所有会话列表
  listSessions: publicProcedure.query(async () => {
    const sessionStore = getSessionStore();
    return sessionStore.listSessions().map(s => ({
      id: s.id,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      stockCode: s.metadata.stockCode,
      messageCount: s.messages.length,
      preview: getSessionPreview(s),
    }));
  }),
  
  // 🆕 删除会话
  deleteSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const sessionStore = getSessionStore();
      sessionStore.deleteSession(input.sessionId);
      return { success: true };
    }),
  
  // 🔄 重构 streamChat 使用新的 Agent Runner
  streamChat: publicProcedure
    .input(streamChatSchema)
    .subscription(async function* ({ input }) {
      for await (const event of runAgent({
        sessionId: input.sessionId,
        message: input.messages[input.messages.length - 1].content,
        stockCode: input.stockCode,
        stockContext: input.stockContext,
        thinkHard: input.thinkHard,
      })) {
        yield event;
      }
    }),
});
```

---

## 🎨 Phase 2: 前端重构 (预计 3-4 天)

### 2.1 核心 Chat Hook (Reducer 模式)

```typescript
// client/src/hooks/useChat.ts

import { useCallback, useReducer, useRef } from "react";
import { trpc } from "@/api/trpc";

// ============ 类型定义 ============

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallState[];
  isStreaming?: boolean;
  createdAt: Date;
}

export interface ToolCallState {
  id: string;
  name: string;
  args?: Record<string, any>;
  status: "queued" | "running" | "succeeded" | "failed";
  summary?: string;
  meta?: { asOf: string; source: string; latencyMs: number };
  error?: string;
}

interface ChatState {
  messages: ChatMessage[];
  toolCalls: Record<string, ToolCallState>;
  activeRunId: string | null;
  isLoading: boolean;
}

// ============ Reducer (核心！所有状态变更通过事件驱动) ============

type ChatAction = 
  | { type: "ADD_USER_MESSAGE"; message: ChatMessage }
  | { type: "ADD_ASSISTANT_MESSAGE"; message: ChatMessage }
  | { type: "STREAM_EVENT"; event: StreamEvent };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
      
    case "ADD_ASSISTANT_MESSAGE":
      return { 
        ...state, 
        messages: [...state.messages, action.message],
        isLoading: true,
      };
      
    case "STREAM_EVENT":
      return reduceStreamEvent(state, action.event);
      
    default:
      return state;
  }
}

function reduceStreamEvent(state: ChatState, event: StreamEvent): ChatState {
  switch (event.type) {
    case "run_start":
      return { ...state, activeRunId: event.runId, isLoading: true };
      
    case "text_delta": {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg?.role === "assistant") {
        return {
          ...state,
          messages: [
            ...state.messages.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + event.content },
          ],
        };
      }
      return state;
    }
    
    case "tool_call_start": {
      const newToolCall: ToolCallState = {
        id: event.toolCallId,
        name: event.toolName,
        status: "running",
      };
      return {
        ...state,
        toolCalls: { ...state.toolCalls, [event.toolCallId]: newToolCall },
      };
    }
    
    case "tool_call_args_complete": {
      const tc = state.toolCalls[event.toolCallId];
      if (tc) {
        return {
          ...state,
          toolCalls: {
            ...state.toolCalls,
            [event.toolCallId]: { ...tc, args: event.args },
          },
        };
      }
      return state;
    }
    
    case "tool_result": {
      const tc = state.toolCalls[event.toolCallId];
      if (tc) {
        const updated: ToolCallState = {
          ...tc,
          status: event.success ? "succeeded" : "failed",
          summary: event.summary,
          meta: event.meta,
        };
        // 同时更新最后一条消息的 toolCalls
        const lastMsg = state.messages[state.messages.length - 1];
        if (lastMsg?.role === "assistant") {
          const updatedToolCalls = [...(lastMsg.toolCalls || [])];
          const idx = updatedToolCalls.findIndex(t => t.id === event.toolCallId);
          if (idx >= 0) {
            updatedToolCalls[idx] = updated;
          } else {
            updatedToolCalls.push(updated);
          }
          return {
            ...state,
            toolCalls: { ...state.toolCalls, [event.toolCallId]: updated },
            messages: [
              ...state.messages.slice(0, -1),
              { ...lastMsg, toolCalls: updatedToolCalls },
            ],
          };
        }
      }
      return state;
    }
    
    case "text_end": {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg?.role === "assistant") {
        return {
          ...state,
          messages: [
            ...state.messages.slice(0, -1),
            { ...lastMsg, isStreaming: false },
          ],
        };
      }
      return state;
    }
    
    case "run_end":
      return { ...state, activeRunId: null, isLoading: false };
      
    case "error":
      console.error("Run error:", event.message);
      return { ...state, isLoading: false };
      
    default:
      return state;
  }
}

// ============ Hook ============

const initialState: ChatState = {
  messages: [],
  toolCalls: {},
  activeRunId: null,
  isLoading: false,
};

export function useChat(sessionId?: string) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const sendMessage = useCallback(async (content: string) => {
    // 1. 添加用户消息
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    dispatch({ type: "ADD_USER_MESSAGE", message: userMsg });
    
    // 2. 创建空的助手消息
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      isStreaming: true,
      toolCalls: [],
      createdAt: new Date(),
    };
    dispatch({ type: "ADD_ASSISTANT_MESSAGE", message: assistantMsg });
    
    // 3. 创建取消控制器
    abortControllerRef.current = new AbortController();
    
    // 4. 订阅流式响应
    const subscription = trpc.ai.streamChat.subscribe({
      sessionId,
      messages: [{ role: "user", content }],
    }, {
      onData: (event) => dispatch({ type: "STREAM_EVENT", event }),
      onError: (err) => console.error(err),
    });
    
    return () => subscription.unsubscribe();
  }, [sessionId]);
  
  // 取消当前运行 (重要！股票工具可能很慢)
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);
  
  return {
    messages: state.messages,
    toolCalls: state.toolCalls,
    activeRunId: state.activeRunId,
    isLoading: state.isLoading,
    sendMessage,
    cancel,
  };
}
```

### 2.2 ChatPanel 组件重构

```tsx
// client/src/components/chat/ChatPanel.tsx

import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ToolCallCard } from "./ToolCallCard";
import { SessionSidebar } from "./SessionSidebar";

export function ChatPanel() {
  const [sessionId, setSessionId] = useState<string>();
  const { messages, isLoading, currentToolCall, sendMessage } = useChat(sessionId);
  
  return (
    <div className="flex h-full">
      {/* 会话侧边栏 */}
      <SessionSidebar 
        currentSessionId={sessionId}
        onSelectSession={setSessionId}
        onNewSession={() => setSessionId(undefined)}
      />
      
      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 消息列表 */}
        <MessageList messages={messages} />
        
        {/* 当前工具调用指示器 */}
        {currentToolCall && (
          <ToolCallCard 
            toolCall={currentToolCall} 
            isRunning 
          />
        )}
        
        {/* 输入框 */}
        <ChatInput 
          onSend={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
```

### 2.3 工具调用卡片 (核心体验提升)

```tsx
// client/src/components/chat/ToolCallCard.tsx

import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, TrendingUp, Search, BarChart3 } from "lucide-react";

const TOOL_ICONS: Record<string, any> = {
  search_stock: Search,
  get_stock_quote: TrendingUp,
  get_kline_data: BarChart3,
  analyze_stock: BarChart3,
  // ... 其他工具
};

const TOOL_LABELS: Record<string, string> = {
  search_stock: "搜索股票",
  get_stock_quote: "获取实时行情",
  get_kline_data: "获取K线数据",
  get_fund_flow: "查询资金流向",
  analyze_stock: "技术分析",
  // ... 其他工具
};

interface ToolCallCardProps {
  toolCall: ToolCallRecord;
  isRunning?: boolean;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const Icon = TOOL_ICONS[toolCall.name] || BarChart3;
  const label = TOOL_LABELS[toolCall.name] || toolCall.name;
  const isRunning = toolCall.status === "running";
  const isSuccess = toolCall.status === "succeeded";
  const isFailed = toolCall.status === "failed";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-4 py-3 bg-muted/50 rounded-lg border"
    >
      {/* 图标 */}
      <div className="p-2 bg-primary/10 rounded-md">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      
      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {toolCall.args?.code && (
            <span className="text-xs px-1.5 py-0.5 bg-primary/10 rounded">
              {toolCall.args.code}
            </span>
          )}
        </div>
        
        {/* 数据来源和时间 (信任建设！) */}
        {toolCall.meta && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>来源: {toolCall.meta.source}</span>
            <span>·</span>
            <span>耗时: {toolCall.meta.latencyMs}ms</span>
            <span>·</span>
            <span>截止: {new Date(toolCall.meta.asOf).toLocaleTimeString()}</span>
          </div>
        )}
        
        {/* 结果摘要 */}
        {toolCall.summary && (
          <div className="mt-2 text-sm">
            {toolCall.summary}
          </div>
        )}
        
        {/* 错误信息 */}
        {toolCall.error && (
          <div className="mt-2 text-sm text-red-500">
            {toolCall.error}
          </div>
        )}
      </div>
      
      {/* 状态指示器 */}
      <div className="flex-shrink-0">
        {isRunning && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        {isSuccess && <CheckCircle className="w-4 h-4 text-green-500" />}
        {isFailed && <XCircle className="w-4 h-4 text-red-500" />}
      </div>
    </motion.div>
  );
}
```

### 2.4 会话侧边栏

```tsx
// client/src/components/chat/SessionSidebar.tsx

import { trpc } from "@/api/trpc";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface SessionSidebarProps {
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

export function SessionSidebar({ 
  currentSessionId, 
  onSelectSession, 
  onNewSession 
}: SessionSidebarProps) {
  const { data: sessions, refetch } = trpc.ai.listSessions.useQuery();
  const deleteSession = trpc.ai.deleteSession.useMutation({
    onSuccess: () => refetch(),
  });
  
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      {/* 新建会话按钮 */}
      <button
        onClick={onNewSession}
        className="flex items-center gap-2 m-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        <Plus className="w-4 h-4" />
        新对话
      </button>
      
      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {sessions?.map(session => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 mx-2 rounded-lg cursor-pointer group",
              currentSessionId === session.id 
                ? "bg-primary/10" 
                : "hover:bg-muted"
            )}
          >
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">
                {session.preview || "新对话"}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(session.updatedAt), { 
                  addSuffix: true,
                  locale: zhCN,
                })}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSession.mutate({ sessionId: session.id });
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🚀 Phase 3: 体验增强 (预计 2 天)

### 3.1 流式 Markdown 渲染

```tsx
// client/src/components/chat/StreamingMarkdown.tsx

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
}

export function StreamingMarkdown({ content, isStreaming }: StreamingMarkdownProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* 流式光标 */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
      )}
    </div>
  );
}
```

### 3.2 打字机效果

```tsx
// client/src/hooks/useTypewriter.ts

import { useState, useEffect } from "react";

export function useTypewriter(text: string, speed = 20) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [displayedText, text, speed]);
  
  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
  }, [text]);
  
  return { displayedText, isComplete };
}
```

### 3.3 快捷命令

```tsx
// client/src/components/chat/QuickCommands.tsx

const QUICK_COMMANDS = [
  { label: "分析茅台", command: "分析一下贵州茅台的近期走势" },
  { label: "今日热门", command: "今天有哪些热门股票值得关注？" },
  { label: "资金流向", command: "查看主力资金流入的板块" },
  { label: "技术形态", command: "哪些股票出现了金叉？" },
];

export function QuickCommands({ onSelect }: { onSelect: (cmd: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {QUICK_COMMANDS.map(({ label, command }) => (
        <button
          key={label}
          onClick={() => onSelect(command)}
          className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

---

## 📋 实施检查清单

### Week 1: 后端
- [ ] 创建 `server/_core/agent/runner.ts`
- [ ] 扩展 `StreamEvent` 类型
- [ ] 重构 `aiRouter` 添加会话管理 API
- [ ] 实现上下文压缩 (可选)
- [ ] 测试工具调用流程

### Week 2: 前端核心
- [ ] 创建 `useChat` Hook
- [ ] 重构 `ChatPanel` 组件
- [ ] 实现 `MessageList` 和 `MessageBubble`
- [ ] 实现 `ToolCallCard` 工具调用卡片
- [ ] 实现 `SessionSidebar` 会话列表

### Week 3: 体验优化
- [ ] 流式 Markdown 渲染
- [ ] 代码高亮
- [ ] 快捷命令
- [ ] 移动端适配
- [ ] 暗色主题优化

---

## 🔗 参考资源

- **OpenClaw 源码**: `/Users/kckylechen/Lobbie/openclaw/src/agents/`
- **你的现有代码**:
  - Session: `server/_core/session/session-store.ts`
  - Tools: `server/_core/stockTools.ts`
  - Agent: `server/_core/agent/`
- **推荐库**:
  - `react-markdown` + `react-syntax-highlighter` (Markdown 渲染)
  - `framer-motion` (动画)
  - `date-fns` (日期格式化)
  - `zustand` (状态管理，如果需要)

---

## 💡 快速开始

1. **先从后端开始**：重构 `StreamEvent` 类型，确保工具调用事件完整
2. **测试 API**：用 curl 或 Postman 验证流式响应
3. **再做前端**：基于稳定的 API 构建 UI
4. **迭代优化**：逐步添加动画、快捷键等体验细节

---

## 🔮 进阶方案 (仅在需要时考虑)

### 事件日志持久化

如果需要可重放运行 / 审计合规，可以持久化所有 StreamEvent：

```typescript
// server/_core/agent/event-log.ts

interface EventLogEntry {
  runId: string;
  seq: number;           // 事件序号
  timestamp: string;
  event: StreamEvent;
}

class EventLogStore {
  async append(runId: string, event: StreamEvent): Promise<void> {
    // 写入 JSONL 文件或数据库
  }
  
  async* replay(runId: string): AsyncGenerator<StreamEvent> {
    // 按序读取事件
  }
}
```

**好处**：
- 完美 UI 重放
- 金融审计（"为什么 AI 这么说？"）
- Bug 报告（"附上 run trace"）

### 大结果存储

股票数据可能很大（K线、财报等），分离存储：

```typescript
// 工具返回大数据时
if (rawSize > MAX_INLINE_SIZE) {
  const ref = await resultStore.save(runId, toolCallId, rawData);
  return {
    summary: "获取了 120 条 K 线数据",
    rawRef: ref,  // 引用 ID
    meta: { truncated: true },
  };
}
```

---

## ✅ 总结

**你的项目基础很好**：已有 SessionStore、丰富的 stockTools、smartStreamChat。

**核心改动**：
1. 引入 **AgentRunner** 包装现有逻辑（不重写）
2. 引入 **ToolExecutor** 作为工具安全边界
3. 标准化 **StreamEvent** 协议（append-only、稳定 ID）
4. 前端用 **Reducer 模式** 处理流式状态

**预计工期**：2-3 周完成完整重构

如有问题，随时问我！
