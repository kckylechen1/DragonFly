import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

// 获取自选股列表
export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: () => api.watchlist.list.query(),
    staleTime: 60000,
  });
}

// 添加自选股
export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { stockCode: string; note?: string }) =>
      api.watchlist.add.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

// 删除自选股
export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.watchlist.remove.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}
