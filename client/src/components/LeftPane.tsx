import React, { useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  useAddToWatchlist,
  useKlineData,
  useRemoveFromWatchlist,
  useStockQuote,
  useStockSearch,
  useWatchlist,
} from "@/api";
import { Sparkline } from "@/components/Sparkline";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useWatchlistStore } from "@/stores/watchlist.store";
import { useUIStore } from "@/stores/ui.store";

const DRAG_TYPE = "STOCK_ITEM";

interface WatchlistEntry {
  key: string;
  id?: number;
  symbol: string;
  name: string;
  isSearchResult: boolean;
}

interface WatchlistRowProps {
  item: WatchlistEntry;
  isActive: boolean;
  isHighlighted?: boolean;
  showChange: boolean;
  isDraggable?: boolean;
  onSelect: (item: WatchlistEntry) => void;
}

const WatchlistRow: React.FC<WatchlistRowProps> = ({
  item,
  isActive,
  isHighlighted = false,
  showChange,
  isDraggable = false,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const quoteCode = showChange ? item.symbol : "";
  const { data: quoteData } = useStockQuote(quoteCode);
  const { data: klineData } = useKlineData(quoteCode, "day", 20);
  const changePercent = quoteData?.changePercent;
  const hasChange = typeof changePercent === "number";
  const isUp = (changePercent ?? 0) >= 0;

  const sparklineData = useMemo(() => {
    if (!klineData || !Array.isArray(klineData)) return [];
    return klineData
      .map((d: { close?: number }) => d.close ?? 0)
      .filter(Boolean);
  }, [klineData]);

  const resolvedName =
    !item.isSearchResult &&
    (item.name === item.symbol || item.name === "自选股")
      ? quoteData?.name || item.name
      : item.name;
  const resolvedItem =
    resolvedName === item.name ? item : { ...item, name: resolvedName };

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DRAG_TYPE,
      item: { id: item.id, symbol: item.symbol, name: resolvedName },
      canDrag: isDraggable && !item.isSearchResult && !!item.id,
      collect: monitor => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [item.id, item.symbol, resolvedName, isDraggable, item.isSearchResult]
  );

  return (
    <div
      ref={
        isDraggable ? (drag as unknown as React.Ref<HTMLDivElement>) : undefined
      }
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={() => onSelect(resolvedItem)}
        aria-selected={isHighlighted}
        style={{ cursor: isDraggable ? "grab" : "pointer" }}
        className={`relative w-full px-2 py-1.5 text-left transition-all duration-150 border-l-2 rounded ${
          isActive || isHighlighted
            ? "border-l-[var(--accent-primary)] text-[var(--text-primary)] bg-[var(--bg-tertiary)]/40"
            : "border-l-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        } hover:bg-[var(--bg-tertiary)]/60`}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_50px_auto] items-center gap-2">
          <div className="min-w-0 flex flex-col">
            <span className="text-sm font-semibold truncate">
              {item.symbol}
            </span>
            <span className="text-xs text-[var(--text-muted)] truncate">
              {resolvedName}
            </span>
          </div>
          {showChange && sparklineData.length >= 2 && (
            <Sparkline
              data={sparklineData}
              isUp={isUp}
              width={50}
              height={24}
              className={isHovered ? "opacity-80" : "opacity-50"}
            />
          )}
          {showChange && sparklineData.length < 2 && (
            <div style={{ width: 50 }} />
          )}
          {showChange && (
            <span
              className={`w-[8ch] text-right text-xs font-medium price-display ${
                isUp ? "text-[var(--color-up)]" : "text-[var(--color-down)]"
              }`}
            >
              {hasChange
                ? `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`
                : "--"}
            </span>
          )}
        </div>
      </button>
    </div>
  );
};

// 删除区域组件
interface DeleteZoneProps {
  onDelete: (item: { id: number; symbol: string; name: string }) => void;
}

const DeleteZone: React.FC<DeleteZoneProps> = ({ onDelete }) => {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: DRAG_TYPE,
      drop: (item: { id: number; symbol: string; name: string }) => {
        onDelete(item);
      },
      collect: monitor => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [onDelete]
  );

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={`flex items-center justify-center gap-2 py-3 mt-2 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-red-500/20 text-red-400"
          : canDrop
            ? "bg-red-500/10 text-red-400/60"
            : "bg-[var(--bg-secondary)]/30 text-[var(--text-muted)]"
      }`}
    >
      <Trash2 className="w-4 h-4" />
      <span className="text-xs">{isActive ? "松开删除" : "拖到这里删除"}</span>
    </div>
  );
};

export const LeftPane: React.FC = () => {
  const {
    currentSymbol,
    setCurrentSymbol: setWatchlistSymbol,
    addToWatchlist,
    removeFromWatchlist,
    watchlist,
  } = useWatchlistStore();

  // 同步更新 uiStore 的 currentSymbol，确保 useMarketInit 能监听到
  const setUISymbol = useUIStore(s => s.setCurrentSymbol);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openRowKey, setOpenRowKey] = useState<string | null>(null);
  const keyword = search.trim();
  const addToWatchlistMutation = useAddToWatchlist();
  const removeFromWatchlistMutation = useRemoveFromWatchlist();
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
          id: item.id,
          symbol: item.stockCode,
          name:
            item.note && item.note !== item.stockCode
              ? item.note
              : localName || item.stockCode,
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
      setOpenRowKey(null);
      return;
    }
    setSelectedIndex(prev =>
      Math.min(prev, Math.max(searchItems.length - 1, 0))
    );
  }, [isSearchMode, searchItems.length]);

  useEffect(() => {
    if (isSearchMode) {
      setSelectedIndex(0);
      setOpenRowKey(null);
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
    setOpenRowKey(null);
  };

  const handleSelect = (item: WatchlistEntry) => {
    if (item.isSearchResult) {
      handleAddStock(item);
      return;
    }
    addToWatchlist({ symbol: item.symbol, name: item.name });
    // 同步更新两个 store，确保数据流一致
    setWatchlistSymbol(item.symbol);
    setUISymbol(item.symbol);
    setOpenRowKey(null);
  };

  const handleDelete = (item: WatchlistEntry) => {
    if (!item.id) return;
    removeFromWatchlistMutation.mutate(item.id);
    removeFromWatchlist(item.symbol);
    setOpenRowKey(null);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (!isSearchMode || searchItems.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchItems.length - 1));
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

  const content = (
    <div className="flex flex-col h-full p-3 gap-3 glass">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          DragonFly
        </h2>
        <ThemeSwitcher />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          placeholder="搜索股票..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full h-9 pl-9 pr-3 text-sm bg-[var(--bg-secondary)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/50"
        />
      </div>

      {/* Watchlist */}
      <div className="flex-1 overflow-y-auto space-y-1">
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
              isDraggable={!isSearchMode}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>

      {/* Delete Zone */}
      {!isSearchMode && (
        <DeleteZone
          onDelete={item => {
            if (item.id) {
              removeFromWatchlistMutation.mutate(item.id);
              removeFromWatchlist(item.symbol);
            }
          }}
        />
      )}
    </div>
  );

  return <DndProvider backend={HTML5Backend}>{content}</DndProvider>;
};
