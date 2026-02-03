/**
 * UI Store - UI 状态管理
 *
 * 负责人: GLM (sidebar, panel) + Codex (settings)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PanelId } from "../types/panel";

interface UIState {
  // 侧边栏
  sidebarCollapsed: boolean;
  // 设置面板
  settingsOpen: boolean;
  activeSettingsTab: "appearance" | "trading" | "api" | "notifications";
  // Command Palette
  commandPaletteOpen: boolean;
  // 当前股票
  currentSymbol: string;
  // 当前激活面板
  activePanelId: PanelId;
  // 字体缩放
  fontScale: "small" | "medium" | "large";
}

interface UIActions {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Settings
  openSettings: (tab?: UIState["activeSettingsTab"]) => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  setActiveSettingsTab: (tab: UIState["activeSettingsTab"]) => void;
  // Command Palette
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  // Symbol & Panel
  setCurrentSymbol: (symbol: string) => void;
  setActivePanelId: (id: PanelId) => void;
  // Font Scale
  setFontScale: (scale: "small" | "medium" | "large") => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
  sidebarCollapsed: false,
  settingsOpen: false,
  activeSettingsTab: "appearance",
  commandPaletteOpen: false,
  currentSymbol: "600519", // 贵州茅台 - A股默认股票
  activePanelId: "kline",
  fontScale: "medium", // 默认中等字号
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Sidebar
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Settings
      openSettings: (tab) =>
        set((state) => ({
          settingsOpen: true,
          activeSettingsTab: tab || state.activeSettingsTab,
        })),
      closeSettings: () => set({ settingsOpen: false }),
      toggleSettings: () =>
        set((state) => ({ settingsOpen: !state.settingsOpen })),
      setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),

      // Command Palette
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),

      // Symbol & Panel
      setCurrentSymbol: (symbol) => set({ currentSymbol: symbol }),
      setActivePanelId: (id) => set({ activePanelId: id }),
      // Font Scale
      setFontScale: (scale) => set({ fontScale: scale }),
    }),
    {
      name: "dragonfly-ui-state",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        currentSymbol: state.currentSymbol,
        activePanelId: state.activePanelId,
        fontScale: state.fontScale,
      }),
    }
  )
);
