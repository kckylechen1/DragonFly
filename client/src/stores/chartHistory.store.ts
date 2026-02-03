import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChartHistoryItem {
  symbol: string;
  name: string;
  lastViewed: number;
}

interface ChartHistoryState {
  history: ChartHistoryItem[];
  maxItems: number;
}

interface ChartHistoryActions {
  addToHistory: (symbol: string, name: string) => void;
  removeFromHistory: (symbol: string) => void;
  clearHistory: () => void;
  getRecentSymbols: () => string[];
}

export type ChartHistoryStore = ChartHistoryState & ChartHistoryActions;

const MAX_HISTORY_ITEMS = 5;

export const useChartHistoryStore = create<ChartHistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      maxItems: MAX_HISTORY_ITEMS,

      addToHistory: (symbol, name) => {
        set(state => {
          const filtered = state.history.filter(item => item.symbol !== symbol);

          const newItem: ChartHistoryItem = {
            symbol,
            name,
            lastViewed: Date.now(),
          };

          const newHistory = [newItem, ...filtered].slice(0, state.maxItems);

          return { history: newHistory };
        });
      },

      removeFromHistory: symbol => {
        set(state => ({
          history: state.history.filter(item => item.symbol !== symbol),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      getRecentSymbols: () => {
        return get().history.map(item => item.symbol);
      },
    }),
    {
      name: "chart-history-store",
    }
  )
);

export function useTrackSymbolView() {
  const addToHistory = useChartHistoryStore(state => state.addToHistory);

  return (symbol: string, name: string) => {
    addToHistory(symbol, name);
  };
}
