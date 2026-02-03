/**
 * D-001: Responsive Hook
 * 监听窗口大小变化并更新 layout store 中的断点状态
 * 开始时间: 2026-01-30 00:38:00
 */

import { useEffect } from "react";
import { useLayoutStore } from "../stores/layout.store";

export const useResponsive = () => {
  const { updateBreakpoint } = useLayoutStore();

  useEffect(() => {
    // 初始更新
    updateBreakpoint(window.innerWidth);

    // 监听 resize
    const handleResize = () => {
      updateBreakpoint(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateBreakpoint]);
};

export default useResponsive;
