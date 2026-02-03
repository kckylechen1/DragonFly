/**
 * StockWorkspace - 股票工作台容器 (Theme-aware)
 *
 * 设计原则:
 * - 使用 CSS 变量确保所有主题下可读
 * - 紧凑的标签栏
 */

import React, { Suspense } from "react";
import { Search } from "lucide-react";
import { useUIStore } from "../../stores/ui.store";
import { useMarketStore } from "../../stores/market.store";
import { panelRegistry, getPanels, PanelSkeleton } from "./PanelRegistry";
import type { PanelId } from "../../types/panel";

/**
 * 股票工作台容器
 */
export const StockWorkspace: React.FC = () => {
  const { currentSymbol, activePanelId, setActivePanelId } = useUIStore();
  const stockInfo = useMarketStore((s) => s.stockInfo[currentSymbol]);
  const activeTick = useMarketStore((s) => s.data[currentSymbol]);

  const activePanel = panelRegistry[activePanelId];
  const ActiveComponent = activePanel.component;

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* 顶部工具栏：股票信息 + 搜索 - 使用更淡的分割线 */}
      <div className="h-14 border-b border-[var(--divider-subtle)] flex items-center justify-between px-4 sticky top-0 z-10 bg-[var(--bg-primary)]/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              {stockInfo?.name && stockInfo.name !== currentSymbol
                ? stockInfo.name
                : currentSymbol}
              {stockInfo?.name && stockInfo.name !== currentSymbol && (
                <span className="text-xs text-[var(--text-muted)] font-mono font-normal bg-[var(--bg-primary)]/50 px-1.5 py-0.5 rounded">
                  {currentSymbol}
                </span>
              )}
            </h2>
            <div className={`text-sm font-mono font-medium ${(activeTick?.change || 0) >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"
              }`}>
              {activeTick?.price?.toFixed(2) || "0.00"}
              <span className="ml-2">
                {activeTick ? `${activeTick.change > 0 ? '+' : ''}${activeTick.change.toFixed(2)} (${activeTick.changePercent.toFixed(2)}%)` : "0.00 (0.00%)"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--panel-hover)] rounded-lg transition-colors">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* 面板选择 Tab - 移除底部边框，用背景色区分 */}
      <div className="h-10 flex items-center px-2 bg-[var(--bg-secondary)]/30 overflow-x-auto no-scrollbar">
        {getPanels().map((panel) => (
          <button
            key={panel.id}
            onClick={() => setActivePanelId(panel.id as PanelId)}
            className={`
              flex items-center gap-2 px-3 h-full text-sm font-medium whitespace-nowrap transition-all border-b-2
              ${activePanelId === panel.id
                ? "text-[var(--color-primary)] border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--panel-hover)]"}
            `}
          >
            {panel.icon}
            {panel.title}
          </button>
        ))}
      </div>

      {/* 活跃面板内容区 */}
      <div className="flex-1 relative overflow-hidden bg-[var(--bg-primary)]/20">
        <Suspense fallback={<PanelSkeleton />}>
          <ActiveComponent symbol={currentSymbol} />
        </Suspense>
      </div>
    </div>
  );
};

export default StockWorkspace;
