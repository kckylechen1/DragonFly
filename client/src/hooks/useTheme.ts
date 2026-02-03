import { useMemo } from "react";
import { useThemeStore } from "@/stores/theme.store";
import { WARP_THEMES } from "@/themes";

export function useTheme() {
  const {
    currentTheme,
    setTheme,
    updateCSSVariable,
  } = useThemeStore();

  return useMemo(
    () => ({
      themeId: currentTheme.id,
      theme: currentTheme,
      availableThemes: WARP_THEMES.map(t => ({ id: t.id, label: t.name, bgImage: t.bgImage })),
      setTheme,
      updateCSSVariable,
      isDark: currentTheme.type === 'dark',
      bgImage: currentTheme.bgImage,
      glassOpacity: currentTheme.glassOpacity,
      blur: currentTheme.blur
    }),
    [currentTheme, setTheme, updateCSSVariable]
  );
}
