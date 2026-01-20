import { useMemo } from "react";
import { useThemeStore } from "@/refactor_v2/stores/theme.store";

export function useTheme() {
  const {
    themeId,
    currentTheme,
    availableThemes,
    setTheme,
    updateCSSVariable,
  } = useThemeStore();

  const isPixel = themeId === "pixel";
  const isModern = themeId === "modern";
  const isDark = themeId === "dark" || themeId === "cyberpunk";
  const isCyberpunk = themeId === "cyberpunk";

  return useMemo(
    () => ({
      themeId,
      theme: currentTheme,
      availableThemes,
      setTheme,
      updateCSSVariable,
      isPixel,
      isModern,
      isDark,
      isCyberpunk,
    }),
    [themeId, currentTheme, availableThemes]
  );
}
