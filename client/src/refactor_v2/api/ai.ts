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
export function useAIHistory(sessionId?: string) {
  return useQuery({
    queryKey: ["ai", "history", sessionId],
    queryFn: () =>
      api.ai.getHistory.query(sessionId ? { sessionId } : undefined),
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
