import { trpc } from "@/lib/trpc";

export interface UseWatchlistOptions {
  selectedStock: string | null;
  onSelectedStockCleared: () => void;
  onAddSuccess?: () => void;
  onAddError?: (message?: string) => void;
}

export function useWatchlist({
  selectedStock,
  onSelectedStockCleared,
  onAddSuccess,
  onAddError,
}: UseWatchlistOptions) {
  const {
    data: watchlist,
    isLoading,
    refetch,
  } = trpc.watchlist.list.useQuery();

  const addMutation = trpc.watchlist.add.useMutation({
    onSuccess: data => {
      if (data.success) {
        refetch();
        onAddSuccess?.();
      } else {
        onAddError?.(data.error);
      }
    },
  });

  const deleteMutation = trpc.watchlist.remove.useMutation({
    onSuccess: (data, variables) => {
      if (data.success) {
        const isSelectedDeleted = watchlist?.some(
          item => item.id === variables.id && item.stockCode === selectedStock
        );
        refetch();
        if (isSelectedDeleted) {
          onSelectedStockCleared();
        }
      }
    },
  });

  return { watchlist, isLoading, addMutation, deleteMutation };
}
