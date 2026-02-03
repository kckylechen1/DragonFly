import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WarpTheme, WARP_THEMES } from "../themes";

interface ThemeStoreState {
  currentTheme: WarpTheme;
  setTheme: (themeId: string) => void;
  updateCSSVariable: (key: string, value: string) => void;
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      currentTheme: WARP_THEMES[0], // Default to first theme (Default)

      setTheme: (themeId: string) => {
        const theme = WARP_THEMES.find(t => t.id === themeId);
        if (theme) {
          set({ currentTheme: theme });
          applyThemeToDom(theme);
        }
      },

      updateCSSVariable: (key: string, value: string) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      },
    }),
    {
      name: "dragonfly-warp-theme",
      onRehydrateStorage: () => state => {
        if (state) {
          applyThemeToDom(state.currentTheme);
        }
      },
    }
  )
);

function applyThemeToDom(theme: WarpTheme) {
  const root = document.documentElement;

  // Core Colors
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--bg-primary", theme.colors.background);
  root.style.setProperty("--bg-secondary", theme.colors.surface);
  root.style.setProperty("--bg-tertiary", theme.colors.surface);
  
  // Text Colors - Critical for contrast
  root.style.setProperty("--text-primary", theme.colors.text.primary);
  root.style.setProperty("--text-secondary", theme.colors.text.secondary);
  root.style.setProperty("--text-muted", theme.colors.text.muted);
  
  // Panel/Border
  root.style.setProperty("--panel-border", theme.colors.border);
  root.style.setProperty("--panel-hover", theme.type === 'light' 
    ? 'rgba(0, 0, 0, 0.05)' 
    : 'rgba(255, 255, 255, 0.05)'
  );
  
  // Glass
  root.style.setProperty("--glass-opacity", (theme.glassOpacity ?? 0.8).toString());

  // Warp Background
  if (theme.bgImage) {
    root.style.setProperty("--bg-image", `url(${theme.bgImage})`);
  } else {
    root.style.removeProperty("--bg-image");
  }

  // Overlay for readability
  const overlay = theme.colors.overlay || 'none';
  root.style.setProperty("--bg-overlay", overlay);

  // Blur
  root.style.setProperty("--backdrop-blur", theme.blur === 'backdrop-blur-2xl' ? '40px' : '20px');

  // Stock colors - A股: 红涨绿跌
  root.style.setProperty("--color-up", "#ef4444");
  root.style.setProperty("--color-down", "#10b981");

  // Color scheme for browser UI
  root.style.colorScheme = theme.type === 'light' ? 'light' : 'dark';

  // Data attributes
  root.setAttribute("data-theme", theme.type || 'dark');
  root.dataset.warpTheme = theme.id;
}
