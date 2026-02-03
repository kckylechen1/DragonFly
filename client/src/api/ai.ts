import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

// 获取会话列表
export function useAISessions(stockCode?: string) {
  return useQuery({
    queryKey: ["ai", "sessions", stockCode],
    queryFn: () =>
      api.ai.getSessions.query(stockCode ? { stockCode } : undefined),
    staleTime: 30000,
  });
}

// 获取聊天历史
export function useAIHistory(options?: {
  sessionId?: string;
  stockCode?: string;
}) {
  const sessionId = options?.sessionId;
  const stockCode = options?.stockCode;
  return useQuery({
    queryKey: ["ai", "history", sessionId ?? "latest", stockCode ?? "all"],
    queryFn: () =>
      api.ai.getHistory.query(
        sessionId || stockCode
          ? { sessionId: sessionId || undefined, stockCode: stockCode || undefined }
          : undefined
      ),
    enabled: Boolean(sessionId || stockCode),
  });
}

// 获取当前工具执行进度
export function useActiveTodoRun(sessionId?: string, isPolling?: boolean) {
  return useQuery({
    queryKey: ["ai", "todo", "active", sessionId],
    queryFn: () => api.ai.getActiveTodoRun.query({ sessionId: sessionId! }),
    enabled: !!sessionId,
    refetchInterval: isPolling ? 1000 : 3000,
  });
}

// 获取最近一次完成的工具执行进度
export function useLatestTodoRun(sessionId?: string) {
  return useQuery({
    queryKey: ["ai", "todo", "latest", sessionId],
    queryFn: () => api.ai.getLatestTodoRun.query({ sessionId: sessionId! }),
    enabled: !!sessionId,
  });
}

// 创建新会话
export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stockCode?: string) =>
      api.ai.createSession.mutate({ stockCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "sessions"] });
    },
  });
}

// 发送消息
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      messages: Message[];
      sessionId?: string;
      stockCode?: string;
      useThinking?: boolean;
    }) => api.ai.chat.mutate(input),
    onSuccess: (_, variables) => {
      if (variables.sessionId) {
        queryClient.invalidateQueries({
          queryKey: ["ai", "history", variables.sessionId],
        });
      }
    },
  });
}
