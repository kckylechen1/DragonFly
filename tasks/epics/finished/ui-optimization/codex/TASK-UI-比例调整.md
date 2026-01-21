# TASK: UI 比例与字号调整 - 对标 Perplexity Finance

## 负责 Agent: 🟢 Codex

## 参考对比

### Perplexity Finance 风格（目标）
- 价格字号：约 24px（`text-2xl`），简洁但不过大
- 涨跌幅：约 14px（`text-sm`），作为陪衬
- 数据指标：约 13-14px，紧凑
- 整体感觉：简洁、留白多、不拥挤

### 当前问题
1. **左侧侧边栏**：`w-52`（208px）占比过大，且缺少股票名称显示
2. **右侧价格**：`text-2xl md:text-3xl`（18-30px）过大
3. **数据指标区**：字号太大，占用太多垂直空间

---

## 修改清单

### 1. WatchlistSidebar.tsx - 调整侧边栏

文件：`client/src/components/stock/WatchlistSidebar.tsx`

**修改 1：侧边栏宽度**
```tsx
// 修改行 53
// 修改前
<div className="w-52 shrink-0 border-r border-border flex flex-col text-xs">

// 修改后 - 恢复到合理宽度
<div className="w-56 shrink-0 border-r border-border flex flex-col">
```

---

### 2. StockListItem.tsx - 调整列表项

文件：`client/src/components/stock/StockListItem.tsx`

**修改 1：显示股票名称**

当前只显示代码，应该同时显示名称（如 Perplexity 那样）。

```tsx
// 在行 202 附近，检查是否需要恢复名称显示
// 确保列表项包含：名称 + 代码 + Sparkline + 涨跌幅
```

**修改 2：字号调整**
```tsx
// 修改名称字号
// 当前：text-xs → 改为：text-sm（14px）

// 修改代码字号
// 当前：text-[9px] → 改为：text-xs（12px）
```

---

### 3. StockDetailPanel.tsx - 调整右侧面板

文件：`client/src/components/stock/StockDetailPanel.tsx`

**修改 1：价格字号（行 519）**
```tsx
// 修改前
"text-2xl md:text-3xl font-bold font-mono tracking-tight " +

// 修改后 - 参考 Perplexity 约 24px
"text-xl md:text-2xl font-bold font-mono tracking-tight " +
```

**修改 2：涨跌幅字号（行 532）**
```tsx
// 修改前
"flex items-baseline gap-1 text-base md:text-lg " +

// 修改后 - 更小一些
"flex items-baseline gap-1 text-sm md:text-base " +
```

**修改 3：名称字号（行 554）**
```tsx
// 当前使用 text-stock-name，需要检查这个变量的定义
// 如果太大，改为 text-base 或 text-sm
```

**修改 4：数据指标区（行 604 和 664）**
```tsx
// 修改前
<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-stock-data">

// 修改后 - 使用更小的字号
<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
```

---

## 验证清单

运行 `npm run dev` 后在浏览器检查：

- [ ] 左侧侧边栏宽度适中（约 224px / 14rem）
- [ ] 列表项显示：股票名称 + 代码 + Sparkline + 涨跌幅
- [ ] 右侧面板价格约 24px，不会太大
- [ ] 涨跌幅作为陪衬，约 14-16px
- [ ] 数据指标区紧凑，约 12px
- [ ] 整体视觉接近 Perplexity Finance 风格

---

## 参考图片

Perplexity Finance 布局特点：
- 价格 `CN¥605.50` 约 24px
- 涨跌 `-CN¥11.50 ▼ 1.86%` 约 14px
- 简洁卡片式设计，留白多
- 数据表格紧凑

---

## 回滚方式

```bash
git checkout client/src/components/stock/WatchlistSidebar.tsx
git checkout client/src/components/stock/StockListItem.tsx
git checkout client/src/components/stock/StockDetailPanel.tsx
```
