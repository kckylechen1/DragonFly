import { useCallback, useRef } from "react";
import {
  useAIPanelControl,
  useAIChatStore,
} from "@/stores/aiChat.store";
import { api } from "@/api/client";
import type { StreamEvent } from "@shared/stream";
import type { ToolCallEvent } from "@/types/ai";

interface StockContext {
  quote?: {
    name?: string;
    code?: string;
    price?: number;
    change?: number;
    changePercent?: number;
    open?: number;
    high?: number;
    low?: number;
    preClose?: number;
    volume?: number;
    amount?: number;
    turnoverRate?: number | null;
    pe?: number | null;
    pb?: number | null;
    marketCap?: number | null;
    circulationMarketCap?: number | null;
    volumeRatio?: number | null;
  } | null;
  capitalFlow?: {
    mainNetInflow?: number | null;
    superLargeNetInflow?: number | null;
    largeNetInflow?: number | null;
    mediumNetInflow?: number | null;
    smallNetInflow?: number | null;
  } | null;
}

interface SendMessageOptions {
  stockCode?: string;
  stockContext?: StockContext | null;
}

export function useAIChatActions() {
  const {
    messages,
    isLoading,
    thinkHard,
    sessionId,
    addMessage,
    updateMessage,
    setIsLoading,
    setError,
    setSessionId,
    setFollowUpSuggestions,
    addToolCall,
    updateToolCall,
    clearToolCalls,
    setThinkingMessage,
  } = useAIChatStore();
  const { open } = useAIPanelControl();
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    clearToolCalls();
    if (streamingMessageIdRef.current) {
      updateMessage(streamingMessageIdRef.current, { status: "done" });
      streamingMessageIdRef.current = null;
    }
  }, [setIsLoading, updateMessage, clearToolCalls]);

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const userMessageId = addMessage({
        role: "user",
        content: trimmed,
        status: "done",
      });
      const assistantMessageId = addMessage({
        role: "assistant",
        content: "",
        status: "streaming",
      });
      streamingMessageIdRef.current = assistantMessageId;

      setIsLoading(true);
      setError(null);
      setFollowUpSuggestions([]);
      clearToolCalls();
      open();

      const historyMessages = [
        ...messages,
        {
          id: userMessageId,
          role: "user" as const,
          content: trimmed,
          createdAt: Date.now(),
        },
      ]
        .filter(
          message =>
            message.role !== "assistant" || message.content.trim().length > 0
        )
        .map(message => ({
          role: message.role as "system" | "user" | "assistant",
          content: message.content,
        }));

      const requestThinkHard =
        thinkHard || /详细分析|完整版|深度分析|深度模式/.test(trimmed);

      try {
        // 使用 tRPC 流式调用
        const stream = await api.ai.streamChat.mutate({
          messages: historyMessages,
          stockCode: options?.stockCode,
          stockContext: options?.stockContext
            ? {
                quote: options.stockContext.quote
                  ? {
                      name: options.stockContext.quote.name,
                      code: options.stockContext.quote.code,
                      price: options.stockContext.quote.price,
                      change: options.stockContext.quote.change,
                      changePercent: options.stockContext.quote.changePercent,
                      open: options.stockContext.quote.open,
                      high: options.stockContext.quote.high,
                      low: options.stockContext.quote.low,
                      preClose: options.stockContext.quote.preClose,
                      volume: options.stockContext.quote.volume,
                      amount: options.stockContext.quote.amount,
                      turnoverRate:
                        options.stockContext.quote.turnoverRate ?? undefined,
                      pe: options.stockContext.quote.pe ?? undefined,
                      pb: options.stockContext.quote.pb ?? undefined,
                      marketCap:
                        options.stockContext.quote.marketCap ?? undefined,
                      circulationMarketCap:
                        options.stockContext.quote.circulationMarketCap ??
                        undefined,
                      volumeRatio:
                        options.stockContext.quote.volumeRatio ?? undefined,
                    }
                  : null,
                capitalFlow: options.stockContext.capitalFlow
                  ? {
                      mainNetInflow:
                        options.stockContext.capitalFlow.mainNetInflow ??
                        undefined,
                      superLargeNetInflow:
                        options.stockContext.capitalFlow.superLargeNetInflow ??
                        undefined,
                      largeNetInflow:
                        options.stockContext.capitalFlow.largeNetInflow ??
                        undefined,
                      mediumNetInflow:
                        options.stockContext.capitalFlow.mediumNetInflow ??
                        undefined,
                      smallNetInflow:
                        options.stockContext.capitalFlow.smallNetInflow ??
                        undefined,
                    }
                  : null,
              }
            : null,
          thinkHard: requestThinkHard,
          sessionId: sessionId || undefined,
        });

        let fullContent = "";

        // tRPC v11 流式响应返回 AsyncIterable
        for await (const chunk of stream as AsyncIterable<StreamEvent>) {
          if (abortController.signal.aborted) break;
          if (chunk.type === "run_start" && chunk.data.sessionId && !sessionId) {
            setSessionId(chunk.data.sessionId);
          }

          if (chunk.type === "text_delta") {
            fullContent += chunk.data.delta;
            updateMessage(assistantMessageId, {
              content: fullContent,
              status: "streaming",
            });
          }

          if (chunk.type === "tool_call_start") {
            const toolEvent: ToolCallEvent = {
              id: chunk.data.toolCallId,
              name: chunk.data.name,
              args: {},
              status: "running",
              timestamp: Date.now(),
            };
            addToolCall(toolEvent);
          }

          if (chunk.type === "tool_call_args_complete") {
            updateToolCall(chunk.data.toolCallId, {
              args: chunk.data.args,
            });
          }

          if (chunk.type === "tool_result") {
            updateToolCall(chunk.data.toolCallId, {
              status: "success",
              duration: chunk.data.meta?.latencyMs,
              preview: chunk.data.summary,
            });
          }

          if (chunk.type === "tool_error") {
            updateToolCall(chunk.data.toolCallId, {
              status: "error",
              duration: chunk.data.meta?.latencyMs,
              preview: chunk.data.summary,
              error: chunk.data.error,
            });
          }

          if (chunk.type === "thinking_delta") {
            setThinkingMessage(chunk.data.delta || null);
          }

          if (chunk.type === "error") {
            throw new Error(chunk.data.message);
          }

          if (chunk.type === "run_end") {
            if (chunk.data.status === "error" && chunk.data.error) {
              throw new Error(chunk.data.error);
            }
            break;
          }
        }

        updateMessage(assistantMessageId, { status: "done" });
        clearToolCalls();
      } catch (error: unknown) {
        const err = error as { name?: string };
        if (err?.name !== "AbortError") {
          setError("请求失败，请稍后重试");
          updateMessage(assistantMessageId, {
            content: "❌ 请求失败，请稍后重试。",
            status: "error",
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        streamingMessageIdRef.current = null;
      }
    },
    [
      messages,
      isLoading,
      thinkHard,
      sessionId,
      addMessage,
      updateMessage,
      setIsLoading,
      setError,
      setSessionId,
      setFollowUpSuggestions,
      addToolCall,
      updateToolCall,
      clearToolCalls,
      setThinkingMessage,
      open,
    ]
  );

  return {
    sendMessage,
    stopStreaming,
  };
}
