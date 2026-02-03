/**
 * 全局命令面板组件 (Cmd+K)
 *
 * 负责人: 🟢 Codex
 * ⏱️ 开始时间: 2026-01-30 00:00
 */

import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import { Search, Layout, Moon, Sun, TrendingUp } from "lucide-react";
import { useUIStore } from "../stores/ui.store";
import { useWatchlistStore } from "../stores/watchlist.store";
import { useStockSearch } from "../api/stocks";
import type { PanelId } from "../types/panel";

interface PanelDef {
  id: PanelId;
  title: string;
}

const panels: PanelDef[] = [
  { id: "kline", title: "K线图" },
  { id: "intraday", title: "分时图" },
  { id: "orderbook", title: "盘口" },
  { id: "indicators", title: "指标分析" },
  { id: "advice", title: "AI 建议" },
  { id: "news", title: "资讯" },
];

const hotStocks = [
  { code: "600519", name: "贵州茅台", sector: "白酒" },
  { code: "000858", name: "五粮液", sector: "白酒" },
  { code: "300750", name: "宁德时代", sector: "锂电池" },
  { code: "002594", name: "比亚迪", sector: "新能源汽车" },
];

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen: open,
    closeCommandPalette,
    openCommandPalette,
    setActivePanelId,
  } = useUIStore();

  const { setCurrentSymbol, addToWatchlist } = useWatchlistStore();

  const [searchValue, setSearchValue] = useState("");

  const { data: searchResults, isLoading: searchLoading } =
    useStockSearch(searchValue);

  const stockResults = useMemo(() => {
    if (searchValue.length === 0) return [];
    return (searchResults ?? []).map(
      (item: { code?: string; symbol?: string; name?: string }) => ({
        code: item.code ?? item.symbol ?? "",
        name: item.name ?? "",
      })
    );
  }, [searchValue, searchResults]);

  const handleSelectStock = (code: string, name?: string) => {
    setCurrentSymbol(code);
    if (name) {
      addToWatchlist({ symbol: code, name });
    }
    setSearchValue("");
    closeCommandPalette();
  };

  // 快捷键监听
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
      if (e.key === "Escape" && open) {
        setSearchValue("");
        closeCommandPalette();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, closeCommandPalette, openCommandPalette]);

  useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-cyan-950/20 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <Command
          label="Command Palette"
          className="flex flex-col"
          shouldFilter={searchValue.length === 0}
        >
          <div className="flex items-center border-b border-gray-800 px-4">
            <Search className="w-5 h-5 text-gray-500 mr-2" />
            <Command.Input
              autoFocus
              value={searchValue}
              onValueChange={setSearchValue}
              placeholder="搜索股票代码或名称..."
              className="flex-1 h-14 bg-transparent border-none outline-none text-gray-200 text-sm placeholder:text-gray-600"
            />
            {searchLoading && (
              <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-2" />
            )}
            <button
              onClick={closeCommandPalette}
              className="text-[10px] text-gray-600 border border-gray-800 px-1.5 py-0.5 rounded uppercase tracking-widest"
            >
              ESC
            </button>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-smooth">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              {searchLoading ? "搜索中..." : "未找到相关结果"}
            </Command.Empty>

            {/* 搜索结果 */}
            {stockResults.length > 0 && (
              <Command.Group
                heading="搜索结果"
                className="px-2 mb-2 text-[11px] text-gray-600 uppercase tracking-wider"
              >
                {stockResults.map((stock: { code: string; name: string }) => (
                  <CommandItem
                    key={stock.code}
                    value={`${stock.code} ${stock.name}`}
                    onSelect={() => handleSelectStock(stock.code, stock.name)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <TrendingUp size={16} className="text-cyan-500" />
                      <span className="font-mono text-cyan-400 w-16">
                        {stock.code}
                      </span>
                      <span className="text-gray-300 flex-1">{stock.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </Command.Group>
            )}

            {/* 热门个股 (无搜索时显示) */}
            {searchValue.length === 0 && (
              <Command.Group
                heading="热门个股"
                className="px-2 mb-2 text-[11px] text-gray-600 uppercase tracking-wider"
              >
                {hotStocks.map(stock => (
                  <CommandItem
                    key={stock.code}
                    value={`${stock.code} ${stock.name} ${stock.sector}`}
                    onSelect={() => handleSelectStock(stock.code, stock.name)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <TrendingUp size={16} className="text-gray-600" />
                      <span className="font-mono text-gray-400 w-16">
                        {stock.code}
                      </span>
                      <span className="text-gray-300 flex-1">{stock.name}</span>
                      <span className="text-xs text-gray-600">
                        {stock.sector}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </Command.Group>
            )}

            {/* 常用面板 (无搜索时显示) */}
            {searchValue.length === 0 && (
              <Command.Group
                heading="面板导航"
                className="px-2 mb-2 text-[11px] text-gray-600 uppercase tracking-wider"
              >
                {panels.map(panel => (
                  <CommandItem
                    key={panel.id}
                    onSelect={() => {
                      setActivePanelId(panel.id);
                      closeCommandPalette();
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Layout size={16} className="text-gray-600" />
                      <span>跳转至 {panel.title}</span>
                    </div>
                  </CommandItem>
                ))}
              </Command.Group>
            )}

            {/* 系统设置 (无搜索时显示) */}
            {searchValue.length === 0 && (
              <Command.Group
                heading="系统偏好"
                className="px-2 text-[11px] text-gray-600 uppercase tracking-wider"
              >
                <CommandItem onSelect={() => {}}>
                  <div className="flex items-center gap-2">
                    <Sun size={16} className="text-gray-600" />
                    <span>切换至明亮模式</span>
                  </div>
                </CommandItem>
                <CommandItem onSelect={() => {}}>
                  <div className="flex items-center gap-2">
                    <Moon size={16} className="text-gray-600" />
                    <span>切换至深邃模式</span>
                  </div>
                </CommandItem>
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
      {/* 点击外部关闭 */}
      <div className="absolute inset-0 -z-10" onClick={closeCommandPalette} />
    </div>
  );

  return createPortal(content, document.body);
};

const CommandItem = ({
  children,
  onSelect,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  value?: string;
}) => (
  <Command.Item
    value={value}
    onSelect={onSelect}
    className="flex items-center px-3 py-2.5 rounded-xl text-sm text-gray-400 aria-selected:bg-cyan-500/10 aria-selected:text-cyan-400 cursor-pointer transition-colors"
  >
    {children}
  </Command.Item>
);

export default CommandPalette;
