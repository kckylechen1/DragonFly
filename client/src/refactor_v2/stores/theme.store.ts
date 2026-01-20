import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, ThemeMetadata } from "@/refactor_v2/types/theme";
import {
  THEME_REGISTRY,
  getThemeMetadata,
  DEFAULT_THEME_ID,
  getTheme,
} from "@/refactor_v2/themes/registry";

interface ThemeStoreState {
  themeId: string;
  currentTheme: Theme;
  availableThemes: ThemeMetadata[];
  setTheme: (themeId: string) => void;
  updateCSSVariable: (key: string, value: string) => void;
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      themeId: DEFAULT_THEME_ID,
      currentTheme: getTheme(DEFAULT_THEME_ID)!,
      availableThemes: getThemeMetadata(),

      setTheme: (themeId: string) => {
        const theme = getTheme(themeId);
        if (theme) {
          set({ themeId, currentTheme: theme });
          applyThemeToDom(theme);
        }
      },

      updateCSSVariable: (key: string, value: string) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      },
    }),
    {
      name: "dragonfly-theme",
      partialize: state => ({ themeId: state.themeId }),
      onRehydrateStorage: () => state => {
        if (state) {
          const theme = getTheme(state.themeId);
          if (theme) {
            state.currentTheme = theme;
            applyThemeToDom(theme);
          }
        }
      },
    }
  )
);

function applyThemeToDom(theme: Theme) {
  const root = document.documentElement;

  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-secondary", theme.colors.secondary);
  root.style.setProperty("--accent-primary", theme.colors.primary);
  root.style.setProperty("--bg-primary", theme.colors.background);
  root.style.setProperty("--bg-secondary", theme.colors.surface);
  root.style.setProperty("--bg-tertiary", theme.colors.surface); // Use surface as tertiary
  root.style.setProperty("--text-primary", theme.colors.text.primary);
  root.style.setProperty("--text-secondary", theme.colors.text.secondary);
  root.style.setProperty("--text-muted", theme.colors.text.muted);
  root.style.setProperty("--panel-border", theme.colors.border);
  root.style.setProperty("--panel-hover", `${theme.colors.surface}cc`); // Add hover state
  root.style.setProperty("--color-up", theme.colors.up);
  root.style.setProperty("--color-down", theme.colors.down);

  root.style.setProperty("--radius-sm", theme.radius.sm);
  root.style.setProperty("--radius-md", theme.radius.md);
  root.style.setProperty("--radius-lg", theme.radius.lg);

  root.style.setProperty("--shadow-sm", theme.shadows.sm);
  root.style.setProperty("--shadow-md", theme.shadows.md);
  root.style.setProperty("--shadow-lg", theme.shadows.lg);

  root.setAttribute("data-theme", theme.id);
}
