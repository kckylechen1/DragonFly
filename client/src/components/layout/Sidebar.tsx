/**
 * Sidebar - 可折叠侧边栏（Perplexity/Manus 风格）
 *
 * 设计原则:
 * - 简洁导航，无冗余
 * - 主题切换统一到设置面板
 * - 响应式：小屏幕时可完全隐藏
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  Search,
  Library,
  Star,
  Briefcase,
  FolderOpen,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Palette,
} from "lucide-react";
import { useUIStore } from "../../stores/ui.store";
import { useWatchlistStore } from "../../stores/watchlist.store";

/**
 * 侧边栏菜单项
 */
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  collapsed,
  onClick,
  active = false,
}) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-2.5 px-3 py-2 text-sm
      hover:bg-[var(--panel-hover)] transition-colors cursor-pointer rounded-md mx-1
      ${active ? "bg-[var(--panel-hover)] text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}
    `}
    title={collapsed ? label : undefined}
  >
    <span className="flex-shrink-0">{icon}</span>
    {!collapsed && <span className="font-medium truncate">{label}</span>}
  </button>
);

/**
 * 自选股分组数据结构
 */
interface WatchlistGroup {
  id: string;
  name: string;
  type: "favorites" | "portfolio" | "custom";
  items: Array<{
    symbol: string;
    name: string;
    change?: number; // 盈亏百分比
  }>;
}

/**
 * 可折叠侧边栏（Perplexity/Manus 风格）
 */
export const Sidebar: React.FC = () => {
  const {
    sidebarCollapsed,
    toggleSidebar,
    openSettings,
    setCurrentSymbol: setUISymbol,
  } = useUIStore();
  const { setCurrentSymbol: setWatchlistSymbol } = useWatchlistStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["portfolio", "favorites"])
  );

  // 处理股票选择
  const handleSelectStock = (symbol: string) => {
    // 同时更新两个 store
    setWatchlistSymbol(symbol); // 更新 watchlistStore（高亮）
    setUISymbol(symbol); // 更新 uiStore（触发数据加载）
  };

  // 模拟自选股分组数据
  const watchlistGroups: WatchlistGroup[] = [
    {
      id: "portfolio",
      name: "持仓",
      type: "portfolio",
      items: [
        { symbol: "300308", name: "中际旭创", change: 2.35 },
        { symbol: "000858", name: "五粮液", change: -1.2 },
      ],
    },
    {
      id: "favorites",
      name: "自选股",
      type: "favorites",
      items: [
        { symbol: "600519", name: "贵州茅台", change: 0.85 },
        { symbol: "00700", name: "腾讯控股", change: 1.5 },
        { symbol: "BABA", name: "阿里巴巴", change: -0.5 },
      ],
    },
    {
      id: "group1",
      name: "AI 概念股",
      type: "custom",
      items: [
        { symbol: "NVDA", name: "英伟达", change: 3.2 },
        { symbol: "AMD", name: "超微半导体", change: 1.8 },
      ],
    },
  ];

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const getGroupIcon = (type: WatchlistGroup["type"]) => {
    switch (type) {
      case "portfolio":
        return <Briefcase size={14} />;
      case "favorites":
        return <Star size={14} />;
      case "custom":
        return <FolderOpen size={14} />;
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 62 : 264 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="h-full backdrop-blur-xl border-r border-[var(--panel-border)] flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      {/* 顶部 Logo + 折叠按钮 */}
      <div className="flex items-center justify-between px-3 py-2">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-[var(--panel-hover)] active:scale-95 transition-all cursor-pointer"
          aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={16} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronLeft size={16} className="text-[var(--text-muted)]" />
          )}
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-2">
        <SidebarItem
          icon={<Plus size={18} />}
          label="新建对话"
          collapsed={sidebarCollapsed}
        />
        <SidebarItem
          icon={<Search size={18} />}
          label="搜索"
          collapsed={sidebarCollapsed}
        />
        <SidebarItem
          icon={<Library size={18} />}
          label="历史记录"
          collapsed={sidebarCollapsed}
        />

        {/* 自选股分组 - 只在展开时显示 */}
        {!sidebarCollapsed && (
          <div className="mt-4 px-2">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 px-2">
              自选股
            </div>
            <div className="space-y-1">
              {watchlistGroups.map(group => (
                <div key={group.id} className="mb-2">
                  {/* 分组标题 - 可折叠 */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[var(--panel-hover)] transition-colors group"
                  >
                    <span className="text-[var(--text-muted)] text-xs">
                      {getGroupIcon(group.type)}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-secondary)] flex-1 text-left">
                      {group.name}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-[var(--text-muted)] transition-transform ${expandedGroups.has(group.id) ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {/* 分组内容 */}
                  <AnimatePresence>
                    {expandedGroups.has(group.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 pr-2 space-y-0.5 mt-1">
                          {group.items.map(item => (
                            <button
                              key={item.symbol}
                              onClick={() => handleSelectStock(item.symbol)}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[var(--panel-hover)] transition-colors group/item text-left"
                            >
                              <div className="flex flex-col gap-0">
                                <span className="text-xs font-semibold text-[var(--text-secondary)] group-hover/item:text-[var(--accent-primary)] transition-colors">
                                  {item.symbol}
                                </span>
                                <span className="text-[11px] text-[var(--text-muted)] leading-tight">
                                  {item.name}
                                </span>
                              </div>
                              {/* 盈亏指示器 */}
                              {item.change !== undefined && (
                                <div className="flex items-center gap-1">
                                  {item.change >= 0 ? (
                                    <TrendingUp
                                      size={12}
                                      className="text-[var(--color-up)]"
                                    />
                                  ) : (
                                    <TrendingDown
                                      size={12}
                                      className="text-[var(--color-down)]"
                                    />
                                  )}
                                  <span
                                    className={`text-xs font-medium ${item.change >= 0
                                        ? "text-[var(--color-up)]"
                                        : "text-[var(--color-down)]"
                                      }`}
                                  >
                                    {item.change >= 0 ? "+" : ""}
                                    {item.change.toFixed(2)}%
                                  </span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 最近对话 - 只在展开时显示 */}
        {!sidebarCollapsed && (
          <div className="mt-4 px-2">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 px-2">
              最近对话
            </div>
            <div className="space-y-0.5 px-1">
              <div className="px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] rounded-md cursor-pointer truncate transition-colors">
                分析茅台走势...
              </div>
              <div className="px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] rounded-md cursor-pointer truncate transition-colors">
                比较腾讯和阿里...
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 底部操作栏 */}
      <div className="border-t border-[var(--panel-border)] p-1.5 space-y-0.5">
        {/* 主题/外观按钮 - 打开设置面板的外观标签 */}
        <button
          onClick={() => openSettings("appearance")}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--panel-hover)] active:scale-95 transition-all text-[var(--text-secondary)] cursor-pointer"
          aria-label="外观设置"
          title="外观设置"
        >
          <Palette size={16} className="text-[var(--color-primary)]" />
          {!sidebarCollapsed && (
            <span className="text-xs font-medium">外观</span>
          )}
        </button>

        {/* 设置按钮 */}
        <button
          onClick={() => openSettings()}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--panel-hover)] active:scale-95 transition-all text-[var(--text-secondary)] cursor-pointer"
          aria-label="设置"
        >
          <Settings size={16} />
          {!sidebarCollapsed && (
            <span className="text-xs font-medium">设置</span>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

Sidebar.displayName = "Sidebar";

export default Sidebar;
