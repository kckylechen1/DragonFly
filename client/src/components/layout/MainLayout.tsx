/**
 * MainLayout - 主布局组件 (Perplexity/Manus Style)
 *
 * 负责人: GLM + Droid
 *
 * 布局设计 (Perplexity/Manus 风格):
 * - AI Chat 居中显示，最大宽度限制
 * - 侧边栏可折叠
 * - Stock Panel 作为右侧抽屉/面板
 * - 响应式设计：小屏幕时 Stock Panel 变为底部抽屉
 */

import React, { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChartLine, PanelRightOpen } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ChatWorkspace } from "../chat/ChatWorkspace";
import { StockWorkspace } from "../panels/StockWorkspace";
import { useUIStore } from "../../stores/ui.store";

export const MainLayout: React.FC = () => {
  const [stockPanelOpen, setStockPanelOpen] = useState(true);
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="h-screen flex bg-[var(--bg-primary)] overflow-hidden relative selection:bg-[var(--color-primary)]/30">
      {/* Warp Background Layer */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: "var(--bg-image)",
          opacity: "var(--bg-image) ? 1 : 0",
        }}
      />

      {/* Gradient Overlay for better text readability */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-700"
        style={{ background: "var(--bg-overlay)" }}
      />

      {/* Content Layer */}
      <div className="relative z-10 flex w-full h-full">
        {/* 可折叠侧边栏 */}
        <Sidebar />

        {/* 主内容区 - Perplexity 风格居中布局 */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* 顶部工具栏 - 极简 */}
          <header className="h-12 flex items-center justify-between px-4 border-b border-[var(--panel-border)] backdrop-blur-md bg-[var(--bg-secondary)]/50">
            <div className="flex items-center gap-2">
              {/* 可以放搜索或其他全局操作 */}
            </div>

            {/* Stock Panel 切换按钮 */}
            <button
              onClick={() => setStockPanelOpen(!stockPanelOpen)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${
                  stockPanelOpen
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                    : "text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] border border-transparent"
                }
              `}
            >
              <ChartLine size={14} />
              <span className="hidden sm:inline">行情面板</span>
              {!stockPanelOpen && <PanelRightOpen size={14} />}
            </button>
          </header>

          {/* 主内容：可拖拽分割或单栏 */}
          <div className="flex-1 flex overflow-hidden">
            {stockPanelOpen ? (
              /* 双栏布局：Chat + Stock */
              <PanelGroup
                direction="horizontal"
                autoSaveId="dragonfly-main-layout-v2"
                className="flex-1"
              >
                {/* AI Chat 工作区 - 居中 */}
                <Panel
                  id="chat-panel"
                  defaultSize={65}
                  minSize={50}
                  maxSize={80}
                  className="flex flex-col"
                >
                  <div className="flex-1 flex flex-col backdrop-blur-md bg-[var(--bg-primary)]/60">
                    <ChatWorkspace />
                  </div>
                </Panel>

                {/* 拖拽手柄 */}
                <PanelResizeHandle className="w-px bg-[var(--panel-border)] hover:bg-[var(--text-muted)]/50 transition-colors cursor-col-resize">
                  <div className="absolute inset-y-0 -left-1 -right-1" />
                </PanelResizeHandle>

                {/* Stock 工作区 */}
                <Panel
                  id="stock-panel"
                  defaultSize={35}
                  minSize={20}
                  maxSize={50}
                  className="flex flex-col backdrop-blur-md bg-[var(--bg-primary)]/60 border-l border-[var(--panel-border)]"
                >
                  <StockWorkspace />
                </Panel>
              </PanelGroup>
            ) : (
              /* 单栏布局：Chat 居中 */
              <div className="flex-1 flex flex-col backdrop-blur-md bg-[var(--bg-primary)]/60">
                <ChatWorkspace />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端 Stock Panel 抽屉 (底部滑出) - 仅在小屏幕显示 */}
      <AnimatePresence>
        {stockPanelOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 h-[60vh] z-50 lg:hidden backdrop-blur-xl bg-[var(--bg-secondary)]/95 border-t border-[var(--panel-border)] rounded-t-2xl shadow-2xl"
          >
            {/* 抽屉把手 */}
            <div className="flex items-center justify-center py-2">
              <div className="w-12 h-1 bg-[var(--text-muted)]/30 rounded-full" />
            </div>
            {/* 关闭按钮 */}
            <button
              onClick={() => setStockPanelOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--panel-hover)] transition-colors"
            >
              <X size={18} />
            </button>
            <div className="h-[calc(100%-2rem)] overflow-hidden">
              <StockWorkspace />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
