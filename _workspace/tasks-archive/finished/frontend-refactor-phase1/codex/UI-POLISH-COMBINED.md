# UI 优化任务 - 综合版

> **执行者**: Codex  
> **审查者**: Antigravity  
> **优先级**: 高
> **预估工时**: 3-4 小时

---

## 📋 任务概览

本任务整合三部分：
1. **Bugfix**: 股票名称显示问题
2. **Bugfix**: 股票无法加入自选股池
3. **UI Polish**: 界面视觉提升

---

## Part 1: Bug 修复

### BF-001: 后端 getQuote 确保返回 name 字段
**文件**: `server/routers/stocks.ts`
**预估**: 15 min

检查 `getQuote` 和 `getQuoteWithFallback` 函数，确保返回的数据包含 `name` 字段。

```typescript
// 思路：如果 quote.name 为空，从其他来源补充
getQuote: publicProcedure
  .input(z.object({ code: z.string() }))
  .query(async ({ input }) => {
    const quote = await getQuoteWithFallback(input.code);
    if (quote && !quote.name) {
      // 尝试从 AKShare 获取股票名称
      const stockInfo = await akshare.getStockBasicInfo(input.code);
      quote.name = stockInfo?.name || input.code;
    }
    return quote;
  }),
```

---

### BF-002: 前端增强 fallback 逻辑
**文件**: `client/src/refactor_v2/components/CenterTop/index.tsx`
**预估**: 15 min

从多个来源获取股票名称作为 fallback：

```typescript
import { useChartHistoryStore } from "@/refactor_v2/stores/chartHistory.store";

// 在组件内
const { history } = useChartHistoryStore();

const localName = useMemo(() => {
  // 1. 从 watchlist 查找
  const watchItem = watchlist.find(w => w.symbol === currentSymbol);
  if (watchItem?.name) return watchItem.name;
  
  // 2. 从 chartHistory 查找
  const historyItem = history.find(h => h.symbol === currentSymbol);
  if (historyItem?.name) return historyItem.name;
  
  // 3. 返回代码
  return currentSymbol;
}, [watchlist, history, currentSymbol]);
```

---

### BF-003: 股票加入自选股池功能修复
**文件**: `client/src/refactor_v2/components/LeftPane.tsx` 或搜索功能组件
**预估**: 30 min

**问题描述**: 点选股票后无法加入自选股池

**排查思路**:
1. 检查搜索结果点击事件是否调用 `addToWatchlist`
2. 检查 `useWatchlistStore` 的 `addToWatchlist` 方法是否正确
3. 检查是否有 API 调用失败（后端 watchlist router）

**可能的修复**:

```typescript
// 在搜索结果组件中
const handleAddStock = (stock: { code: string; name: string }) => {
  // 1. 添加到本地 store
  addToWatchlist({ symbol: stock.code, name: stock.name });
  
  // 2. 如果需要持久化到后端
  // api.watchlist.add.mutate({ code: stock.code, name: stock.name });
  
  // 3. 切换到该股票
  setCurrentSymbol(stock.code);
};

// 确保按钮绑定了事件
<button onClick={() => handleAddStock(result)}>
  + 加入自选
</button>
```

**验证**:
- 搜索任意股票
- 点击加入自选
- 确认左侧列表出现该股票

---

## Part 2: UI 视觉提升

### UI-001: 侧边栏现代化
**文件**: `client/src/refactor_v2/components/LeftPane.tsx`
**预估**: 30 min

**当前问题**: 选中项蓝色背景块显得生硬

**修改内容**:
1. 改为 Ghost Button + 左侧高亮条样式
2. 添加 Hover 动效 (`translate-x-1`)
3. 显示涨跌幅百分比

```css
/* 选中项样式 */
.watchlist-item-active {
  background: transparent;
  border-left: 3px solid var(--accent-primary);
  padding-left: 12px;
}

.watchlist-item:hover {
  transform: translateX(2px);
  transition: transform 0.15s ease;
}
```

```tsx
// 列表项增加涨跌幅
<div className="flex justify-between items-center">
  <span>{item.name || item.symbol}</span>
  <span className={isUp ? 'text-[var(--color-up)]' : 'text-[var(--color-down)]'}>
    {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
  </span>
</div>
```

---

### UI-002: 数字排版优化
**文件**: `client/src/refactor_v2/styles/tokens.css`
**预估**: 15 min

启用等宽数字，防止数字变化时跳动：

```css
:root {
  /* 数字字体特性 */
  --font-numeric: 'Inter', system-ui, sans-serif;
}

/* 价格数字专用 */
.price-display {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}
```

**文件**: `client/src/refactor_v2/components/CenterTop/StockHeader.tsx`

```tsx
<span className="text-lg text-[var(--text-secondary)] price-display">
  ¥{quote.price.toFixed(2)}
</span>
```

---

### UI-003: 图表控制器优化 (Segment Control)
**文件**: `client/src/refactor_v2/components/StockChart.tsx`
**预估**: 30 min

**当前问题**: 周期选择器边框感强，不够精致

**修改为 Segment Control 样式**:

```tsx
{/* Period Selector with sliding background */}
<div className="absolute top-3 left-3 z-10">
  <div className="relative flex items-center bg-[var(--bg-secondary)]/80 backdrop-blur-md border border-[var(--panel-border)] rounded-lg p-1 shadow-md">
    {/* 滑动背景块 */}
    <div 
      className="absolute h-7 bg-[var(--accent-primary)] rounded-md transition-all duration-200"
      style={{
        width: `${100 / PERIODS.length}%`,
        left: `${(PERIODS.indexOf(activePeriod) / PERIODS.length) * 100}%`,
      }}
    />
    {PERIODS.map(period => (
      <button
        key={period}
        onClick={() => onPeriodChange?.(period)}
        className={`relative z-10 px-3 py-1 text-xs rounded-md transition-colors ${
          activePeriod === period
            ? 'text-white font-medium'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        {period}
      </button>
    ))}
  </div>
</div>
```

---

### UI-004: 毛玻璃效果 (Glassmorphism)
**文件**: `client/src/refactor_v2/styles/tokens.css`
**预估**: 15 min

添加毛玻璃 CSS 变量：

```css
:root {
  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: 12px;
}

.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}
```

应用到 Header、Sidebar、AI 输入框。

---

### UI-005: AI 输入框增强
**文件**: `client/src/refactor_v2/components/RightPane.tsx`
**预估**: 20 min

**修改内容**:
1. 增加辉光阴影效果
2. 输入框高度增大
3. 添加动态边框

```tsx
<div className="relative">
  {/* 辉光背景 */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-2xl" />
  
  <input
    className="relative w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--panel-border)] rounded-xl
               focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20
               transition-all duration-200"
    placeholder="问 AI 关于这只股票的问题..."
  />
</div>
```

---

### UI-006: 阴影层次增强
**文件**: `client/src/refactor_v2/styles/tokens.css`
**预估**: 10 min

```css
:root {
  /* 增强阴影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-glow: 0 0 15px rgba(59, 130, 246, 0.3);
}
```

---

## ✅ 验证清单

```bash
# 1. 类型检查
pnpm check

# 2. 启动开发服务器
pnpm dev

# 3. 视觉验证
# - 股票名称是否正确显示？
# - 侧边栏选中效果是否为左侧高亮条？
# - 周期选择器是否有滑动动效？
# - 是否有毛玻璃效果？
```

---

## 📌 执行顺序

1. **BF-001, BF-002** (先修 Bug)
2. **UI-002** (数字排版，影响全局)
3. **UI-004, UI-006** (CSS 变量)
4. **UI-001** (侧边栏)
5. **UI-003** (图表控制器)
6. **UI-005** (AI 输入框)

---

## 📋 问题记录

修复/优化后在 `REFACTOR-STATUS.md` 更新：

```markdown
## UI 优化任务

### BF-001: 后端 name 字段
- [ ] 完成

### UI-001: 侧边栏现代化
- [ ] 完成
...
```
