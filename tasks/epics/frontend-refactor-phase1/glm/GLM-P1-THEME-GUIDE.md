# P1 主题系统完整实现 - GLM 任务指南

> **执行者**: GLM (智谱 GLM-4)  
> **审查者**: Antigravity  
> **设计文档**: `docs/P1-complete-theme-system.md`

---

## ⚠️ 重要规则

1. **目标目录**: `client/src/refactor_v2/` (不要修改原有组件)
2. **每完成一个任务**运行 `pnpm check`
3. **遇到问题**记录在 `REFACTOR-STATUS.md`
4. **A股颜色规则**: 红涨绿跌 (已在基础 tokens.css 配置)

---

## 📁 目标目录结构

```
client/src/refactor_v2/
├── types/
│   └── theme.ts              # [新建] Theme 类型定义
├── themes/
│   ├── index.ts              # [新建] 主题导出
│   ├── registry.ts           # [新建] 主题注册表
│   ├── pixel.theme.ts        # [新建] 像素风
│   ├── modern.theme.ts       # [新建] 现代风
│   ├── dark.theme.ts         # [新建] 暗黑风
│   └── cyberpunk.theme.ts    # [新建] 赛博朋克
├── stores/
│   └── theme.store.ts        # [新建] 主题 Zustand Store
├── contexts/
│   └── ThemeProvider.tsx     # [新建] 主题 Provider
├── hooks/
│   └── useTheme.ts           # [新建] 主题 Hook
└── components/
    └── ThemeSwitcher.tsx     # [已有] 更新使用新系统
```

---

## 📝 任务列表

### G-001: Theme 类型定义
**文件**: `client/src/refactor_v2/types/theme.ts`
**预估**: 15 min

从设计文档复制 Theme 接口定义，包含：
- `Theme` 完整接口（colors, typography, spacing, radius, shadows, animations, extras）
- `ThemeMetadata` 元数据接口
- `ThemeContextValue` 上下文接口

**参考**: 设计文档 1.2 节 (第 52-205 行)

---

### G-002: 像素风主题定义
**文件**: `client/src/refactor_v2/themes/pixel.theme.ts`
**预估**: 10 min

创建 `pixelTheme` 对象，严格遵循 `Theme` 接口：
- 紫色主色 (#6d2d95)
- 霓虹青次色 (#00d4ff)
- 深空黑背景 (#0a0e27)
- 像素风阴影效果
- **注意**: up/down 颜色需用 A股规则 (红涨绿跌)

**参考**: 设计文档 2.1 节 (第 213-331 行)

---

### G-003: 现代风主题定义
**文件**: `client/src/refactor_v2/themes/modern.theme.ts`
**预估**: 10 min

创建 `modernTheme` 对象：
- 蓝色主色 (#3b82f6)
- 白色背景
- 现代阴影效果
- **注意**: up/down 颜色需用 A股规则

**参考**: 设计文档 2.2 节 (第 335-447 行)

---

### G-004: 暗黑风主题定义
**文件**: `client/src/refactor_v2/themes/dark.theme.ts`
**预估**: 10 min

创建 `darkTheme` 对象：
- 紫色主色 (#8b5cf6)
- 深蓝黑背景 (#0f172a)
- 适合长时间使用
- **注意**: up/down 颜色需用 A股规则

**参考**: 设计文档 2.3 节 (第 451-563 行)

---

### G-005: 赛博朋克主题定义
**文件**: `client/src/refactor_v2/themes/cyberpunk.theme.ts`
**预估**: 10 min

创建 `cyberpunkTheme` 对象：
- 霓虹粉主色 (#ff006e)
- 霓虹青次色 (#00f5ff)
- 极黑背景 (#0d0221)
- 辉光阴影效果
- Orbitron 字体

**参考**: 设计文档 2.4 节 (第 567-684 行)

---

### G-006: 主题注册表
**文件**: `client/src/refactor_v2/themes/registry.ts`
**预估**: 15 min

创建主题注册表：

```typescript
import { Theme, ThemeMetadata } from '@/refactor_v2/types/theme';
import { pixelTheme } from './pixel.theme';
import { modernTheme } from './modern.theme';
import { darkTheme } from './dark.theme';
import { cyberpunkTheme } from './cyberpunk.theme';

export const THEME_REGISTRY = new Map<string, Theme>([
  ['pixel', pixelTheme],
  ['modern', modernTheme],
  ['dark', darkTheme],
  ['cyberpunk', cyberpunkTheme],
]);

export const getTheme = (id: string): Theme | undefined => THEME_REGISTRY.get(id);

export const getThemeMetadata = (): ThemeMetadata[] => {
  return Array.from(THEME_REGISTRY.values()).map((t) => ({
    id: t.id,
    name: t.name,
    label: t.label,
    category: t.category,
  }));
};

export const DEFAULT_THEME_ID = 'dark';
```

---

### G-007: 主题导出文件
**文件**: `client/src/refactor_v2/themes/index.ts`
**预估**: 5 min

```typescript
export * from './pixel.theme';
export * from './modern.theme';
export * from './dark.theme';
export * from './cyberpunk.theme';
export * from './registry';
```

---

### G-008: Theme Store (Zustand)
**文件**: `client/src/refactor_v2/stores/theme.store.ts`
**预估**: 25 min

创建主题状态管理：

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, ThemeMetadata } from '@/refactor_v2/types/theme';
import { THEME_REGISTRY, getThemeMetadata, DEFAULT_THEME_ID, getTheme } from '@/refactor_v2/themes/registry';

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
      name: 'dragonfly-theme',
      partialize: (state) => ({ themeId: state.themeId }),
      onRehydrateStorage: () => (state) => {
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
  
  // 应用颜色
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--bg-primary', theme.colors.background);
  root.style.setProperty('--bg-secondary', theme.colors.surface);
  root.style.setProperty('--text-primary', theme.colors.text.primary);
  root.style.setProperty('--text-secondary', theme.colors.text.secondary);
  root.style.setProperty('--text-muted', theme.colors.text.muted);
  root.style.setProperty('--panel-border', theme.colors.border);
  root.style.setProperty('--color-up', theme.colors.up);
  root.style.setProperty('--color-down', theme.colors.down);
  
  // 应用圆角
  root.style.setProperty('--radius-sm', theme.radius.sm);
  root.style.setProperty('--radius-md', theme.radius.md);
  root.style.setProperty('--radius-lg', theme.radius.lg);
  
  // 应用阴影
  root.style.setProperty('--shadow-sm', theme.shadows.sm);
  root.style.setProperty('--shadow-md', theme.shadows.md);
  root.style.setProperty('--shadow-lg', theme.shadows.lg);
  
  // 添加主题 class
  root.setAttribute('data-theme', theme.id);
}
```

---

### G-009: useTheme Hook
**文件**: `client/src/refactor_v2/hooks/useTheme.ts`
**预估**: 10 min

```typescript
import { useMemo } from 'react';
import { useThemeStore } from '@/refactor_v2/stores/theme.store';

export function useTheme() {
  const { themeId, currentTheme, availableThemes, setTheme, updateCSSVariable } = useThemeStore();

  const isPixel = themeId === 'pixel';
  const isModern = themeId === 'modern';
  const isDark = themeId === 'dark' || themeId === 'cyberpunk';
  const isCyberpunk = themeId === 'cyberpunk';

  return useMemo(() => ({
    themeId,
    theme: currentTheme,
    availableThemes,
    setTheme,
    updateCSSVariable,
    isPixel,
    isModern,
    isDark,
    isCyberpunk,
  }), [themeId, currentTheme, availableThemes]);
}
```

---

### G-010: 更新 ThemeSwitcher 组件
**文件**: `client/src/refactor_v2/components/ThemeSwitcher.tsx`
**预估**: 20 min

更新现有 ThemeSwitcher 使用新的主题系统：

```typescript
import React from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '@/refactor_v2/hooks/useTheme';

export const ThemeSwitcher: React.FC = () => {
  const { themeId, availableThemes, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        title="切换主题"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--panel-border)] rounded-lg shadow-lg z-50 overflow-hidden">
          {availableThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setTheme(theme.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-[var(--bg-tertiary)] transition-colors ${
                themeId === theme.id ? 'bg-[var(--bg-tertiary)]' : ''
              }`}
            >
              <span className="text-[var(--text-primary)]">{theme.label}</span>
              {themeId === theme.id && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### G-011: 更新 hooks/index.ts 导出
**文件**: `client/src/refactor_v2/hooks/index.ts`  
**预估**: 5 min

添加 useTheme 导出：
```typescript
export { useHotkeys } from './useHotkeys';
export { useAppHotkeys } from './useAppHotkeys';
export { useTheme } from './useTheme';
```

---

### G-012: 更新 types/index.ts 导出
**文件**: `client/src/refactor_v2/types/index.ts`
**预估**: 5 min

添加 theme 类型导出：
```typescript
export * from './ai';
export * from './chart';
export * from './watchlist';
export * from './theme';
```

---

## ✅ 验证命令

```bash
# 类型检查
pnpm check

# 如果成功，启动开发服务器测试
pnpm dev
```

---

## 📋 问题记录

在 `client/src/refactor_v2/REFACTOR-STATUS.md` 添加：

```markdown
## P1 完整主题系统

### G-001: Theme 类型定义
- [ ] 完成 / [ ] 阻塞
- 问题: (如有)

### G-002: 像素风主题
- [ ] 完成 / [ ] 阻塞
...
```

---

## 📌 执行顺序

1. G-001 (类型定义) - 必须先完成
2. G-002 ~ G-005 (4个主题定义) - 可并行
3. G-006 ~ G-007 (注册表和导出)
4. G-008 (Theme Store)
5. G-009 (useTheme Hook)
6. G-010 ~ G-012 (组件和导出更新)

**总预估**: 2.5 小时
