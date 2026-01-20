import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchlistStore } from "@/refactor_v2/types";
import { useChartHistoryStore } from "@/refactor_v2/stores/chartHistory.store";

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      currentSymbol: "300308",
      watchlist: [
        { symbol: "300308", name: "中际旭创" },
        { symbol: "000858", name: "五粮液" },
        { symbol: "600519", name: "贵州茅台" },
      ],

      setCurrentSymbol: symbol => {
        set({ currentSymbol: symbol });

        const item = get().watchlist.find(watch => watch.symbol === symbol);
        if (item) {
          setTimeout(() => {
            useChartHistoryStore
              .getState()
              .addToHistory(symbol, item.name);
          }, 0);
        }
      },

      addToWatchlist: item => {
        set(state => {
          if (state.watchlist.some(watch => watch.symbol === item.symbol)) {
            return state;
          }
          return { watchlist: [...state.watchlist, item] };
        });
      },

      removeFromWatchlist: symbol => {
        set(state => ({
          watchlist: state.watchlist.filter(watch => watch.symbol !== symbol),
        }));
      },
    }),
    { name: "watchlist-store" }
  )
);
