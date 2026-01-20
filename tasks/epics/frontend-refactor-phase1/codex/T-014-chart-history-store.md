# T-014: 创建 chartHistory.store

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-001 (types 契约)

## 目标
- [ ] 创建 chartHistory store
- [ ] 存储最近查看的 5 个股票
- [ ] 持久化到 localStorage

---

## 步骤

### Step 1: 创建 chartHistory.store.ts

```typescript
// client/src/refactor_v2/stores/chartHistory.store.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChartHistoryItem {
  symbol: string;
  name: string;
  lastViewed: number; // timestamp
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
        set((state) => {
          // Remove if already exists
          const filtered = state.history.filter((item) => item.symbol !== symbol);

          // Add to front
          const newItem: ChartHistoryItem = {
            symbol,
            name,
            lastViewed: Date.now(),
          };

          // Keep only maxItems
          const newHistory = [newItem, ...filtered].slice(0, state.maxItems);

          return { history: newHistory };
        });
      },

      removeFromHistory: (symbol) => {
        set((state) => ({
          history: state.history.filter((item) => item.symbol !== symbol),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      getRecentSymbols: () => {
        return get().history.map((item) => item.symbol);
      },
    }),
    {
      name: "chart-history-store",
    }
  )
);

// Hook to automatically track viewed symbols
export function useTrackSymbolView() {
  const addToHistory = useChartHistoryStore((state) => state.addToHistory);

  return (symbol: string, name: string) => {
    addToHistory(symbol, name);
  };
}
```

### Step 2: 集成到 watchlist store 或 CenterTop

可以在股票切换时自动记录历史：

```typescript
// 更新 watchlist.store.ts 添加历史追踪

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchlistItem } from "@/refactor_v2/types";
import { useChartHistoryStore } from "./chartHistory.store";

interface WatchlistState {
  currentSymbol: string;
  watchlist: WatchlistItem[];
}

interface WatchlistActions {
  setCurrentSymbol: (symbol: string) => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export type WatchlistStore = WatchlistState & WatchlistActions;

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      currentSymbol: "300308",
      watchlist: [
        { symbol: "300308", name: "中际旭创" },
        { symbol: "000858", name: "五粮液" },
        { symbol: "600519", name: "贵州茅台" },
      ],

      setCurrentSymbol: (symbol) => {
        set({ currentSymbol: symbol });

        // Track in history
        const item = get().watchlist.find((w) => w.symbol === symbol);
        if (item) {
          // Note: We need to call this outside of the store action
          // to avoid circular dependency issues
          setTimeout(() => {
            useChartHistoryStore.getState().addToHistory(symbol, item.name);
          }, 0);
        }
      },

      addToWatchlist: (item) => {
        set((state) => {
          if (state.watchlist.some((w) => w.symbol === item.symbol)) {
            return state;
          }
          return { watchlist: [...state.watchlist, item] };
        });
      },

      removeFromWatchlist: (symbol) => {
        set((state) => ({
          watchlist: state.watchlist.filter((w) => w.symbol !== symbol),
        }));
      },
    }),
    { name: "watchlist-store" }
  )
);
```

### Step 3: 创建 RecentlyViewed 组件（可选）

```typescript
// client/src/refactor_v2/components/RecentlyViewed.tsx

import React from "react";
import { History, X } from "lucide-react";
import { useChartHistoryStore } from "@/refactor_v2/stores/chartHistory.store";
import { useWatchlistStore } from "@/refactor_v2/stores/watchlist.store";

export const RecentlyViewed: React.FC = () => {
  const { history, removeFromHistory, clearHistory } = useChartHistoryStore();
  const { setCurrentSymbol, currentSymbol } = useWatchlistStore();

  if (history.length === 0) return null;

  return (
    <div className="p-2 border-t border-[var(--panel-border)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <History className="w-3 h-3" />
          <span>最近查看</span>
        </div>
        <button
          onClick={clearHistory}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          清空
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {history.map((item) => (
          <button
            key={item.symbol}
            onClick={() => setCurrentSymbol(item.symbol)}
            className={`group flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              currentSymbol === item.symbol
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
            }`}
          >
            <span>{item.symbol}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFromHistory(item.symbol);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### Step 4: 更新 stores/index.ts

```typescript
// client/src/refactor_v2/stores/index.ts

export * from "./aiChat.store";
export * from "./layout.store";
export * from "./watchlist.store";
export * from "./chartHistory.store";
```

### Step 5: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] chartHistory.store 已创建
- [ ] 支持添加/删除/清空历史
- [ ] 最多保留 5 条记录
- [ ] 持久化到 localStorage
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/stores/chartHistory.store.ts`
- `client/src/refactor_v2/stores/watchlist.store.ts` (更新)
- `client/src/refactor_v2/stores/index.ts`
- `client/src/refactor_v2/components/RecentlyViewed.tsx` (可选)
