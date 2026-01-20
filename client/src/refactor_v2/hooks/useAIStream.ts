import { useCallback, useRef, useState } from "react";

interface StreamOptions {
  sessionId?: string;
  stockCode?: string;
  thinkHard?: boolean;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export function useAIStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (prompt: string, options: StreamOptions = {}) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsStreaming(true);
      setStreamedContent("");

      let fullContent = "";

      try {
        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            sessionId: options.sessionId,
            stockCode: options.stockCode,
            thinkHard: options.thinkHard,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setStreamedContent(fullContent);
          options.onChunk?.(chunk);
        }

        options.onComplete?.(fullContent);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          options.onError?.(error as Error);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }

      return fullContent;
    },
    []
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    stream,
    cancel,
    isStreaming,
    streamedContent,
  };
}
