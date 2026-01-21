# T-007: ThemeProvider 完善与入口接入

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-005 (tokens.css)
- T-006 (theme CSS files)

## 目标
- [ ] 完善 ThemeProvider 组件
- [ ] 创建 ThemeSwitcher UI 组件
- [ ] 主题持久化到 localStorage
- [ ] 接入应用入口

---

## 步骤

### Step 1: 检查现有 ThemeContext

首先检查 `client/src/contexts/ThemeContext.tsx` 是否存在，如果存在则基于它改进，否则创建新的。

### Step 2: 创建/更新 ThemeProvider

```typescript
// client/src/refactor_v2/contexts/ThemeContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Theme =
  | "dark" // default dark (tokens.css defaults)
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

  // Check system preference
  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }

  return "dark";
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return defaultTheme || getInitialTheme();
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme attributes first
    root.removeAttribute("data-theme");

    // Apply theme
    if (theme !== "dark") {
      // "dark" uses default tokens.css, no data-theme needed
      root.setAttribute("data-theme", theme);
    }

    // Also set color-scheme for browser native elements
    root.style.colorScheme = theme === "light" ? "light" : "dark";
  }, [theme]);

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
```

### Step 3: 创建 ThemeSwitcher 组件

```typescript
// client/src/refactor_v2/components/ThemeSwitcher.tsx

import React, { useState, useRef, useEffect } from "react";
import { Palette, Check, ChevronDown } from "lucide-react";
import { useTheme, Theme } from "@/refactor_v2/contexts/ThemeContext";

const THEME_LABELS: Record<Theme, string> = {
  dark: "默认深色",
  light: "亮色",
  "perplexity-dark": "Perplexity Dark",
  "zed-dark": "Zed Dark",
  cursor: "Cursor",
};

const THEME_COLORS: Record<Theme, string> = {
  dark: "#0a0a0a",
  light: "#ffffff",
  "perplexity-dark": "#020617",
  "zed-dark": "#1e1e1e",
  cursor: "#0d0d0d",
};

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--panel-hover)] border border-[var(--panel-border)] text-[var(--text-secondary)] transition-colors"
        aria-label="切换主题"
        aria-expanded={isOpen}
      >
        <Palette className="w-4 h-4" />
        <span className="text-xs hidden sm:inline">{THEME_LABELS[theme]}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-[var(--bg-secondary)] border border-[var(--panel-border)] rounded-lg shadow-lg z-50">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTheme(t);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-[var(--panel-hover)] transition-colors ${
                theme === t
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-[var(--panel-border)]"
                style={{ backgroundColor: THEME_COLORS[t] }}
              />
              <span className="flex-1">{THEME_LABELS[t]}</span>
              {theme === t && (
                <Check className="w-4 h-4 text-[var(--accent-primary)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple toggle version for compact spaces
export const ThemeToggleCompact: React.FC = () => {
  const { theme, setTheme, themes } = useTheme();

  const nextTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <button
      onClick={nextTheme}
      className="p-2 rounded-lg hover:bg-[var(--panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      aria-label="切换主题"
      title={`当前: ${THEME_LABELS[theme]}`}
    >
      <Palette className="w-4 h-4" />
    </button>
  );
};
```

### Step 4: 更新 LeftPane 使用新的 ThemeSwitcher

```typescript
// client/src/refactor_v2/components/LeftPane.tsx

// 更新导入
import { ThemeSwitcher } from "./ThemeSwitcher";

// 在 Header 部分使用 ThemeSwitcher
<div className="flex items-center justify-between">
  <h2 className="text-lg font-bold text-[var(--text-primary)]">DragonFly</h2>
  <ThemeSwitcher />
</div>
```

### Step 5: 在入口接入 ThemeProvider

```typescript
// client/src/main.tsx 或 App.tsx

import { ThemeProvider } from "@/refactor_v2/contexts/ThemeContext";
import "@/refactor_v2/styles/tokens.css";
import "@/refactor_v2/styles/themes/index.css";

// 包裹应用
function App() {
  return (
    <ThemeProvider>
      {/* ... rest of the app ... */}
    </ThemeProvider>
  );
}
```

### Step 6: 验证

```bash
pnpm check
```

手动验证：
1. 点击主题切换器
2. 切换不同主题
3. 刷新页面，确认主题持久化

---

## 验收标准

- [ ] ThemeProvider 支持 5 个主题
- [ ] ThemeSwitcher 下拉菜单正常工作
- [ ] 主题切换即时生效
- [ ] 刷新后主题保持
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/contexts/ThemeContext.tsx`
- `client/src/refactor_v2/components/ThemeSwitcher.tsx`
- `client/src/refactor_v2/components/LeftPane.tsx` (更新)
