# UI-FIXES-ROUND3: 图表组件优化

> **Executor**: Codex
> **Reviewer**: Antigravity
> **Estimated Time**: 2 小时

---

## 🎯 任务概述

参照 Perplexity Finance 的图表设计，优化 DragonFly 的 K 线图表组件。

## 📸 参考设计

用户提供了 5 张 Perplexity 截图作为参考，位于:
- `uploaded_image_0_1768913647481.png` - X轴时间格式
- `uploaded_image_1_1768913647481.png` - 周期选择器高亮样式
- `uploaded_image_2_1768913647481.png` - 1D 线图布局 (带成交量)
- `uploaded_image_3_1768913647481.png` - 6M 线图对比模式
- `uploaded_image_4_1768913647481.png` - K线蜡烛图样式

---

## 📋 任务列表

### FIX-007: X轴时间范围修正
**File**: `client/src/refactor_v2/components/StockChart.tsx`
**Estimated**: 30 min

**当前问题**: X轴显示 02:00-07:00，不符合A股交易时间

**修复要求**:
1. A股交易时间为 **9:30 - 15:00**（上午 9:30-11:30，下午 13:00-15:00）
2. 1D 周期的 X 轴应显示: `9:30`, `10:00`, `10:30`, `11:00`, `11:30`, `13:00`, `13:30`, `14:00`, `14:30`, `15:00`
3. 非交易时间段(11:30-13:00)应该跳过，不显示空白区域

**参考**: Perplexity 截图中1D图的X轴格式

---

### FIX-008: 周期选择器高亮框样式
**File**: `client/src/refactor_v2/components/StockChart.tsx`
**Estimated**: 30 min

**当前问题**: 蓝色高亮框位置歪斜，与按钮不对齐

**修复要求**:
1. 参照 Perplexity 第二张图的样式: 紫色实心背景 + 圆角
2. 高亮框应该完全覆盖按钮文字，居中对齐
3. 按钮间距均匀，不要有偏移

**Perplexity 样式参考**:
```css
/* 选中状态 */
background: #7c3aed; /* 紫色，我们可用主题色 var(--color-primary) */
border-radius: 6px;
padding: 6px 12px;
color: white;

/* 未选中状态 */
background: transparent;
color: var(--text-secondary);
```

---

### FIX-009: 添加图表类型切换按钮
**File**: `client/src/refactor_v2/components/StockChart.tsx`
**Estimated**: 45 min

**当前问题**: 自动根据周期切换图表类型，但用户希望有手动切换按钮

**修复要求**:
1. 添加两个按钮: **线图** (山形图标) 和 **K线** (蜡烛图标)
2. 放置在周期选择器右侧，参照 Perplexity 的 `📈` 和 `🕯️` 按钮组位置
3. 默认:
   - 1D/5D: 默认选择线图
   - 其他周期: 默认选择K线
4. 用户可手动切换，覆盖默认设置

**UI 布局参考** (Perplexity):
```
[1D] [5D] [1M] [6M] [YTD] [1Y] [5Y] [MAX] [📅] | [📈线图] [🕯️K线] | [⋮更多]
```

---

### FIX-010: K线配色优化
**File**: `client/src/refactor_v2/components/StockChart.tsx`
**Estimated**: 20 min

**修复要求**:
参照 Perplexity K线图配色，但颜色反转为A股规则:

| 状态 | Perplexity (美股) | DragonFly (A股) |
|------|-------------------|-----------------|
| 涨 | 绿色 `#10b981` | **红色 `#ef4444`** |
| 跌 | 红色 `#ef4444` | **绿色 `#10b981`** |

**蜡烛样式参考**:
- 实心填充 (不是空心)
- 较细的影线 (wick)
- 柱体间距适中

**成交量柱配色**:
- 涨: 红色 (与蜡烛同色)
- 跌: 绿色 (与蜡烛同色)
- 略透明: `rgba(239, 68, 68, 0.6)` / `rgba(16, 185, 129, 0.6)`

---

## ✅ 验证

```bash
pnpm check  # 类型检查必须通过
```

**用户会进行可视化验证，Codex 不需要自己打开浏览器测试。**

---

## 🚫 注意事项

1. **不要自己验证 UI** - 只需确保 `pnpm check` 通过
2. **保持现有功能** - 不要破坏已有的主题切换、搜索等功能
3. **遇到问题停下来问** - 如果不确定设计意图，记录问题等待反馈
