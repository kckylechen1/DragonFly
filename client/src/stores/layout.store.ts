import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CENTER_BOTTOM_MIN_SIZE,
  CENTER_TOP_DEFAULT_SIZE,
  CENTER_TOP_MIN_SIZE,
} from "@/constants/layout";

// 响应式断点 (px)
const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
} as const;

export type Breakpoint = "mobile" | "tablet" | "desktop" | "wide";

interface LayoutState {
  leftPanelSize: number; // percentage (0-100)
  centerTopSize: number; // percentage (0-100)
  rightPanelOpen: boolean;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  leftPanelCollapsed: boolean; // 仅图标模式
}

interface LayoutActions {
  setLeftPanelSize: (size: number) => void;
  setCenterTopSize: (size: number) => void;
  setRightPanelOpen: (open: boolean) => void;
  openRightPanel: () => void;
  closeRightPanel: () => void;
  toggleRightPanel: () => void;
  resetLayout: () => void;
  // D-001: 响应式相关
  updateBreakpoint: (width: number) => void;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  toggleLeftPanelCollapsed: () => void;
}

export type LayoutStore = LayoutState & LayoutActions;

// 获取初始断点
const getInitialBreakpoint = (): Breakpoint => {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width >= BREAKPOINTS.DESKTOP) return "wide";
  if (width >= BREAKPOINTS.TABLET) return "desktop";
  if (width >= BREAKPOINTS.MOBILE) return "tablet";
  return "mobile";
};

const initialBreakpoint = getInitialBreakpoint();

const initialState: LayoutState = {
  leftPanelSize: 20,
  centerTopSize: CENTER_TOP_DEFAULT_SIZE,
  rightPanelOpen: false,
  breakpoint: initialBreakpoint,
  isMobile: initialBreakpoint === "mobile",
  isTablet: initialBreakpoint === "tablet",
  isDesktop: initialBreakpoint === "desktop" || initialBreakpoint === "wide",
  isWide: initialBreakpoint === "wide",
  leftPanelCollapsed: initialBreakpoint === "tablet", // Tablet 默认折叠
};

const centerTopMaxSize = 100 - CENTER_BOTTOM_MIN_SIZE;

export const useLayoutStore = create<LayoutStore>()(
  persist(
    set => ({
      ...initialState,

      setLeftPanelSize: size =>
        set({ leftPanelSize: Math.min(Math.max(size, 10), 35) }),

      setCenterTopSize: size =>
        set({
          centerTopSize: Math.min(
            Math.max(size, CENTER_TOP_MIN_SIZE),
            centerTopMaxSize
          ),
        }),

      setRightPanelOpen: open => set({ rightPanelOpen: open }),

      openRightPanel: () => set({ rightPanelOpen: true }),

      closeRightPanel: () => set({ rightPanelOpen: false }),

      toggleRightPanel: () =>
        set(state => ({ rightPanelOpen: !state.rightPanelOpen })),

      resetLayout: () => set(initialState),

      // D-001: 响应式断点更新
      updateBreakpoint: (width: number) => {
        let breakpoint: Breakpoint;
        if (width >= BREAKPOINTS.DESKTOP) breakpoint = "wide";
        else if (width >= BREAKPOINTS.TABLET) breakpoint = "desktop";
        else if (width >= BREAKPOINTS.MOBILE) breakpoint = "tablet";
        else breakpoint = "mobile";

        set(state => {
          // Auto collapse on tablet, auto expand on desktop
          const shouldCollapse = breakpoint === "tablet";
          const newCollapsed = state.leftPanelCollapsed || shouldCollapse;

          return {
            breakpoint,
            isMobile: breakpoint === "mobile",
            isTablet: breakpoint === "tablet",
            isDesktop: breakpoint === "desktop" || breakpoint === "wide",
            isWide: breakpoint === "wide",
            leftPanelCollapsed: newCollapsed,
          };
        });
      },

      setLeftPanelCollapsed: (collapsed: boolean) =>
        set({ leftPanelCollapsed: collapsed }),

      toggleLeftPanelCollapsed: () =>
        set(state => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),
    }),
    { name: "layout-store" }
  )
);
