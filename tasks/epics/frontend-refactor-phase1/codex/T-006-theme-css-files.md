# T-006: 主题 CSS 文件创建

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-005 (tokens.css 已创建)

## 目标
- [ ] 创建 `themes/perplexity-dark.css`
- [ ] 创建 `themes/zed-dark.css`
- [ ] 创建 `themes/cursor.css`
- [ ] 创建 `themes/light.css` (可选的亮色主题)
- [ ] 创建主题索引文件

---

## 步骤

### Step 1: 创建 perplexity-dark.css

```css
/* client/src/refactor_v2/styles/themes/perplexity-dark.css */

/* Perplexity Dark Theme
   特点：深邃的蓝黑色调，科技感强
*/
[data-theme="perplexity-dark"] {
  /* Backgrounds - 深蓝黑色系 */
  --bg-primary: #020617;
  --bg-secondary: #0b1120;
  --bg-tertiary: #111827;
  --bg-elevated: #0f172a;

  /* Text */
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;

  /* Panels */
  --panel-bg: #020617;
  --panel-border: #1f2937;
  --panel-hover: #111827;

  /* Accent - Perplexity 蓝 */
  --accent-primary: #3b82f6;
  --accent-primary-hover: #2563eb;
  --accent-primary-muted: rgba(59, 130, 246, 0.15);

  /* Stock Colors */
  --color-up: #10b981;
  --color-down: #ef4444;

  /* Chart */
  --chart-grid: #1e293b;
  --chart-crosshair: #475569;

  /* Dividers */
  --divider: #1f2937;
  --divider-subtle: #0f172a;
}
```

### Step 2: 创建 zed-dark.css

```css
/* client/src/refactor_v2/styles/themes/zed-dark.css */

/* Zed Dark Theme
   特点：类似 Zed 编辑器的暖灰色调
*/
[data-theme="zed-dark"] {
  /* Backgrounds - 暖灰色系 */
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d2d;
  --bg-elevated: #333333;

  /* Text */
  --text-primary: #d4d4d4;
  --text-secondary: #a0a0a0;
  --text-muted: #6a6a6a;

  /* Panels */
  --panel-bg: #1e1e1e;
  --panel-border: #3c3c3c;
  --panel-hover: #2d2d2d;

  /* Accent - Zed 橙 */
  --accent-primary: #e5a03d;
  --accent-primary-hover: #d49230;
  --accent-primary-muted: rgba(229, 160, 61, 0.2);

  /* Stock Colors */
  --color-up: #4ec9b0;
  --color-down: #f14c4c;

  /* Chart */
  --chart-grid: #3c3c3c;
  --chart-crosshair: #606060;

  /* Dividers */
  --divider: #3c3c3c;
  --divider-subtle: #2d2d2d;
}
```

### Step 3: 创建 cursor.css

```css
/* client/src/refactor_v2/styles/themes/cursor.css */

/* Cursor Theme
   特点：类似 Cursor 编辑器的紫蓝色调
*/
[data-theme="cursor"] {
  /* Backgrounds - 冷色系 */
  --bg-primary: #0d0d0d;
  --bg-secondary: #161616;
  --bg-tertiary: #1a1a1a;
  --bg-elevated: #202020;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a3a3a3;
  --text-muted: #666666;

  /* Panels */
  --panel-bg: #0d0d0d;
  --panel-border: #262626;
  --panel-hover: #1a1a1a;

  /* Accent - Cursor 紫 */
  --accent-primary: #a855f7;
  --accent-primary-hover: #9333ea;
  --accent-primary-muted: rgba(168, 85, 247, 0.2);

  /* Stock Colors */
  --color-up: #22c55e;
  --color-down: #ef4444;

  /* Chart */
  --chart-grid: #262626;
  --chart-crosshair: #525252;

  /* Dividers */
  --divider: #262626;
  --divider-subtle: #1a1a1a;
}
```

### Step 4: 创建 light.css

```css
/* client/src/refactor_v2/styles/themes/light.css */

/* Light Theme
   特点：清爽的亮色主题
*/
[data-theme="light"] {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --bg-elevated: #ffffff;

  /* Text */
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;
  --text-inverted: #ffffff;

  /* Panels */
  --panel-bg: #ffffff;
  --panel-border: #e5e7eb;
  --panel-hover: #f3f4f6;

  /* Accent */
  --accent-primary: #2563eb;
  --accent-primary-hover: #1d4ed8;
  --accent-primary-muted: rgba(37, 99, 235, 0.1);

  /* Stock Colors */
  --color-up: #059669;
  --color-up-bg: rgba(5, 150, 105, 0.1);
  --color-down: #dc2626;
  --color-down-bg: rgba(220, 38, 38, 0.1);

  /* Interactive States */
  --focus-ring: rgba(37, 99, 235, 0.5);
  --hover-overlay: rgba(0, 0, 0, 0.05);
  --active-overlay: rgba(0, 0, 0, 0.1);

  /* Shadows - 亮色主题阴影更淡 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Chart */
  --chart-grid: #e5e7eb;
  --chart-crosshair: #9ca3af;

  /* Dividers */
  --divider: #e5e7eb;
  --divider-subtle: #f3f4f6;

  /* Scrollbar */
  --scrollbar-track: #f9fafb;
  --scrollbar-thumb: #d1d5db;
  --scrollbar-thumb-hover: #9ca3af;
}
```

### Step 5: 创建主题索引文件

```css
/* client/src/refactor_v2/styles/themes/index.css */

/* Import all theme files */
@import "./perplexity-dark.css";
@import "./zed-dark.css";
@import "./cursor.css";
@import "./light.css";
```

### Step 6: 更新入口导入

在入口文件中添加主题导入：

```typescript
// client/src/main.tsx
import "@/refactor_v2/styles/tokens.css";
import "@/refactor_v2/styles/themes/index.css";
```

### Step 7: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] 4 个主题 CSS 文件已创建
- [ ] 主题索引文件已创建
- [ ] 每个主题覆盖了所有语义 token
- [ ] 主题使用 `[data-theme="xxx"]` 选择器
- [ ] 已在入口文件导入

---

## 产出文件

- `client/src/refactor_v2/styles/themes/perplexity-dark.css`
- `client/src/refactor_v2/styles/themes/zed-dark.css`
- `client/src/refactor_v2/styles/themes/cursor.css`
- `client/src/refactor_v2/styles/themes/light.css`
- `client/src/refactor_v2/styles/themes/index.css`
