import { useState, useCallback, useRef, useEffect } from "react";
import type { StreamEvent, StreamRequestParams } from "@shared/stream";

export interface TodoStep {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  toolName?: string;
  resultPreview?: string;
}

export interface UseAIStreamReturn {
  isStreaming: boolean;
  streamContent: string;
  progress: TodoStep[];
  error: string | null;
  startStream: (
    message: string,
    options?: Omit<StreamRequestParams, "message">
  ) => void;
  stopStream: () => void;
}

export function useAIStream(): UseAIStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [progress, setProgress] = useState<TodoStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startStream = useCallback(
    (message: string, options?: Omit<StreamRequestParams, "message">) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsStreaming(true);
      setStreamContent("");
      setProgress([]);
      setError(null);

      try {
        const params = new URLSearchParams({ message });
        if (options?.sessionId) params.set("sessionId", options.sessionId);
        if (options?.stockCode) params.set("stockCode", options.stockCode);
        if (options?.useThinking) params.set("useThinking", "true");

        const url = `/api/ai/stream?${params.toString()}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data) as StreamEvent;

            switch (data.type) {
              case "tool_call_start": {
                const toolData = data.data;
                setProgress(prev => [
                  ...prev,
                  {
                    id: toolData.toolCallId,
                    title: `调用 ${toolData.name}`,
                    status: "in_progress",
                    toolName: toolData.name,
                  },
                ]);
                break;
              }

              case "tool_result": {
                const resultData = data.data;
                setProgress(prev =>
                  prev.map(step =>
                    step.id === resultData.toolCallId
                      ? {
                          ...step,
                          status: "completed",
                          resultPreview: resultData.summary?.slice(0, 100),
                        }
                      : step
                  )
                );
                break;
              }

              case "tool_error": {
                const resultData = data.data;
                setProgress(prev =>
                  prev.map(step =>
                    step.id === resultData.toolCallId
                      ? {
                          ...step,
                          status: "failed",
                          resultPreview: resultData.summary?.slice(0, 100),
                        }
                      : step
                  )
                );
                break;
              }

              case "text_delta":
                setStreamContent(prev => prev + data.data.delta);
                break;

              case "run_end":
                if (data.data.status === "error" && data.data.error) {
                  setError(data.data.error);
                }
                eventSource.close();
                setIsStreaming(false);
                break;

              case "error":
                setError(data.data.message);
                eventSource.close();
                setIsStreaming(false);
                break;
            }
          } catch (parseError) {
            console.error("Failed to parse SSE event:", parseError);
          }
        };

        eventSource.onerror = () => {
          console.error("SSE connection error");
          setError("连接中断，请重试");
          eventSource.close();
          setIsStreaming(false);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
        setIsStreaming(false);
      }
    },
    []
  );

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamContent,
    progress,
    error,
    startStream,
    stopStream,
  };
}
