import { History, X } from "lucide-react";
import { useChartHistoryStore } from "@/stores/chartHistory.store";
import { useWatchlistStore } from "@/stores/watchlist.store";

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
        {history.map(item => (
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
              onClick={e => {
                e.stopPropagation();
                removeFromHistory(item.symbol);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`移除 ${item.symbol}`}
            >
              <X className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
};
