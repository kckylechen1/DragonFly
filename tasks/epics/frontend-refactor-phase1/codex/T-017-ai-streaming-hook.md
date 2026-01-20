# T-017: AI Streaming Hook（复用现有流式对话逻辑）

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-016 (API adapter 层)

## ⚠️ 重要说明
现有 `/api/ai/stream` 是 REST 风格的 SSE，不是 tRPC。
需要复用 `components/ai/AIChatPanel.tsx` 中的 streaming 逻辑。

## 目标
- [ ] 创建可复用的 AI streaming hook
- [ ] 对接 `/api/ai/stream` 端点
- [ ] 支持 sessionId、thinkHard、followUp 等功能
- [ ] 在 refactor_v2 的 AI 组件中使用

---

## 步骤

### Step 1: 创建 AI streaming hook

```typescript
// client/src/refactor_v2/api/aiStream.ts

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
  thinkingTime?: number;
}

export interface UseAIStreamOptions {
  stockCode?: string | null;
  stockContext?: {
    quote?: any;
    capitalFlow?: any;
  } | null;
  thinkHard?: boolean;
}

export interface UseAIStreamReturn {
  messages: AIMessage[];
  isLoading: boolean;
  sessionId: string | null;
  followUpSuggestions: string[];
  sendMessage: (content: string) => Promise<void>;
  regenerate: () => Promise<void>;
  stop: () => void;
  clearMessages: () => void;
  createNewSession: () => Promise<void>;
}

const DEFAULT_SYSTEM_MESSAGE: AIMessage = {
  role: "system",
  content:
    "你是一个专业的A股分析师助手，帮助用户分析股票、解读技术指标、提供投资建议。",
};

export function useAIStream(options: UseAIStreamOptions = {}): UseAIStreamReturn {
  const { stockCode, stockContext, thinkHard = false } = options;

  const [messages, setMessages] = useState<AIMessage[]>([DEFAULT_SYSTEM_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const createSessionMutation = trpc.ai.createSession.useMutation();

  // 发送流式请求
  const streamRequest = useCallback(
    async (historyMessages: AIMessage[]) => {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const startTime = Date.now();
      let thinkingTime = 0;
      let hasReceivedFirstContent = false;

      // 添加空的助手消息
      setMessages([...historyMessages, { role: "assistant", content: "" }]);
      setIsLoading(true);
      setFollowUpSuggestions([]);

      try {
        // 检查用户消息是否触发深度模式
        const lastUserMessage =
          [...historyMessages].reverse().find((m) => m.role === "user")?.content || "";
        const requestThinkHard =
          thinkHard || /详细分析|完整版|深度分析|深度模式/.test(lastUserMessage);

        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: historyMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stockCode: stockCode || undefined,
            stockContext: stockContext || undefined,
            useSmartAgent: true,
            thinkHard: requestThinkHard,
            sessionId: sessionId || undefined,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 记录后端分配的 sessionId
        const newSessionId = response.headers.get("X-Session-Id");
        if (newSessionId) {
          setSessionId(newSessionId);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const json = JSON.parse(data);
                if (json.content) {
                  // 解析 follow-up 建议
                  const followUpMatch = json.content.match(/<!--FOLLOWUP:(.*?)-->/);
                  if (followUpMatch) {
                    try {
                      const followUps = JSON.parse(followUpMatch[1]);
                      setFollowUpSuggestions(followUps);
                    } catch {
                      // 解析失败忽略
                    }
                    json.content = json.content.replace(/<!--FOLLOWUP:.*?-->/g, "");
                  }

                  // 首次收到非思考内容时，计算思考时间
                  if (
                    !hasReceivedFirstContent &&
                    !json.content.startsWith("💭") &&
                    !json.content.startsWith("🔧") &&
                    !json.content.startsWith("📊") &&
                    !json.content.startsWith("🧠")
                  ) {
                    thinkingTime = Math.round((Date.now() - startTime) / 1000);
                    hasReceivedFirstContent = true;
                  }

                  fullContent += json.content;
                  const cleanContent = fullContent
                    .replace(/<!--FOLLOWUP:.*?-->/g, "")
                    .trim();

                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: cleanContent,
                      thinkingTime: thinkingTime > 0 ? thinkingTime : undefined,
                    };
                    return updated;
                  });
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Request aborted");
        } else {
          console.error("Stream error:", error);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "抱歉，AI 服务暂时不可用，请稍后再试。",
            };
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [stockCode, stockContext, thinkHard, sessionId]
  );

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: AIMessage = { role: "user", content };
      const newMessages = [...messages, userMessage];
      await streamRequest(newMessages);
    },
    [messages, streamRequest]
  );

  // 重新生成
  const regenerate = useCallback(async () => {
    const lastUserIndex = messages.findLastIndex((m) => m.role === "user");
    if (lastUserIndex === -1) return;

    const historyToRegenerate = messages.slice(0, lastUserIndex + 1);
    await streamRequest(historyToRegenerate);
  }, [messages, streamRequest]);

  // 停止
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([DEFAULT_SYSTEM_MESSAGE]);
    setFollowUpSuggestions([]);
  }, []);

  // 创建新会话
  const createNewSession = useCallback(async () => {
    clearMessages();
    try {
      const result = await createSessionMutation.mutateAsync({
        stockCode: stockCode || undefined,
      });
      setSessionId(result.sessionId);
    } catch (error) {
      console.error("Failed to create session:", error);
      setSessionId(null);
    }
  }, [stockCode, clearMessages, createSessionMutation]);

  return {
    messages,
    isLoading,
    sessionId,
    followUpSuggestions,
    sendMessage,
    regenerate,
    stop,
    clearMessages,
    createNewSession,
  };
}
```

### Step 2: 创建 AI 历史/会话相关 hooks

```typescript
// client/src/refactor_v2/api/ai.ts

import { trpc } from "@/lib/trpc";

// 获取聊天历史
export function useAIHistory(sessionId?: string, stockCode?: string) {
  return trpc.ai.getHistory.useQuery(
    {
      sessionId: sessionId || undefined,
      stockCode: stockCode || undefined,
    },
    {
      enabled: Boolean(sessionId || stockCode),
      refetchOnWindowFocus: false,
    }
  );
}

// 获取会话列表
export function useAISessions(stockCode?: string) {
  return trpc.ai.getSessions.useQuery(
    { stockCode: stockCode || undefined },
    { refetchOnWindowFocus: false }
  );
}

// 获取活跃的 TODO 运行
export function useActiveTodoRun(sessionId?: string, isLoading = false) {
  return trpc.ai.getActiveTodoRun.useQuery(
    { sessionId: sessionId || "" },
    {
      enabled: Boolean(sessionId),
      refetchInterval: isLoading ? 1000 : 3000,
    }
  );
}

// 获取最近的 TODO 运行
export function useLatestTodoRun(sessionId?: string) {
  return trpc.ai.getLatestTodoRun.useQuery(
    { sessionId: sessionId || "" },
    { enabled: Boolean(sessionId) }
  );
}
```

### Step 3: 更新 api/index.ts

```typescript
// client/src/refactor_v2/api/index.ts

export * from "./types";
export * from "./stocks";
export * from "./watchlist";
export * from "./market";
export * from "./ai";
export * from "./aiStream";
```

### Step 4: 更新 AIChatPanel 使用 streaming hook

```typescript
// client/src/refactor_v2/components/AIChatPanel.tsx

import React from "react";
import { X, Copy, ThumbsUp, RotateCcw, SquarePen, Brain } from "lucide-react";
import { useLayoutStore } from "@/refactor_v2/stores/layout.store";
import { useWatchlistStore } from "@/refactor_v2/stores/watchlist.store";
import { useAIStream, useStockQuote, useStockExtras } from "@/refactor_v2/api";

export const AIChatPanel: React.FC = () => {
  const { closeRightPanel } = useLayoutStore();
  const { currentSymbol } = useWatchlistStore();

  // 获取股票数据作为上下文
  const { data: quote } = useStockQuote(currentSymbol);
  const { data: extras } = useStockExtras(currentSymbol);

  const stockContext = quote
    ? {
        quote: {
          name: quote.name,
          code: currentSymbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          // ... 其他字段
        },
        capitalFlow: extras?.capitalFlow || null,
      }
    : null;

  const {
    messages,
    isLoading,
    followUpSuggestions,
    sendMessage,
    regenerate,
    stop,
    clearMessages,
    createNewSession,
  } = useAIStream({
    stockCode: currentSymbol,
    stockContext,
  });

  // 过滤掉 system 消息用于显示
  const displayMessages = messages.filter((m) => m.role !== "system");

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--panel-border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">AI 分析</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={createNewSession}
            className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors"
            title="新建对话"
          >
            <SquarePen className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={closeRightPanel}
            className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-primary)]" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-muted)]">
              {currentSymbol
                ? `🧠 SmartAgent 已就绪，直接提问即可`
                : "选择股票后可以进行针对性分析"}
            </p>
          </div>
        ) : (
          displayMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-[var(--accent-primary)] text-white"
                    : "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.role === "assistant" && msg.content && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-[var(--panel-border)]">
                    <button className="p-1 hover:opacity-75" title="有帮助">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 hover:opacity-75"
                      title="复制"
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 hover:opacity-75"
                      title="重新生成"
                      onClick={regenerate}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {msg.thinkingTime && (
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    思考时间: {msg.thinkingTime}s
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded-lg">
              <span className="animate-pulse">思考中...</span>
            </div>
          </div>
        )}
      </div>

      {/* Follow-up suggestions */}
      {followUpSuggestions.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {followUpSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(suggestion)}
              className="text-xs px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Footer with clear button */}
      {displayMessages.length > 0 && (
        <div className="border-t border-[var(--panel-border)] p-4">
          <button
            onClick={clearMessages}
            className="w-full px-3 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors text-sm"
          >
            清空对话
          </button>
        </div>
      )}
    </div>
  );
};
```

### Step 5: 更新 FloatingAIChatInput 使用 streaming

```typescript
// 在 FloatingAIChatInput.tsx 中使用 useAIStream
// 需要通过 context 或 props 与 AIChatPanel 共享状态
// 或者使用 zustand store 统一管理 AI 状态

// 简单方案：直接调用同一个 hook（需要状态提升到父组件）
// 复杂方案：创建 AIContext 共享状态
```

### Step 6: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] useAIStream hook 创建成功
- [ ] 支持流式响应、取消、重新生成
- [ ] 支持 followUp 建议解析
- [ ] 支持 thinkingTime 计算
- [ ] AIChatPanel 使用真实 API
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/api/aiStream.ts`
- `client/src/refactor_v2/api/ai.ts`
- `client/src/refactor_v2/api/index.ts` (更新)
- `client/src/refactor_v2/components/AIChatPanel.tsx` (更新)
