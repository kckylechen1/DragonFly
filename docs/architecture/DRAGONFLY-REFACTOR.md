# DragonFly 前端重构计划（v2 全量版）

> **项目**: DragonFly Stock Tracker Frontend Refactor  
> **类型**: 私有仓库  
> **起始时间**: 2026-01-19  
> **策略**: 按 AI-COLLAB-PLAYBOOK 的「契约先行 / 小步快跑 / TDD 强制 / 两阶段审查」执行  

---

## 1. 现状分析

### 1.1 当前代码状态

- **技术栈**：React 18 + TypeScript 5.9 + Vite 7 + Tailwind CSS v4 + Radix UI + Zustand  
- **布局形态**：  
  - 左：自选股列表 + 搜索  
  - 中：K 线图 + 底部 Tab  
  - 右：AI 聊天面板（可折叠、⌘+I 快捷键）  
- **主要痛点**：  
  - `Home.tsx` 600+ 行，布局 / 状态 / 业务逻辑混杂，难以维护  
  - 状态散落：拖拽尺寸、折叠状态、Tab 选择、网络请求混在多个组件里  
  - 组件边界模糊：修改某一侧布局经常牵连另外两侧  
  - 无统一设计 Token，主题难以扩展；深色 / 浅色主题切换成本高  
  - 底部 Tab 只有占位标签，没有真正内容区  
  - 性能与可访问性未系统性考虑（无代码拆分、ARIA 标签缺失）  

### 1.2 已有资产

- `react-resizable-panels`：用于左右 / 上下拖拽分隔  
- `next-themes`：基础主题切换框架  
- `MarketSentimentPanel.tsx`：市场情绪面板  
- `StockNewsPanel.tsx`：新闻面板（占位）  
- `AIChatPanel.tsx`：AI 聊天面板（支持 ⌘+I 折叠）  
- `WatchlistSidebar.tsx`：自选股列表  

---

## 2. 重构目标与范围

### 2.1 核心诉求（按优先级）

| 优先级 | 目标 | 说明 |
|--------|------|------|
| **P0** | 把「屎代码」变成「可维护」 | 拆分 `Home.tsx`、统一状态管理、引入 ErrorBoundary |
| **P1** | 引入多套主题系统 | Zed / Cursor / Antigravity / Perplexity Dark 风格 |
| **P2** | 左侧分组自选股 + 底部 Tab 内容完善 | 支持分组、拖拽、新闻 / 基本面 / 情绪 / 技术 4 个 Tab |
| **P3** | 响应式布局 & 移动端抽屉 | 桌面三栏、平板折叠、手机抽屉式导航 |

### 2.2 不在本轮范围

- 后端重构与 API 变更  
- 大型新功能开发（除主题切换、AI 布局优化外）  
- 完整测试框架搭建（单测后续视情况补充）  

---

## 3. 布局与组件架构

### 3.1 四区域布局契约

```
┌──────────────────────────────────────────────────────────────┐
│                        Title Bar（可选）                     │
├──────────┬────────────────────────────────────┬──────────────┤
│          │                                    │              │
│ LeftPane │     CenterPane（分上下两层）        │  RightPane   │
│ 自选股   │                                    │  AI 回答面板  │
│ 列表     │  ┌──────────────────────────────┐  │  默认收起    │
│ 搜索     │  │  CenterTop                   │  │  有内容则展开 │
│          │  │  (K 线 + 资金栏 + 标签云)     │ │              │
│          │  └──────────────────────────────┘ │              │
│          │  ─── 可拖拽分隔 (ResizeHandle) ─── │              │
│          │  ┌──────────────────────────────┐  │              │
│          │  │  CenterBottom                │  │              │
│          │  │  (InfoTabPanel 4 个 Tab)     │  │              │
│          │  └──────────────────────────────┘  │              │
├──────────┴────────────────────────────────────┴──────────────┤
│      底部悬浮 AI 输入条（Overlay，固定在 CenterBottom 上方）   │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 组件职责边界

| 组件 | 职责 | Props | 状态 |
|------|------|-------|------|
| **LayoutShell** | 整体布局 / 响应式断点 / 中心区域右边距随 AI 面板调整 | `left`, `centerTop`, `centerBottom`, `right` | 无（视图容器） |
| **LeftPane** | 自选股列表 + 搜索 + 分组展开 | 无（从 Zustand 读） | Zustand `watchlistStore` |
| **CenterTop** | 单只股票 K 线图 + Perplexity 风格信息头 + 资金栏 + 标签云 | 无（使用全局当前 symbol） | 无业务状态（视图） |
| **CenterBottom** | InfoTabPanel：新闻 / 基本面 / 情绪 / 技术 4 个 Tab | `symbol` | 本地 `useState` 记录 activeTab |
| **RightPane / AIChatPanel** | 从右侧滑入的 AI 回答面板 | 无（从 Zustand 读） | Zustand `aiChatStore` |
| **FloatingAIChatInput** | 底部悬浮 AI 输入框（不挡 K 线） | 无 | 本地输入框状态 + 调用 `aiChatStore` |
| **ThemeProvider / ThemeSwitcher** | 主题上下文，注入 CSS 变量 / 提供切换 UI | `defaultTheme` | Context + next-themes |
| **ErrorBoundary** | 捕获单个区域异常并渲染降级 UI | `fallback` | 内部 error state |

---

## 4. 主题与视觉设计

### 4.1 Token 层级（3 层）

1. **Primitive Tokens**：纯色值（灰度 / 品牌色）  
2. **Semantic Tokens**：语义级别（背景、文本、面板、价格上涨/下跌等）  
3. **Component Tokens**：组件级（按钮、Tab、输入框、Badge 等）  

示例 CSS Variables：

```css
:root {
  /* 灰度 */
  --primitive-black: #000000;
  --primitive-white: #ffffff;
  --primitive-gray-900: #111827;

  /* 品牌色 */
  --primitive-blue-500: #3b82f6;
  --primitive-red-500: #ef4444;
  --primitive-green-500: #10b981;
}

/* Semantic */
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-tertiary: #1f1f1f;

  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;

  --panel-bg: #0a0a0a;
  --panel-border: #27272a;

  --color-up: #10b981;
  --color-down: #ef4444;
}
```

### 4.2 主题预设

在原有 **Zed Dark / Zed Light / Cursor / Antigravity** 的基础上新增 **Perplexity Dark**：

```css
/* themes/perplexity-dark.css */
[data-theme='perplexity-dark'] {
  --bg-primary: #020617;
  --bg-secondary: #0b1120;
  --bg-tertiary: #111827;

  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;

  --panel-bg: #020617;
  --panel-border: #1f2937;

  --accent-primary: #3b82f6;

  --color-up: #10b981;
  --color-down: #ef4444;
}
```

### 4.3 图标系统

- 统一使用 **Lucide Icons**（`lucide-react`），例如：  
  - 热度：`Flame`  
  - 资金：`Banknote` / `PiggyBank`  
  - AI：`Sparkles`  
  - 技术信号：`TrendingUp` / `TrendingDown`  
  - 设置：`SlidersHorizontal`  

---

## 5. CenterTop：K 线区域设计

### 5.1 三层结构

- **层 1：顶部信息栏（可收起）**  
  - 股票代码 / 名称  
  - 当前价格 + 涨跌 + 涨跌幅  
  - 动态标签云（Badge Cloud）  
  - 时间周期按钮：1D / 5D / 1M / 6M / YTD / 1Y / 5Y / MAX  

- **层 2：资金栏（固定）**  
  - 主力净流入 / 超大单 / 大单  
  - 换手率 / 量比 / 振幅  

- **层 3：K 线 + 成交量**  

Perplexity 负责整体结构，同花顺负责资金栏信息密度。

### 5.2 动态标签云（Badge Cloud）

位置：紧跟在价格后面，横向滚动，**最多显示 6 个**。

**类别与规则：**

- 热度 / 关注：  
  - 人气榜：人气 rank < 500 才显示  
  - 雪球 rank：< 200 才显示  
- 资金 / 机构：  
  - 龙虎榜上榜：仅上榜时显示  
  - 北向资金净流：绝对值 ≥ 1 亿才显示  
- AI 分析：  
  - Outperform / Underperform / Risk Alert，仅当 AI 非中性结论时显示  
- 技术信号：  
  - MACD 金叉 / 突破新高 / 跌破支撑，importance > 7 时显示  
- 基本面快讯：  
  - 今日公告数量 > 0 时显示  

**完全数据驱动**：没有数据就不渲染对应 Badge。

---

## 6. 资金栏（固定在图上方）

样式参考同花顺：

- 主力净流入 / 超大单 / 大单：红表示流入，绿表示流出，单位「亿」  
- 换手率 / 量比 / 振幅：中性颜色（灰 / 白）  

PC 端使用 `position: sticky; top: 0;` 固定在 CenterTop 内部上方；移动端改为横向滚动。

---

## 7. AI 聊天交互设计

### 7.1 底部悬浮输入框

- 位置：CenterBottom 容器内，`position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%);`  
- 宽度：90%（最大 768px），圆角 + 毛玻璃 + 投影  
- 结构：  
  - 左：Lucide `Sparkles` 图标  
  - 中：输入框，支持 Enter 发送  
  - 右：示例问题下拉（`Lightbulb`）+ 发送按钮（`Send`）  

快捷键：  

- ⌘/Ctrl + K：聚焦输入框  
- Esc：关闭右侧 AI 面板  

### 7.2 右侧 AI 回答面板

- 默认隐藏，展开时从右侧滑入（宽度约 384px）  
- 展开时 LayoutShell 给中间区域加 `margin-right: 384px`，避免 K 线被遮挡  
- 内容：  
  - 顶部标题栏：AI 图标 + 标题 + 关闭按钮  
  - 消息列表：用户问题气泡 + AI 回答卡片（Markdown 渲染）  
  - 每条回答底部：👍 有帮助 / 📋 复制 / 🔄 重新生成  
  - 底部：清空对话按钮  

Zustand `aiChatStore` 管理 `messages / isLoading / aiPanelOpen` 状态。

---

## 8. 状态管理策略

| 状态 | 说明 | Store | 持久化 |
|------|------|-------|--------|
| 当前选中股票 `currentSymbol` | 全局唯一 | `watchlistStore` | `localStorage` |
| 面板尺寸 | 左/中/右、上/下比例 | `layoutStore` | `localStorage` |
| 右侧 AI 面板开关 | 展开/收起 | `aiChatStore` | `localStorage` |
| InfoTabPanel 当前 Tab | 新闻 / 基本面 / 情绪 / 技术 | 组件内部 state | 否 |
| 最近查看股票 | 最近 5 个 symbol | `chartHistoryStore` | `localStorage` |
| AI 消息列表 | 问答历史 | `aiChatStore` | 可选（只需会话内） |

---

## 9. 性能与可访问性

### 9.1 性能

- CenterBottom Tab 内容按需加载：`React.lazy` + `Suspense`  
- K 线图懒加载：IntersectionObserver 进入视口才挂载  
- 重渲染控制：  
  - 展示组件 `React.memo`  
  - Zustand selector + `shallow`  
- 性能验收：  
  - Lighthouse Performance ≥ 80（桌面）  
  - 首屏加载 < 2s  

### 9.2 可访问性

- ARIA：  
  - `nav` / `aria-label` 用于自选股导航  
  - Tab 使用 `role="tablist" / role="tab" / role="tabpanel"`  
  - 抽屉 / 面板使用 `aria-expanded` / `aria-controls`  
- 键盘：Tab / Enter / Esc 可完成主要操作  
- 焦点陷阱：抽屉 & AI 面板内部实现 focus trap  
- 使用 axe DevTools 扫描，保证无严重/高危问题。  

---

## 10. ErrorBoundary

为左 / 中上 / 中下 / 右四个区域单独加 ErrorBoundary，单区崩溃不影响其它区域。

```typescript
function PanelErrorFallback({ title }: { title: string }) {
  return (
    <div className="p-4 text-sm bg-red-500/10 text-red-300">
      <p>{title} 加载失败。</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 underline"
      >
        刷新重试
      </button>
    </div>
  );
}
```

---

## 11. 分阶段实施计划

### Phase 1：布局 + 主题 + CenterTop + AI 基础

- 拆分 Home.tsx 为 LayoutShell + 四区域组件 + 悬浮 AI 输入框  
- 引入 Token + 多主题（含 Perplexity Dark）  
- 实现 Perplexity + 同花顺风格的 CenterTop  
- 实现底部悬浮 AI 输入 + 右侧 AI 面板  
- 建立性能 + A11y 基线  

### Phase 2：左侧分组自选股

- 分组管理、拖拽排序、Zustand 持久化  

### Phase 3：底部 Tab 内容面板

- 新闻 / 基本面 / 情绪 / 技术 4 个面板  

### Phase 4：响应式布局 & 移动端

- 桌面三栏、平板折叠、手机抽屉 + 全屏 AI Sheet  

### Phase 5：文档与打磨

- REFACTOR.md / DESIGN-TOKENS.md / THEMING.md / ACCESSIBILITY.md  

---

## 12. 执行方式（AI-COLLAB-PLAYBOOK）

- 🔵 GLM：Spec、接口契约、组件骨架  
- 🟢 Codex：具体实现、长文件编辑  
- 🟣 Amp：Review（Spec 合规 / 性能 / A11y / 代码质量）  
- 🟡 Grok：外部最佳实践调研（Perplexity、同花顺、Lucide 等）  

---

**文档版本**：v2.1（2026-01-19）  
**维护者**：@你（协同 GLM / Codex / Amp / Grok）
