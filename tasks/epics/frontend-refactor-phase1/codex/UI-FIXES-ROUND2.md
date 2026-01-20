# UI 修复任务 - 第二轮

> **执行者**: Codex  
> **审查者**: Antigravity  
> **优先级**: 高
> **预估工时**: 2.5 小时

---

## 📋 问题列表

### FIX-001: 股票搜索交互优化
**文件**: `client/src/refactor_v2/components/LeftPane.tsx` (或搜索组件)
**预估**: 45 min

**当前问题**:
- 点击搜索结果直接在 K 线上显示，而不是加入自选股列表
- 没有键盘导航支持
- 添加后下拉框没有自动收回

**修改要求**:
1. **点击/回车** → 加入自选股列表 (调用 `addToWatchlist`)
2. **上下方向键** → 在搜索结果中导航选择
3. **添加成功后** → 自动关闭搜索下拉框
4. **不要直接切换 K 线图**，只是添加到列表

```typescript
// 示例实现
const [selectedIndex, setSelectedIndex] = useState(0);
const [isDropdownOpen, setIsDropdownOpen] = useState(false);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (!isDropdownOpen || results.length === 0) return;
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      break;
    case 'ArrowUp':
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      break;
    case 'Enter':
      e.preventDefault();
      handleAddStock(results[selectedIndex]);
      break;
    case 'Escape':
      setIsDropdownOpen(false);
      break;
  }
};

const handleAddStock = (stock: SearchResult) => {
  addToWatchlist({ symbol: stock.code, name: stock.name });
  setIsDropdownOpen(false);  // 关闭下拉框
  setSearchQuery('');        // 清空搜索
};
```

---

### FIX-002: 图表工具按钮位置调整
**文件**: `client/src/refactor_v2/components/StockChart.tsx`
**预估**: 30 min

**当前问题**:
- 截图/全屏按钮(📷 ↗️)放在右边，挡住了 K 线的价格显示
- 应该和左边的周期按钮 (1D/5D/1M...) 放在一起

**修改要求**:
- 将右侧的工具按钮移到左侧周期选择器旁边
- 或者放在周期选择器的最右边，保持一行
- 不要遮挡 K 线图右侧的价格坐标轴

```tsx
{/* 所有控制按钮放在一个工具栏 */}
<div className="absolute top-3 left-3 z-10">
  <div className="flex items-center gap-2 bg-[var(--bg-secondary)]/80 backdrop-blur-md rounded-lg p-1">
    {/* 周期选择 */}
    <div className="flex items-center">
      {PERIODS.map(period => (
        <button key={period} ...>
          {period}
        </button>
      ))}
    </div>
    
    {/* 分隔线 */}
    <div className="w-px h-6 bg-[var(--panel-border)]" />
    
    {/* 工具按钮 */}
    <button title="截图">📷</button>
    <button title="全屏">↗️</button>
    <button title="比较">比较</button>
  </div>
</div>
```

---

### FIX-003: 周期切换连接后端
**文件**: `client/src/refactor_v2/components/CenterTop/index.tsx`
**文件**: `client/src/refactor_v2/api/stocks.ts`
**预估**: 45 min

**当前问题**:
- 1D/5D/1M/6M/YTD/1Y/5Y/MAX 按钮是 mock 的
- 点击后没有调用后端 API 获取对应时间段的数据

**修改要求**:
1. 周期切换时，调用 `useKlineData` 并传入正确的 period 参数
2. 后端 `stocks.getKline` 支持的 period 参数需要映射

```typescript
// 周期映射
const PERIOD_MAP: Record<ChartPeriod, { period: string; limit: number }> = {
  '1D': { period: 'minute', limit: 240 },   // 分钟线，一天约 240 分钟
  '5D': { period: 'minute', limit: 1200 },  // 5天分钟线
  '1M': { period: 'day', limit: 22 },       // 日线，约 22 个交易日
  '6M': { period: 'day', limit: 132 },      // 日线，约 6 个月
  'YTD': { period: 'day', limit: 250 },     // 日线，今年至今
  '1Y': { period: 'day', limit: 250 },      // 日线，一年
  '5Y': { period: 'week', limit: 260 },     // 周线，5 年
  'MAX': { period: 'month', limit: 999 },   // 月线，全部
};

// 使用示例
const { period: apiPeriod, limit } = PERIOD_MAP[activePeriod];
const { data: klineData } = useKlineData(currentSymbol, apiPeriod, limit);
```

**注意**: 需要确认后端 `getKline` 是否支持 `minute`/`week`/`month` 类型，如果不支持需要调整。

---

### FIX-004: 股票名称显示问题 (遗留)
**文件**: 多个文件
**预估**: 30 min

**问题**:
- Header 仍显示 "300308" 而不是 "中际旭创"
- 侧边栏显示 "300308 300308" 重复

**排查**:
1. 检查 `useStockQuote` 返回的 `name` 字段是否有值
2. 如果后端不返回 name，需要从搜索结果/watchlist 获取

---

### FIX-005: 赛博朋克主题按钮渲染问题
**文件**: `client/src/refactor_v2/themes/cyberpunk.theme.ts`
**文件**: `client/src/refactor_v2/components/StockChart.tsx`
**预估**: 20 min

**问题**:
- 赛博朋克主题下，MAX 按钮和日历按钮之间有粉色虚线边框渲染异常
- 看起来像是边框样式溢出或重叠

**可能原因**:
1. 主题的 `border` 或 `outline` 样式设置问题
2. 按钮容器的 `overflow` 没有正确设置
3. 霓虹辉光效果的 `box-shadow` 溢出

**修复思路**:
```css
/* 确保按钮容器有正确的 overflow */
.period-selector {
  overflow: hidden;
  border-radius: 8px;
}

/* 检查霓虹效果不要用虚线 */
.cyberpunk-button {
  border: 1px solid var(--accent-primary);
  /* 不要用 dashed */
}
```

---

### FIX-006: 暗色主题组件样式问题
**文件**: `client/src/refactor_v2/components/LeftPane.tsx`
**文件**: `client/src/refactor_v2/components/ThemeSwitcher.tsx`
**预估**: 30 min

**问题**:
- 暗黑风/赛博朋克等暗色主题下，搜索框和主题按钮仍是白色背景
- 与整体暗色风格不协调

**修复要求**:

1. **搜索框** - 使用 CSS 变量替换硬编码颜色:
```tsx
<input
  className="w-full px-4 py-2 
    bg-[var(--bg-secondary)] 
    border border-[var(--panel-border)] 
    text-[var(--text-primary)]
    placeholder:text-[var(--text-muted)]
    rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]/50"
  placeholder="搜索股票..."
/>
```

2. **主题切换按钮** - 同样使用 CSS 变量:
```tsx
<button
  className="flex items-center gap-2 px-3 py-1.5
    bg-[var(--bg-tertiary)]
    border border-[var(--panel-border)]
    text-[var(--text-secondary)]
    rounded-lg hover:bg-[var(--bg-secondary)]"
>
  <Palette className="w-4 h-4" />
  <span>{currentTheme.label}</span>
</button>
```

3. **下拉菜单** - 也需要适配:
```tsx
<div className="absolute ... 
  bg-[var(--bg-secondary)] 
  border border-[var(--panel-border)]
  shadow-lg">
  {/* menu items */}
</div>
```

---

## ✅ 验证清单

```bash
# 类型检查
pnpm check

# 功能验证
# 1. 搜索 "600000" → 按上下键选择 → 回车加入自选
# 2. 验证下拉框自动关闭
# 3. 验证股票出现在左侧列表
# 4. 点击 1M → 验证图表显示月线数据
# 5. 验证工具按钮不遮挡价格轴
```

---

## 📌 执行顺序

1. FIX-001 (搜索交互) - 用户体验关键
2. FIX-003 (周期切换) - 功能性问题
3. FIX-002 (按钮位置) - 视觉优化
4. FIX-004 (名称显示) - 遗留问题
