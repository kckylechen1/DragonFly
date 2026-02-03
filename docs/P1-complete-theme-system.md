# DragonFly 主题系统完整设计

> **目标**：建立灵活的多主题系统，支持主题切换、扩展、持久化  
> **当前状态**：已有多个主题设计，但缺少统一的管理架构  
> **更新时间**：2026-01-20

---

## 📐 第一部分：主题架构设计

### 1.1 主题系统整体架构

```
┌─────────────────────────────────────────────┐
│         ThemeProvider (React Context)        │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │  Theme Store (Zustand)               │  │
│  │  - 当前主题 ID                        │  │
│  │  - 主题列表元数据                     │  │
│  │  - toggleTheme() 切换方法            │  │
│  └──────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │  Theme Registry                      │  │
│  │  ├─ pixel (像素风)                   │  │
│  │  ├─ modern (现代风)                  │  │
│  │  ├─ dark (暗黑风)                    │  │
│  │  ├─ cyberpunk (赛博朋克)             │  │
│  │  └─ ...更多主题                      │  │
│  └──────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │  CSS Variables (动态注入)             │  │
│  │  - colors (色彩体系)                 │  │
│  │  - typography (排版)                 │  │
│  │  - spacing (间距)                    │  │
│  │  - animations (动画)                 │  │
│  │  - shadows (阴影)                    │  │
│  └──────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │  LocalStorage / IndexedDB (持久化)   │  │
│  │  - 用户偏好主题                      │  │
│  │  - 自定义主题配置                    │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 1.2 主题数据结构定义

```typescript
// src/types/theme.ts

/**
 * 单个主题的完整定义
 */
export interface Theme {
  id: string;                    // 主题唯一标识
  name: string;                  // 显示名称
  label: string;                 // 中文标签
  description?: string;          // 主题描述
  category: 'pixel' | 'modern' | 'dark' | 'custom';
  
  // 色彩体系
  colors: {
    // 原始色彩
    primary: string;             // 主色
    secondary: string;           // 次主色
    success: string;             // 成功色
    danger: string;              // 危险色
    warning: string;             // 警告色
    info: string;                // 信息色
    
    // 背景与文本
    background: string;          // 背景色
    surface: string;             // 表面色
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    
    // 边框与分割线
    border: string;
    divider: string;
    
    // 股票行情特定色
    up: string;                  // 上涨色
    down: string;                // 下跌色
    neutral: string;             // 中性色
    
    // 透明度变体
    rgb: {
      primary: string;           // R,G,B 格式用于 rgba
      secondary: string;
      up: string;
      down: string;
    };
  };
  
  // 排版系统
  typography: {
    fontFamily: {
      base: string;
      mono: string;
      display: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  
  // 间距系统
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  
  // 圆角系统
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  
  // 阴影系统
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // 动画系统
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  
  // 特定于该主题的附加配置
  extras?: {
    [key: string]: any;
  };
}

/**
 * 主题元数据（用于主题选择器）
 */
export interface ThemeMetadata {
  id: string;
  name: string;
  label: string;
  category: Theme['category'];
  icon?: string;
  preview?: string;        // 预览图 URL
  author?: string;
}

/**
 * 主题上下文值
 */
export interface ThemeContextValue {
  currentTheme: Theme;
  themeId: string;
  availableThemes: ThemeMetadata[];
  setTheme: (themeId: string) => void;
  updateThemeVariable: (key: string, value: string) => void;
}
```

---

## 🎨 第二部分：主题定义

### 2.1 像素风主题 (Pixel Theme)

```typescript
// src/themes/pixel.theme.ts

import { Theme } from '@/types/theme';

export const pixelTheme: Theme = {
  id: 'pixel',
  name: 'Pixel',
  label: '像素风',
  category: 'pixel',
  description: '复古像素艺术风格，8-16位美学结合现代设计',

  colors: {
    primary: '#6d2d95',           // 紫色主色
    secondary: '#00d4ff',         // 霓虹青
    success: '#00ff00',           // 像素绿
    danger: '#ff0055',            // 像素红
    warning: '#ffff00',           // 像素黄
    info: '#00d4ff',              // 信息青

    background: '#0a0e27',        // 深空黑
    surface: '#1a1f3a',           // 暗灰 1
    text: {
      primary: '#ffffff',
      secondary: '#8896b8',
      muted: '#5a6580',
    },

    border: '#3a4560',            // 暗灰 3
    divider: '#3a4560',

    up: '#00ff00',
    down: '#ff0055',
    neutral: '#ffff00',

    rgb: {
      primary: '109, 45, 149',
      secondary: '0, 212, 255',
      up: '0, 255, 0',
      down: '255, 0, 85',
    },
  },

  typography: {
    fontFamily: {
      base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'Courier New', 'IBM Plex Mono', monospace",
      display: "'Press Start 2P', monospace",
    },
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },

  radius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '6px',
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '1px 1px 0px rgba(0, 0, 0, 0.2)',
    md: '2px 2px 0px rgba(0, 212, 255, 0.3)',
    lg: '4px 4px 0px rgba(109, 45, 149, 0.2)',
    xl: '6px 6px 0px rgba(0, 0, 0, 0.3)',
  },

  animations: {
    duration: {
      fast: '0.1s',
      normal: '0.3s',
      slow: '0.5s',
    },
    easing: {
      linear: 'linear',
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  extras: {
    pixelBorder: '2px solid',
    pixelShadow: '2px 2px 0px',
    scanlineOpacity: '0.15',
  },
};
```

### 2.2 现代风主题 (Modern Theme)

```typescript
// src/themes/modern.theme.ts

import { Theme } from '@/types/theme';

export const modernTheme: Theme = {
  id: 'modern',
  name: 'Modern',
  label: '现代风',
  category: 'modern',
  description: '简洁现代设计，强调功能性和易用性',

  colors: {
    primary: '#3b82f6',           // 蓝色
    secondary: '#06b6d4',         // 青色
    success: '#10b981',           // 绿色
    danger: '#ef4444',            // 红色
    warning: '#f59e0b',           // 琥珀色
    info: '#06b6d4',

    background: '#ffffff',
    surface: '#f9fafb',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      muted: '#9ca3af',
    },

    border: '#e5e7eb',
    divider: '#e5e7eb',

    up: '#10b981',
    down: '#ef4444',
    neutral: '#f59e0b',

    rgb: {
      primary: '59, 130, 246',
      secondary: '6, 182, 212',
      up: '16, 185, 129',
      down: '239, 68, 68',
    },
  },

  typography: {
    fontFamily: {
      base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
      display: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },

  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  animations: {
    duration: {
      fast: '0.15s',
      normal: '0.25s',
      slow: '0.35s',
    },
    easing: {
      linear: 'linear',
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};
```

### 2.3 暗黑风主题 (Dark Theme)

```typescript
// src/themes/dark.theme.ts

import { Theme } from '@/types/theme';

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  label: '暗黑风',
  category: 'dark',
  description: '深色系设计，适合长时间使用',

  colors: {
    primary: '#8b5cf6',           // 紫色
    secondary: '#64748b',         // 石板灰
    success: '#34d399',           // 翡翠绿
    danger: '#f87171',            // 浅红
    warning: '#fbbf24',           // 浅琥珀
    info: '#38bdf8',

    background: '#0f172a',        // 深蓝黑
    surface: '#1e293b',           // 石板 800
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
    },

    border: '#334155',            // 石板 700
    divider: '#334155',

    up: '#34d399',
    down: '#f87171',
    neutral: '#fbbf24',

    rgb: {
      primary: '139, 92, 246',
      secondary: '100, 116, 139',
      up: '52, 211, 153',
      down: '248, 113, 113',
    },
  },

  typography: {
    fontFamily: {
      base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
      display: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },

  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  },

  animations: {
    duration: {
      fast: '0.15s',
      normal: '0.25s',
      slow: '0.35s',
    },
    easing: {
      linear: 'linear',
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};
```

### 2.4 赛博朋克主题 (Cyberpunk Theme)

```typescript
// src/themes/cyberpunk.theme.ts

import { Theme } from '@/types/theme';

export const cyberpunkTheme: Theme = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  label: '赛博朋克',
  category: 'custom',
  description: '霓虹灯风格，高对比度，极客感十足',

  colors: {
    primary: '#ff006e',           // 霓虹粉
    secondary: '#00f5ff',         // 霓虹青
    success: '#39ff14',           // 霓虹绿
    danger: '#ff006e',            // 霓虹粉
    warning: '#ffbe0b',           // 霓虹黄
    info: '#00f5ff',

    background: '#0d0221',        // 极黑
    surface: '#1f0747',           // 深紫
    text: {
      primary: '#ff006e',         // 用主色作为文本
      secondary: '#00f5ff',
      muted: '#8338ec',
    },

    border: '#ff006e',
    divider: '#00f5ff',

    up: '#39ff14',
    down: '#ff006e',
    neutral: '#ffbe0b',

    rgb: {
      primary: '255, 0, 110',
      secondary: '0, 245, 255',
      up: '57, 255, 20',
      down: '255, 0, 110',
    },
  },

  typography: {
    fontFamily: {
      base: "'Orbitron', 'Courier New', monospace",
      mono: "'Space Mono', monospace",
      display: "'Orbitron', monospace",
    },
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 700,
      bold: 900,
    },
    lineHeight: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },

  radius: {
    none: '0',
    sm: '0',
    md: '2px',
    lg: '4px',
    full: '0',
  },

  shadows: {
    none: 'none',
    sm: '0 0 10px rgba(255, 0, 110, 0.3)',
    md: '0 0 20px rgba(0, 245, 255, 0.3)',
    lg: '0 0 40px rgba(255, 0, 110, 0.5)',
    xl: '0 0 60px rgba(0, 245, 255, 0.6)',
  },

  animations: {
    duration: {
      fast: '0.08s',
      normal: '0.2s',
      slow: '0.4s',
    },
    easing: {
      linear: 'linear',
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
      easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
    },
  },

  extras: {
    glowEffect: 'text-shadow: 0 0 10px',
    borderStyle: 'dashed',
  },
};
```

---

## 🔧 第三部分：主题管理系统

### 3.1 主题 Store (Zustand)

```typescript
// src/store/theme.store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, ThemeMetadata } from '@/types/theme';
import { pixelTheme, modernTheme, darkTheme, cyberpunkTheme } from '@/themes';

interface ThemeStoreState {
  // 状态
  currentTheme: Theme;
  themeId: string;
  availableThemes: ThemeMetadata[];
  customThemes: Map<string, Theme>;

  // 方法
  setTheme: (themeId: string) => void;
  registerTheme: (theme: Theme) => void;
  unregisterTheme: (themeId: string) => void;
  updateThemeVariable: (key: string, value: string) => void;
  exportTheme: (themeId: string) => string;
  importTheme: (themeJson: string) => void;
}

const THEME_REGISTRY = new Map<string, Theme>([
  ['pixel', pixelTheme],
  ['modern', modernTheme],
  ['dark', darkTheme],
  ['cyberpunk', cyberpunkTheme],
]);

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      currentTheme: pixelTheme,
      themeId: 'pixel',
      availableThemes: Array.from(THEME_REGISTRY.values()).map((t) => ({
        id: t.id,
        name: t.name,
        label: t.label,
        category: t.category,
      })),
      customThemes: new Map(),

      setTheme: (themeId: string) => {
        const theme = THEME_REGISTRY.get(themeId) || get().customThemes.get(themeId);
        if (theme) {
          set({ currentTheme: theme, themeId });
          applyThemeToDom(theme);
        }
      },

      registerTheme: (theme: Theme) => {
        THEME_REGISTRY.set(theme.id, theme);
        const state = get();
        set({
          availableThemes: [
            ...state.availableThemes,
            {
              id: theme.id,
              name: theme.name,
              label: theme.label,
              category: theme.category,
            },
          ],
        });
      },

      unregisterTheme: (themeId: string) => {
        if (themeId === get().themeId) {
          get().setTheme('pixel'); // 切回默认主题
        }
        THEME_REGISTRY.delete(themeId);
      },

      updateThemeVariable: (key: string, value: string) => {
        const root = document.documentElement;
        root.style.setProperty(`--${key}`, value);
      },

      exportTheme: (themeId: string) => {
        const theme = THEME_REGISTRY.get(themeId) || get().customThemes.get(themeId);
        if (!theme) throw new Error(`Theme ${themeId} not found`);
        return JSON.stringify(theme, null, 2);
      },

      importTheme: (themeJson: string) => {
        try {
          const theme = JSON.parse(themeJson) as Theme;
          get().registerTheme(theme);
        } catch (error) {
          console.error('Failed to import theme:', error);
        }
      },
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({
        themeId: state.themeId,
      }),
    }
  )
);

/**
 * 将主题应用到 DOM
 */
function applyThemeToDom(theme: Theme) {
  const root = document.documentElement;

  // 应用颜色变量
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        root.style.setProperty(`--color-${key}-${subKey}`, String(subValue));
      });
    } else {
      root.style.setProperty(`--color-${key}`, value);
    }
  });

  // 应用排版变量
  Object.entries(theme.typography.fontFamily).forEach(([key, value]) => {
    root.style.setProperty(`--font-${key}`, value);
  });

  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });

  // 应用间距、圆角、阴影等
  Object.entries(theme.spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });

  Object.entries(theme.radius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value);
  });

  Object.entries(theme.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });

  // 应用动画
  Object.entries(theme.animations.duration).forEach(([key, value]) => {
    root.style.setProperty(`--duration-${key}`, value);
  });

  // 额外配置
  if (theme.extras) {
    Object.entries(theme.extras).forEach(([key, value]) => {
      root.style.setProperty(`--extra-${key}`, String(value));
    });
  }

  // 触发自定义事件
  window.dispatchEvent(
    new CustomEvent('themechange', { detail: { theme } })
  );
}
```

### 3.2 主题 Provider

```typescript
// src/components/ThemeProvider.tsx

import React, { createContext, useContext, useEffect } from 'react';
import { useThemeStore } from '@/store/theme.store';
import { ThemeContextValue } from '@/types/theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    currentTheme,
    themeId,
    availableThemes,
    setTheme,
    updateThemeVariable,
  } = useThemeStore();

  useEffect(() => {
    // 应用初始主题
    setTheme(themeId);

    // 监听系统深色模式变化（可选）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (themeId === 'auto') {
        setTheme(e.matches ? 'dark' : 'modern');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value: ThemeContextValue = {
    currentTheme,
    themeId,
    availableThemes,
    setTheme,
    updateThemeVariable,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

## 🎮 第四部分：主题切换组件

### 4.1 主题选择器

```typescript
// src/components/ThemeSelector.tsx

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import './ThemeSelector.css';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, availableThemes, setTheme } = useTheme();

  return (
    <div className="theme-selector">
      <div className="theme-selector-label">主题</div>
      <div className="theme-selector-grid">
        {availableThemes.map((themeMetadata) => (
          <button
            key={themeMetadata.id}
            className={`theme-option ${
              currentTheme.id === themeMetadata.id ? 'active' : ''
            }`}
            onClick={() => setTheme(themeMetadata.id)}
            title={themeMetadata.label}
          >
            <span className="theme-name">{themeMetadata.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

```css
/* src/components/ThemeSelector.css */

.theme-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
}

.theme-selector-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.theme-selector-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.theme-option {
  padding: var(--spacing-md);
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-standard);
  font-size: var(--font-size-sm);
}

.theme-option:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.3);
}

.theme-option.active {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  font-weight: 600;
}
```

---

## 📂 第五部分：文件结构

```
src/
├── themes/                     # 主题定义
│   ├── index.ts               # 导出所有主题
│   ├── pixel.theme.ts         # 像素风主题
│   ├── modern.theme.ts        # 现代风主题
│   ├── dark.theme.ts          # 暗黑风主题
│   ├── cyberpunk.theme.ts     # 赛博朋克主题
│   └── custom.theme.ts        # 自定义主题模板
│
├── types/
│   └── theme.ts               # 主题类型定义
│
├── store/
│   └── theme.store.ts         # 主题状态管理
│
├── components/
│   ├── ThemeProvider.tsx      # 主题提供者
│   ├── ThemeSelector.tsx      # 主题选择器组件
│   └── ThemeSelector.css
│
├── styles/
│   ├── globals.css            # 全局样式
│   ├── theme-base.css         # 主题基础变量
│   └── animations.css         # 动画定义
│
└── App.tsx                    # 使用 ThemeProvider 包裹
```

---

## 💾 第六部分：使用示例

### 6.1 应用启动

```typescript
// src/App.tsx

import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeSelector } from '@/components/ThemeSelector';
import { LayoutShell } from '@/components/LayoutShell';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="app">
        {/* 右上角主题选择器 */}
        <div className="app-header">
          <ThemeSelector />
        </div>

        {/* 主应用内容 */}
        <LayoutShell
          left={/* ... */}
          centerTop={/* ... */}
          centerBottom={/* ... */}
          right={/* ... */}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;
```

### 6.2 自定义主题

```typescript
// 创建新主题
import { Theme } from '@/types/theme';
import { useThemeStore } from '@/store/theme.store';

const myCustomTheme: Theme = {
  id: 'my-custom',
  name: 'My Custom Theme',
  label: '我的自定义主题',
  category: 'custom',
  // ... 配置省略
};

// 在组件中注册
const { registerTheme } = useThemeStore();
registerTheme(myCustomTheme);
```

### 6.3 在组件中使用主题

```typescript
import { useTheme } from '@/components/ThemeProvider';

export const MyComponent: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        backgroundColor: currentTheme.colors.background,
        color: currentTheme.colors.text.primary,
      }}
    >
      {/* 使用主题配置 */}
    </div>
  );
};
```

---

## 🔄 第七部分：主题切换流程

```
用户选择主题
    ↓
ThemeSelector 调用 setTheme(themeId)
    ↓
useThemeStore.setTheme() 更新状态
    ↓
applyThemeToDom() 注入 CSS 变量
    ↓
window.dispatchEvent('themechange')
    ↓
所有监听 'themechange' 的组件重新渲染
    ↓
localStorage 自动保存主题 ID（persist）
    ↓
下次打开应用自动加载上次选择的主题
```

---

## ✅ P1-24 主题系统完整建立清单

```
主题定义：
├─ [ ] pixel.theme.ts 完成
├─ [ ] modern.theme.ts 完成
├─ [ ] dark.theme.ts 完成
├─ [ ] cyberpunk.theme.ts 完成
└─ [ ] 额外主题（2-3个）

主题管理：
├─ [ ] theme.store.ts 实现
├─ [ ] ThemeProvider 实现
├─ [ ] useTheme Hook 可用
├─ [ ] 主题持久化工作
└─ [ ] 主题导入导出功能

UI 组件：
├─ [ ] ThemeSelector 组件完成
├─ [ ] CSS 变量系统应用
├─ [ ] 所有组件支持主题切换
└─ [ ] 暗光模式自动适配

测试：
├─ [ ] 主题切换无闪烁
├─ [ ] 所有页面主题正确应用
├─ [ ] localStorage 保存主题偏好
├─ [ ] 新建自定义主题可用
└─ [ ] 主题导出的 JSON 可再导入
```

---

## 📈 进阶功能（后续可选）

```
1. 主题编辑器
   - 可视化调整颜色
   - 实时预览
   - 导出自定义主题

2. 主题市场
   - 用户分享主题
   - 下载第三方主题
   - 主题评分系统

3. 动态主题
   - 根据时间自动切换（日间/夜间）
   - 根据环境亮度自动适配
   - 融合多个主题元素

4. 主题动画
   - 平滑过渡效果
   - 颜色渐变切换
   - 过渡持续时间配置
```

---

**P1-24 主题系统完成！** 🎉

现在你有了：
- ✅ 4 个完整的主题定义
- ✅ 灵活的主题管理系统
- ✅ 支持自定义主题
- ✅ 主题持久化存储
- ✅ 主题选择 UI
- ✅ 可扩展的架构

接下来可以继续做：
1. **K 线图集成** (P1-01~05)
2. **实时数据架构** (P1-06~10)
3. **性能优化** (P1-24 补充)

