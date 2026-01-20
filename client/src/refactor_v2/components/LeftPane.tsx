import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  useAddToWatchlist,
  useStockQuote,
  useStockSearch,
  useWatchlist,
} from "@/refactor_v2/api";
import { ThemeSwitcher } from "@/refactor_v2/components/ThemeSwitcher";
import { useWatchlistStore } from "@/refactor_v2/stores/watchlist.store";

interface WatchlistEntry {
  key: string;
  symbol: string;
  name: string;
  isSearchResult: boolean;
}

interface WatchlistRowProps {
  item: WatchlistEntry;
  isActive: boolean;
  isHighlighted?: boolean;
  showChange: boolean;
  onSelect: (item: WatchlistEntry) => void;
}

const WatchlistRow: React.FC<WatchlistRowProps> = ({
  item,
  isActive,
  isHighlighted = false,
  showChange,
  onSelect,
}) => {
  const quoteCode = showChange ? item.symbol : "";
  const { data: quoteData } = useStockQuote(quoteCode);
  const changePercent = quoteData?.changePercent;
  const hasChange = typeof changePercent === "number";
  const isUp = (changePercent ?? 0) >= 0;

  return (
    <button
      onClick={() => onSelect(item)}
      aria-selected={isHighlighted}
      className={`w-full px-3 py-2 text-left transition-all duration-150 border-l-[3px] rounded-md ${isActive || isHighlighted
          ? "border-l-[var(--accent-primary)] text-[var(--text-primary)] bg-[var(--bg-tertiary)]/40"
          : "border-l-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        } hover:translate-x-1 hover:bg-[var(--bg-tertiary)]/60`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{item.symbol}</span>
          <span className="text-xs text-[var(--text-muted)]">{item.name}</span>
        </div>
        {showChange && (
          <span
            className={`text-xs font-medium price-display ${isUp ? "text-[var(--color-up)]" : "text-[var(--color-down)]"
              }`}
          >
            {hasChange
              ? `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`
              : "--"}
          </span>
        )}
      </div>
    </button>
  );
};

export const LeftPane: React.FC = () => {
  const { currentSymbol, setCurrentSymbol, addToWatchlist, watchlist } =
    useWatchlistStore();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const keyword = search.trim();
  const addToWatchlistMutation = useAddToWatchlist();
  const {
    data: watchlistData,
    isLoading: watchlistLoading,
    isError: watchlistError,
  } = useWatchlist();
  const {
    data: searchResults,
    isLoading: searchLoading,
    isError: searchError,
  } = useStockSearch(keyword);

  const watchlistNameMap = useMemo(() => {
    return new Map(watchlist.map(item => [item.symbol, item.name]));
  }, [watchlist]);

  const searchItems = useMemo<WatchlistEntry[]>(() => {
    if (keyword.length === 0) return [];

    return (searchResults ?? [])
      .map((item: { code?: string; symbol?: string; name?: string }) => {
        const symbol = item.code ?? item.symbol ?? "";
        return {
          key: `search-${symbol}`,
          symbol,
          name: item.name || symbol || "未知",
          isSearchResult: true,
        };
      })
      .filter((item: WatchlistEntry) => item.symbol);
  }, [keyword, searchResults]);

  const watchlistItems = useMemo<WatchlistEntry[]>(() => {
    return (watchlistData ?? []).map(
      (item: { id: number; stockCode: string; note?: string | null }) => {
        const localName = watchlistNameMap.get(item.stockCode);
        return {
          key: `watch-${item.id}`,
          symbol: item.stockCode,
          name:
            item.note && item.note !== item.stockCode
              ? item.note
              : localName || "自选股",
          isSearchResult: false,
        };
      }
    );
  }, [watchlistData, watchlistNameMap]);

  const isSearchMode = keyword.length > 0;
  const listItems = isSearchMode ? searchItems : watchlistItems;
  const isLoading = isSearchMode ? searchLoading : watchlistLoading;
  const hasError = isSearchMode ? searchError : watchlistError;

  useEffect(() => {
    if (!isSearchMode) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex(prev =>
      Math.min(prev, Math.max(searchItems.length - 1, 0))
    );
  }, [isSearchMode, searchItems.length]);

  useEffect(() => {
    if (isSearchMode) {
      setSelectedIndex(0);
    }
  }, [keyword, isSearchMode]);

  const handleAddStock = (item: WatchlistEntry) => {
    addToWatchlist({ symbol: item.symbol, name: item.name });
    addToWatchlistMutation.mutate({
      stockCode: item.symbol,
      note: item.name,
    });
    setSearch("");
    setSelectedIndex(0);
  };

  const handleSelect = (item: WatchlistEntry) => {
    if (item.isSearchResult) {
      handleAddStock(item);
      return;
    }
    setCurrentSymbol(item.symbol);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchMode || searchItems.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex(prev =>
          Math.min(prev + 1, searchItems.length - 1)
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case "Enter":
        event.preventDefault();
        handleAddStock(searchItems[selectedIndex]);
        break;
      case "Escape":
        event.preventDefault();
        setSearch("");
        setSelectedIndex(0);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4 glass">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          DragonFly
        </h2>
        <ThemeSwitcher />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          placeholder="搜索股票..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full pl-8 pr-3 py-2 bg-[var(--bg-secondary)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/50"
        />
      </div>

      {/* Watchlist */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="text-sm text-[var(--text-muted)]">加载中...</div>
        ) : hasError ? (
          <div className="text-sm text-[var(--text-muted)]">加载失败</div>
        ) : listItems.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)]">暂无数据</div>
        ) : (
          listItems.map((item, index) => (
            <WatchlistRow
              key={item.key}
              item={item}
              isActive={!isSearchMode && currentSymbol === item.symbol}
              isHighlighted={isSearchMode && index === selectedIndex}
              showChange={!isSearchMode}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};
