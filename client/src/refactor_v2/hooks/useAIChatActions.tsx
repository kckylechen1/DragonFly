import { useCallback, useRef } from "react";
import { useAIPanelControl, useAIChatStore } from "@/refactor_v2/stores/aiChat.store";

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
    turnoverRate?: number;
    pe?: number | null;
    pb?: number | null;
    marketCap?: number | null;
    circulationMarketCap?: number | null;
    volumeRatio?: number;
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

const FOLLOWUP_PATTERN = /<!--FOLLOWUP:(.*?)-->/g;

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
    if (streamingMessageIdRef.current) {
      updateMessage(streamingMessageIdRef.current, { status: "done" });
      streamingMessageIdRef.current = null;
    }
  }, [setIsLoading, updateMessage]);

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
      open();

      const historyMessages = [...messages, { id: userMessageId, role: "user", content: trimmed, createdAt: Date.now() }]
        .filter(message => message.role !== "assistant" || message.content.trim().length > 0)
        .map(message => ({ role: message.role, content: message.content }));

      const requestThinkHard =
        thinkHard || /详细分析|完整版|深度分析|深度模式/.test(trimmed);

      try {
        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyMessages,
            stockCode: options?.stockCode || undefined,
            stockContext: options?.stockContext || undefined,
            useSmartAgent: true,
            thinkHard: requestThinkHard,
            sessionId: sessionId || undefined,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newSessionId = response.headers.get("X-Session-Id");
        if (newSessionId) {
          setSessionId(newSessionId);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let followUps: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              if (json.content) {
                const matches = [...json.content.matchAll(FOLLOWUP_PATTERN)];
                if (matches.length) {
                  for (const match of matches) {
                    try {
                      const parsed = JSON.parse(match[1]);
                      if (Array.isArray(parsed)) {
                        followUps = parsed;
                      }
                    } catch {
                      // ignore followup parse errors
                    }
                  }
                }

                fullContent += json.content;
                const cleanContent = fullContent.replace(FOLLOWUP_PATTERN, "").trim();
                updateMessage(assistantMessageId, {
                  content: cleanContent,
                  status: "streaming",
                });
                if (followUps.length > 0) {
                  setFollowUpSuggestions(followUps);
                }
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        updateMessage(assistantMessageId, { status: "done" });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
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
      open,
    ]
  );

  return {
    sendMessage,
    stopStreaming,
  };
}
