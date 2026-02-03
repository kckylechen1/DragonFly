import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useUIStore } from "../stores/ui.store";

export type Theme =
  | "dark"
  | "light"
  | "perplexity-dark"
  | "zed-dark"
  | "cursor";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: readonly Theme[];
}

const THEMES: readonly Theme[] = [
  "dark",
  "light",
  "perplexity-dark",
  "zed-dark",
  "cursor",
] as const;

const THEME_STORAGE_KEY = "dragonfly-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && THEMES.includes(stored as Theme)) {
    return stored as Theme;
  }

  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }

  return "dark";
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

// 字体缩放 hook
function useFontScale() {
  const fontScale = useUIStore(s => s.fontScale);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-scale", fontScale);
  }, [fontScale]);
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return defaultTheme || getInitialTheme();
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  };

  useEffect(() => {
    const root = document.documentElement;

    root.removeAttribute("data-theme");

    if (theme !== "dark") {
      root.setAttribute("data-theme", theme);
    }

    root.style.colorScheme = theme === "light" ? "light" : "dark";
  }, [theme]);

  // 应用字体缩放
  useFontScale();

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
