# UI 恢复任务 - 恢复老版本布局

## 负责 Agent: 🟢 Codex

## 背景
今天的 UI 优化改动过度，导致界面变"残废"了。需要恢复关键布局值。

---

## 修复清单

### 1. WatchlistSidebar.tsx

**恢复侧边栏宽度和 padding**：

```tsx
// 行 53：恢复宽度
// 当前：<div className="w-56 shrink-0 ...">
// 恢复：<div className="w-80 shrink-0 ...">

// 行 54：恢复 padding
// 当前：<div className="px-2 py-1.5 border-b ...">
// 恢复：<div className="px-4 py-3 border-b ...">
```

**保留**：折叠/展开按钮功能（ChevronLeft/Right）

---

### 2. StockListItem.tsx

**恢复列表项 padding**：
```tsx
// 行 194：恢复 padding
// 当前：group px-2 py-1.5 border-b
// 恢复：group px-4 py-3 border-b
```

**恢复 Sparkline 布局和尺寸**：
```tsx
// 行 106：恢复 canvas 尺寸
// 当前：<canvas ref={canvasRef} width={40} height={18} ...>
// 恢复：<canvas ref={canvasRef} width={60} height={24} ...>

// 行 219：恢复 flex 布局
// 当前：<div className="w-16 shrink-0 flex justify-center px-1">
// 恢复：<div className="flex-1 flex justify-center px-2">

// 行 227：恢复占位符尺寸
// 当前：<div className="w-[40px] h-[18px]" />
// 恢复：<div className="w-[60px] h-[24px]" />
```

**恢复名称字号**：
```tsx
// 行 203：恢复字号
// 当前：<div className="text-sm font-medium ...">
// 恢复：<div className="font-medium ...">
```

**保留**：名称优先级修复（stock.name > quote.name）

---

### 3. StockMainPanel.tsx

**恢复市场面板默认显示**：
- 移除 `showMarketPanel` 状态控制
- 让 Accordion 默认显示（不需要点击按钮）

---

## 验证

- [ ] 侧边栏宽度恢复到 320px
- [ ] 列表项 padding 恢复
- [ ] Sparkline 尺寸恢复到 60x24
- [ ] 市场面板默认显示
- [ ] 整体布局接近老版本截图

## 回滚

```bash
git checkout client/src/components/stock/WatchlistSidebar.tsx
git checkout client/src/components/stock/StockListItem.tsx
git checkout client/src/components/stock/StockMainPanel.tsx
```
