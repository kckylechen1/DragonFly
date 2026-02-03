/**
 * Performance Store - 性能偏好管理
 *
 * 作用：统一管理视觉特效的降级逻辑。
 * 支持三个性能等级：full | reduced | minimal
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PerformanceMode = "full" | "reduced" | "minimal";

interface PerformanceState {
  performanceMode: PerformanceMode;
  prefersReducedMotion: boolean;

  // Actions
  setPerformanceMode: (mode: PerformanceMode) => void;
  setPrefersReducedMotion: (value: boolean) => void;

  // Selectors/Computed
  getShouldAnimate: () => boolean;
  getShouldBlur: () => boolean;
  getShouldGlow: () => boolean;
}

/**
 * 检测用户是否偏好减少动画
 */
const getInitialReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      performanceMode: "full",
      prefersReducedMotion: getInitialReducedMotion(),

      setPerformanceMode: (mode) => set({ performanceMode: mode }),

      setPrefersReducedMotion: (value) => set({ prefersReducedMotion: value }),

      getShouldAnimate: () => {
        const { performanceMode, prefersReducedMotion } = get();
        return performanceMode === "full" && !prefersReducedMotion;
      },

      getShouldBlur: () => {
        return get().performanceMode === "full";
      },

      getShouldGlow: () => {
        return get().performanceMode !== "minimal";
      },
    }),
    {
      name: "dragonfly-performance-state",
    }
  )
);
