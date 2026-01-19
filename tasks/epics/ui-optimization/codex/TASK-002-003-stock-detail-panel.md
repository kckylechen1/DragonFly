# TASK-002 + TASK-003: 优化 StockDetailPanel 右侧面板

## 负责 Agent: 🟢 Codex

## 目标

1. **Issue #2**: 优化右侧顶部信息展示层级（价格突出、涨跌幅陪衬）
2. **Issue #3**: 统一徽章与标签组件样式

## 涉及文件

- `client/src/components/stock/StockDetailPanel.tsx`

## Issue #2: 右侧顶部数字信息层级

### 当前问题

```
607.98  -9.02  -1.46%  ← 三个数据混在一行，视觉层级不清
```

### 目标效果

```
607.98  ← 大号字体，最突出
-9.02  -1.46%  ← 中号字体，陪衬
```

### 修改位置

文件行 510-543，`price-row` 区域：

```tsx
{/* 第一行：价格和涨跌幅 */}
<div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
  <span className={`text-stock-price font-bold font-mono tracking-tight ${getChangeColor(quote?.change)}`}>
    ...
  </span>
  {quote?.change !== undefined && (
    <div className={`flex items-baseline gap-1 text-stock-change font-medium ${getChangeColor(quote.change)}`}>
      ...
    </div>
  )}
</div>
```

### 修改方案

1. 增大价格字号差异：
   - 当前价格：使用 `text-2xl md:text-3xl`（从 `text-stock-price` 改）
   - 涨跌幅：使用 `text-base md:text-lg`（从 `text-stock-change` 改）

2. 确保数字对齐：添加 `tabular-nums` class

---

## Issue #3: 徽章样式统一

### 当前问题

人气排名和雪球排名标签样式略有不同

### 修改位置

文件行 556-588，徽章区域：

```tsx
{/* 人气排名标签 */}
{hotRank && (
  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ...`}>
    🔥 人气#{hotRank.rank}
    ...
  </span>
)}

{/* 雪球排名标签 */}
{xueqiuRank && (
  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/20 font-medium">
    ❄️ 雪球#{xueqiuRank.rank}
  </span>
)}
```

### 修改方案

统一所有徽章样式为：
- 圆角：`rounded-full`（9999px）✅ 已统一
- 内边距：`px-2 py-0.5` ✅ 已统一
- 字号：`text-xs`（11px）✅ 已统一
- 字重：`font-medium` ✅ 已统一
- 边框：确保都有 `border border-xxx-500/20`

---

## 步骤

**Step 1: 修改价格区域字号**

在行 512-521 修改价格显示：
```tsx
<span
  className={`text-2xl md:text-3xl font-bold font-mono tracking-tight tabular-nums ${getChangeColor(quote?.change)}`}
>
```

**Step 2: 修改涨跌幅字号**

在行 523-541 修改涨跌幅显示：
```tsx
<div
  className={`flex items-baseline gap-1 text-base md:text-lg font-medium tabular-nums ${getChangeColor(quote.change)}`}
>
```

**Step 3: 检查徽章样式一致性**

确保行 558-588 的所有徽章都有相同的基础样式。

**Step 4: 验证**

```bash
pnpm dev
# 在浏览器中检查右侧面板：
# 1. 价格明显大于涨跌幅
# 2. 所有徽章样式一致
```

## 完成标准

- [ ] 价格字号明显大于涨跌幅
- [ ] 所有数字使用 `tabular-nums` 对齐
- [ ] 徽章样式完全统一
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告

## 回滚方式

```bash
git checkout client/src/components/stock/StockDetailPanel.tsx
```
