/**
 * SSE 流式对话 Hook
 *
 * 负责人: 🟢 Codex
 * ⏱️ 开始时间: 2026-01-30 00:00
 *
 * ⚠️ CRITICAL - SSE 必须实现 seq 去重和滑动窗口去重
 */

import { useCallback, useRef, useState, useEffect } from "react";
import { useChatStoreV2 } from "../stores/chat.store";
import { useConnectionStore } from "../stores/connection.store";
import { realtimeDebug } from "../realtime/realtimeDebug";
import type { StreamEvent, ChatMode, ToolCall } from "../types/chat";

/**
 * SSE 事件去重器 (带滑动窗口)
 * 作用：防止重连导致的重复内容，并限制内存占用。
 */
class SSEDeduplicator {
  private seen = new Set<string>();
  private maxWindow = 2000;

  isDuplicate(eventId: string): boolean {
    if (!eventId) return false;
    if (this.seen.has(eventId)) return true;

    if (this.seen.size >= this.maxWindow) {
      const arr = Array.from(this.seen);
      const keep = arr.slice(arr.length / 2);
      this.seen = new Set(keep);
    }

    this.seen.add(eventId);
    return false;
  }

  clear() {
    this.seen.clear();
  }
}

interface UseStreamingChatOptions {
  conversationId?: string;
  mode?: ChatMode;
  onError?: (error: Error) => void;
}

export function useStreamingChat(options: UseStreamingChatOptions = {}) {
  const { conversationId: initialConvId, mode = "analyze", onError } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const contentBufferRef = useRef("");
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ⚠️ Oracle P1: 每个 hook 实例独立的 deduplicator
  const dedupRef = useRef(new SSEDeduplicator());

  const [isConnecting, setIsConnecting] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(initialConvId);
  const [isStreaming, setIsStreamingLocal] = useState(false);

  // SSE 会话活跃状态标记，防止 done 后残留事件继续处理
  const isSessionActiveRef = useRef(false);
  const {
    appendContent,
    addMessage,
    setStreaming,
    setConversationId,
    updateMessage,
  } = useChatStoreV2();
  const { setSseStatus } = useConnectionStore();

  const scheduleFlush = useCallback(
    (messageId: string) => {
      if (flushTimeoutRef.current) return;
      flushTimeoutRef.current = setTimeout(() => {
        if (contentBufferRef.current) {
          appendContent(messageId, contentBufferRef.current);
          contentBufferRef.current = "";
        }
        flushTimeoutRef.current = null;
      }, 50);
    },
    [appendContent]
  );

  // 当前消息 ID，用于累积内容
  const currentMessageIdRef = useRef<string>("");

  const ensureAssistantMessage = useCallback(
    (messageId: string) => {
      const state = useChatStoreV2.getState();
      const exists = state.messages.some(m => m.id === messageId);
      if (!exists) {
        addMessage({
          id: messageId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          toolCalls: [],
        });
      }
    },
    [addMessage]
  );

  const upsertToolCall = useCallback(
    (
      messageId: string,
      toolCallId: string,
      updates: Partial<ToolCall> & { name?: string; input?: Record<string, unknown> }
    ) => {
      const state = useChatStoreV2.getState();
      const message = state.messages.find(m => m.id === messageId);
      const toolCalls = message?.toolCalls ?? [];
      const index = toolCalls.findIndex(tc => tc.id === toolCallId);
      const base: ToolCall =
        index >= 0
          ? toolCalls[index]
          : {
              id: toolCallId,
              name: updates.name ?? "unknown_tool",
              input: updates.input ?? {},
              status: "pending",
              startTime: updates.startTime ?? Date.now(),
            };
      const nextToolCall: ToolCall = {
        ...base,
        ...updates,
        input: updates.input ?? base.input,
        name: updates.name ?? base.name,
      };

      const nextToolCalls =
        index >= 0
          ? toolCalls.map((tc, idx) => (idx === index ? nextToolCall : tc))
          : [...toolCalls, nextToolCall];

      updateMessage(messageId, { toolCalls: nextToolCalls });
    },
    [updateMessage]
  );

  const handleSSEEvent = useCallback(
    (event: StreamEvent) => {
      // 检查会话是否仍然活跃，防止 done 后残留事件继续处理
      if (!isSessionActiveRef.current) {
        return;
      }

      switch (event.type) {
        case "run_start":
          if (event.data.sessionId) {
            setConversationId(event.data.sessionId);
            setCurrentConvId(event.data.sessionId);
          }
          break;
        case "text_start": {
          const messageId = event.data.messageId;
          currentMessageIdRef.current = messageId;
          ensureAssistantMessage(messageId);
          setStreaming(true);
          setIsStreamingLocal(true);
          break;
        }
        case "text_delta": {
          const messageId = event.data.messageId || currentMessageIdRef.current;
          if (!messageId) {
            break;
          }
          contentBufferRef.current += event.data.delta;
          scheduleFlush(messageId);
          break;
        }
        case "tool_call_start": {
          const messageId = event.data.messageId;
          ensureAssistantMessage(messageId);
          upsertToolCall(messageId, event.data.toolCallId, {
            name: event.data.name,
            status: "running",
            input: {},
            startTime: event.timestamp,
          });
          break;
        }
        case "tool_call_args_complete": {
          const messageId = event.data.messageId;
          ensureAssistantMessage(messageId);
          upsertToolCall(messageId, event.data.toolCallId, {
            input: (event.data.args ?? {}) as Record<string, unknown>,
          });
          break;
        }
        case "tool_result": {
          const messageId = event.data.messageId;
          ensureAssistantMessage(messageId);
          upsertToolCall(messageId, event.data.toolCallId, {
            status: "completed",
            result: event.data.result,
            summary: event.data.summary,
            rawRef: event.data.rawRef,
            meta: event.data.meta,
            endTime: event.timestamp,
          });
          break;
        }
        case "tool_error": {
          const messageId = event.data.messageId;
          ensureAssistantMessage(messageId);
          upsertToolCall(messageId, event.data.toolCallId, {
            status: "failed",
            error: event.data.error,
            summary: event.data.summary,
            meta: event.data.meta,
            endTime: event.timestamp,
          });
          break;
        }
        case "thinking_start":
        case "thinking_delta":
        case "thinking_end":
          break;
        case "text_end":
          break;
        case "run_end":
          // 流式传输完成 - 标记会话结束
          isSessionActiveRef.current = false;
          if (contentBufferRef.current && currentMessageIdRef.current) {
            appendContent(
              currentMessageIdRef.current,
              contentBufferRef.current
            );
            contentBufferRef.current = "";
          }
          if (flushTimeoutRef.current) {
            clearTimeout(flushTimeoutRef.current);
            flushTimeoutRef.current = null;
          }
          setStreaming(false);
          setIsStreamingLocal(false);
          currentMessageIdRef.current = "";
          if (event.data.status === "error" && event.data.error) {
            onError?.(new Error(event.data.error));
          }
          break;
        case "error":
          // 错误时也标记会话结束
          isSessionActiveRef.current = false;
          setStreaming(false);
          setIsStreamingLocal(false);
          currentMessageIdRef.current = "";
          onError?.(new Error(event.data.message || "Unknown error"));
          break;
      }
    },
    [
      addMessage,
      appendContent,
      ensureAssistantMessage,
      onError,
      scheduleFlush,
      setConversationId,
      setCurrentConvId,
      setStreaming,
      upsertToolCall,
    ]
  );

  const connect = useCallback(
    (convId: string, message?: string, stockCode?: string) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsConnecting(true);
      setCurrentConvId(convId);
      setConversationId(convId);
      dedupRef.current.clear(); // 重连时清空去重器

      // 重置会话状态
      currentMessageIdRef.current = "";
      contentBufferRef.current = "";
      isSessionActiveRef.current = true; // 标记新会话开始

      // 构建 SSE URL，使用后端 /api/ai/stream 端点
      const params = new URLSearchParams();
      if (message) params.append("message", message);
      if (convId) params.append("sessionId", convId);
      if (stockCode) params.append("stockCode", stockCode);
      if (mode === "analyze") params.append("useThinking", "true");

      const url = `/api/ai/stream?${params.toString()}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      setSseStatus({ state: "connecting" });
      realtimeDebug.setSseState("CONNECTING");

      es.onopen = () => {
        setIsConnecting(false);
        setSseStatus({ state: "open", lastMessageAt: Date.now() });
        realtimeDebug.setSseState("OPEN");
      };

      es.onmessage = e => {
        try {
          const event: StreamEvent = JSON.parse(e.data);

          setSseStatus({ lastMessageAt: Date.now() });

          // ⚠️ Oracle 护栏：eventId 去重
          if (event.id && dedupRef.current.isDuplicate(event.id)) return;

          handleSSEEvent(event);
        } catch (err) {
          console.error("SSE parse error", err);
          realtimeDebug.setError("SSE parse error");
        }
      };

      es.onerror = () => {
        setIsConnecting(false);
        setIsStreamingLocal(false);
        setSseStatus({ state: "error" });
        realtimeDebug.setSseState("ERROR");
        realtimeDebug.setError("SSE connection error");
        onError?.(new Error("SSE connection error"));
      };
    },
    [mode, handleSSEEvent, setConversationId, setSseStatus, onError]
  );

  const disconnect = useCallback(() => {
    // 标记会话结束
    isSessionActiveRef.current = false;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    // 清理状态
    currentMessageIdRef.current = "";
    contentBufferRef.current = "";

    setSseStatus({ state: "closed" });
    realtimeDebug.setSseState("CLOSED");
  }, [setSseStatus]);

  // ⚠️ Oracle P1: unmount 时自动断开
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // 🆕 防重复发送锁
  const sendingRef = useRef(false);
  const lastSentMessageRef = useRef("");
  const lastSentTimeRef = useRef(0);

  const sendMessage = useCallback(
    async (content: string, stockCode?: string) => {
      // 🆕 防重复发送检查
      const now = Date.now();
      const isSameMessage = content === lastSentMessageRef.current;
      const isTooFast = now - lastSentTimeRef.current < 2000; // 2秒内不能重发

      if (sendingRef.current) {
        console.warn("[useStreamingChat] 🔒 Already sending, ignored");
        return;
      }

      if (isSameMessage && isTooFast) {
        console.warn(
          "[useStreamingChat] 🔄 Duplicate message within 2s, ignored"
        );
        return;
      }

      // 🔒 锁定
      sendingRef.current = true;
      lastSentMessageRef.current = content;
      lastSentTimeRef.current = now;

      // 添加用户消息
      const userMessageId = `user-${Date.now()}`;
      addMessage({
        id: userMessageId,
        role: "user",
        content,
        timestamp: Date.now(),
      });

      // 使用 SSE 直接发送消息到 /api/ai/stream
      try {
        const convId = currentConvId || `conv-${Date.now()}`;
        // 建立 SSE 连接，后端会自动处理消息
        connect(convId, content, stockCode);
      } catch (err) {
        onError?.(err as Error);
      } finally {
        // 🔓 延迟解锁，防止快速连续点击
        setTimeout(() => {
          sendingRef.current = false;
        }, 1000);
      }
    },
    [addMessage, currentConvId, connect, onError]
  );

  return {
    sendMessage,
    connect,
    disconnect,
    isConnecting,
    isStreaming,
    currentConvId,
  };
}
