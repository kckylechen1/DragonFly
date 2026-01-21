# T-005: Design Tokens CSS 文件创建

## 负责 Agent: 🟢 Codex

## 目标
- [ ] 创建 `styles/tokens.css` - 基础 Token 层
- [ ] 定义 Primitive Tokens（纯色值）
- [ ] 定义 Semantic Tokens（语义级别）
- [ ] 定义 Component Tokens（组件级别）

---

## 步骤

### Step 1: 创建目录结构

```bash
cd client/src/refactor_v2
mkdir -p styles/themes
```

### Step 2: 创建 tokens.css

按照 DRAGONFLY-REFACTOR.md 的三层 Token 设计：

```css
/* client/src/refactor_v2/styles/tokens.css */

/* ==========================================================================
   DragonFly Design Tokens
   Three-tier token system: Primitive → Semantic → Component
   ========================================================================== */

/* --------------------------------------------------------------------------
   Layer 1: Primitive Tokens (Pure color values)
   -------------------------------------------------------------------------- */
:root {
  /* Grayscale */
  --primitive-black: #000000;
  --primitive-white: #ffffff;
  --primitive-gray-50: #f9fafb;
  --primitive-gray-100: #f3f4f6;
  --primitive-gray-200: #e5e7eb;
  --primitive-gray-300: #d1d5db;
  --primitive-gray-400: #9ca3af;
  --primitive-gray-500: #6b7280;
  --primitive-gray-600: #4b5563;
  --primitive-gray-700: #374151;
  --primitive-gray-800: #1f2937;
  --primitive-gray-900: #111827;
  --primitive-gray-950: #030712;

  /* Brand Colors */
  --primitive-blue-400: #60a5fa;
  --primitive-blue-500: #3b82f6;
  --primitive-blue-600: #2563eb;

  /* Status Colors */
  --primitive-red-400: #f87171;
  --primitive-red-500: #ef4444;
  --primitive-red-600: #dc2626;

  --primitive-green-400: #4ade80;
  --primitive-green-500: #10b981;
  --primitive-green-600: #059669;

  --primitive-orange-400: #fb923c;
  --primitive-orange-500: #f97316;

  --primitive-yellow-400: #facc15;
  --primitive-yellow-500: #eab308;
}

/* --------------------------------------------------------------------------
   Layer 2: Semantic Tokens (Context-aware meanings)
   Default theme (Dark mode as base)
   -------------------------------------------------------------------------- */
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-tertiary: #1f1f1f;
  --bg-elevated: #1a1a1a;

  /* Text */
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --text-inverted: #0a0a0a;

  /* Panels */
  --panel-bg: #0a0a0a;
  --panel-border: #27272a;
  --panel-hover: #1f1f1f;

  /* Accent / Brand */
  --accent-primary: #3b82f6;
  --accent-primary-hover: #2563eb;
  --accent-primary-muted: rgba(59, 130, 246, 0.2);

  /* Stock Colors (Up/Down) */
  --color-up: #10b981;
  --color-up-bg: rgba(16, 185, 129, 0.1);
  --color-down: #ef4444;
  --color-down-bg: rgba(239, 68, 68, 0.1);
  --color-neutral: #9ca3af;

  /* Interactive States */
  --focus-ring: rgba(59, 130, 246, 0.5);
  --hover-overlay: rgba(255, 255, 255, 0.05);
  --active-overlay: rgba(255, 255, 255, 0.1);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);

  /* Dividers */
  --divider: #27272a;
  --divider-subtle: #1f1f1f;
}

/* --------------------------------------------------------------------------
   Layer 3: Component Tokens
   -------------------------------------------------------------------------- */
:root {
  /* Buttons */
  --btn-primary-bg: var(--accent-primary);
  --btn-primary-text: var(--primitive-white);
  --btn-primary-hover: var(--accent-primary-hover);

  --btn-secondary-bg: var(--bg-secondary);
  --btn-secondary-text: var(--text-primary);
  --btn-secondary-hover: var(--bg-tertiary);
  --btn-secondary-border: var(--panel-border);

  --btn-ghost-text: var(--text-secondary);
  --btn-ghost-hover-bg: var(--hover-overlay);

  /* Input */
  --input-bg: var(--bg-tertiary);
  --input-border: var(--panel-border);
  --input-text: var(--text-primary);
  --input-placeholder: var(--text-muted);
  --input-focus-border: var(--accent-primary);

  /* Tabs */
  --tab-text: var(--text-secondary);
  --tab-text-active: var(--text-primary);
  --tab-indicator: var(--accent-primary);
  --tab-hover-bg: var(--hover-overlay);

  /* Cards */
  --card-bg: var(--bg-secondary);
  --card-border: var(--panel-border);
  --card-hover-border: var(--accent-primary);

  /* Badges */
  --badge-default-bg: var(--bg-secondary);
  --badge-default-text: var(--text-secondary);
  --badge-success-bg: var(--color-up-bg);
  --badge-success-text: var(--color-up);
  --badge-danger-bg: var(--color-down-bg);
  --badge-danger-text: var(--color-down);

  /* Tooltip */
  --tooltip-bg: var(--bg-elevated);
  --tooltip-text: var(--text-primary);
  --tooltip-border: var(--panel-border);

  /* Scrollbar */
  --scrollbar-track: var(--bg-primary);
  --scrollbar-thumb: var(--bg-tertiary);
  --scrollbar-thumb-hover: var(--text-muted);

  /* Chart specific */
  --chart-grid: #1f2937;
  --chart-crosshair: #6b7280;
  --chart-line-up: var(--color-up);
  --chart-line-down: var(--color-down);
  --chart-volume-up: rgba(16, 185, 129, 0.5);
  --chart-volume-down: rgba(239, 68, 68, 0.5);
}

/* --------------------------------------------------------------------------
   Custom Scrollbar Styling
   -------------------------------------------------------------------------- */
:root {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

*::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
```

### Step 3: 在入口文件中导入

确保在 `main.tsx` 或 `App.tsx` 中导入 tokens：

```typescript
// 在 client/src/main.tsx 或适当的入口文件顶部
import "@/refactor_v2/styles/tokens.css";
```

### Step 4: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `styles/tokens.css` 已创建
- [ ] 包含三层 Token 结构
- [ ] Token 命名遵循语义化原则
- [ ] 已在入口文件导入
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/styles/tokens.css`
