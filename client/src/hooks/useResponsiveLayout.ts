/**
 * useResponsiveLayout - 响应式布局 Hook
 *
 * 负责人: GLM
 * L-007 开始时间: 2026-01-30 00:32
 *
 * 作用：检测窗口宽度并同步到全局 UI 状态
 */

import { useEffect, useState } from "react";
import { useUIStore } from "../stores/ui.store";

/**
 * 响应式布局断点
 */
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  WIDE: 1440,
} as const;

/**
 * 布局模式
 */
export type LayoutMode = "mobile" | "tablet" | "desktop" | "wide";

/**
 * 响应式布局 Hook
 */
export function useResponsiveLayout() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );

  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWidth(newWidth);

      // ⚠️ 自动折叠侧边栏逻辑
      if (newWidth < BREAKPOINTS.TABLET) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    // 初始化执行一次
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed]);

  const isMobile = width < BREAKPOINTS.MOBILE;
  const isTablet = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET;
  const isDesktop = width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.WIDE;
  const isWide = width >= BREAKPOINTS.WIDE;

  const mode: LayoutMode = isMobile
    ? "mobile"
    : isTablet
      ? "tablet"
      : isWide
        ? "wide"
        : "desktop";

  return {
    width,
    mode,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    showSidebar: !isMobile,
    showBothPanels: width >= BREAKPOINTS.TABLET,
  };
}
