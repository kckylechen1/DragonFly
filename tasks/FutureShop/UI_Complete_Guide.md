# 股票交易界面 UI/UX 完整优化指南

## 目录
1. [完整问题清单](#完整问题清单)
2. [Design Tokens 系统](#design-tokens-系统)
3. [按优先级的详细方案](#按优先级的详细方案)
4. [最佳实践参考](#最佳实践参考)
5. [实施计划](#实施计划)

---

## 完整问题清单

### 🔴 P0 优先级 - 立即修复

#### Issue #1：股票代码重复显示
**现象：**
```
显示：300308 300308  ← 代码重复
应该：300308         ← 仅显示一次
```

**问题根因：**
- HTML 中同时渲染了代码和名称
- 或 JavaScript 中对同一数据渲染了多次
- CSS 加粗规则应用到重复元素

**修复方案：** [详见第 3.1 章](#311-修复股票代码重复显示)

---

### 🟡 P1 优先级 - 本周实施

#### Issue #2：右侧顶部数字信息"挤在一行"
**现象：**
```
607.98  -9.02  -1.46%  ← 三个数据混在一行，用户扫一眼不知重点
```

**问题分析：**
- 价格、涨跌额、涨跌幅三个不同量级的数据平铺
- 视觉层级不清（都是同样大小同样字重）
- 没有突出"当前价格"这个最重要的指标
- 整行显示像"数字墙"，降低可读性

**最佳实践参考：**
- Perplexity Finance 的做法：大号显示当前价格（16-18px），涨跌额/幅在下一行或分成两列（13-14px）
- Bloomberg、Yahoo Finance 都采用"主信息突出、副信息陪衬"的层级

**修复方案：** [详见第 3.2 章](#312-优化右侧顶部信息展示)

---

#### Issue #3：标签/徽章样式不统一
**现象：**
```
"人气#165" 这个 pill 的圆角、边框、阴影、字体与其他标签不在同一套规则
```

**问题分析：**
- 不同标签用了不同的 border-radius（可能 6px、8px、12px 混用）
- padding/字号/字重不一致
- 边框颜色/阴影深度不规范
- 看起来像从不同地方拼装而来

**修复方案：** [详见第 3.3 章](#313-统一徽章与标签组件)

---

#### Issue #4：左侧搜索框仍偏大
**现象：**
```
搜索框高度、圆角、padding 都比较"移动端风"，桌面端显得松散
```

**问题分析：**
- 高度可能 40px+（移动端标准），桌面端应该更紧凑
- 圆角可能过大（12px+），显得软
- padding 过松（左右可能 16px+）
- 整体占用左侧面板太多空间

**修复方案：** [详见第 3.4 章](#314-紧凑化左侧搜索框与列表项)

---

#### Issue #5：列表小走势图（Sparkline）过抢眼
**现象：**
```
左侧列表的小走势图线条对比度偏高，抢过了"股票代码/涨跌幅"的注意力
```

**问题分析：**
- Sparkline 的线条宽度/对比度设置不当
- 默认始终显示，用户视线被分散
- 应该"minimal and non-intrusive"，但现在显得喧宾夺主

**最佳实践参考：**
- Highcharts 对 sparkline 的定义：无坐标轴、无 marker、无 legend，只提供趋势感
- Yahoo Finance、Robinhood：sparkline 默认弱对比（opacity 0.4-0.6），hover 时增强

**修复方案：** [详见第 3.5 章](#315-优化左侧列表-sparkline)

---

#### Issue #6：分割线与边框层级过重
**现象：**
```
线条对比度偏高，让整个界面看起来更像"表格"而不是"卡片组件"
```

**问题分析：**
- 边框颜色可能用了深灰（#999999 or #666666）而不是浅灰
- 线条太多，破坏了 Perplexity 那种"留白分组"的风格
- 不必要的分割线增加了视觉噪音

**最佳实践参考：**
- Perplexity 的做法：尽量用留白/背景色变化来分组，线条 #e5e5e5 或 #efefef，极淡
- Google Material Design 3：优先用背景色/阴影，后用线

**修复方案：** [详见第 3.6 章](#316-优化分割线与边框)

---

#### Issue #7：右侧聊天栏字体/间距与主界面不统一
**现象：**
```
聊天区的正文、数据、代码块的字体大小/字家族/间距与左侧/顶部不一致，显得"拼装感"
```

**问题分析：**
- 聊天可能用了不同的 font-size（14px vs 16px）
- 数字可能没用 SF Mono，而是用了系统默认
- padding/margin 与主界面的间距系统不同步
- 看起来像两个产品用户界面硬拼在一起

**修复方案：** [详见第 3.7 章](#317-聊天栏字体与间距统一)

---

### 🟠 P2 优先级 - 后续优化

#### Issue #8：聊天自动滚动打断用户阅读
**现象：**
```
用户正在向上查看历史消息时，新消息到来或 AI 正在生成回复，页面自动拉到底部
```

**问题分析：**
- 缺少"用户当前在底部"的检测逻辑
- 没有"新消息"提示按钮机制
- 流式输出时频繁触发滚动
- 用户无法安心阅读历史

**最佳实践参考：**
- Nielsen Norman Group：应当"保留用户滚动位置"，只在用户意图明显时才重置[参考资源]
- Slack、Discord、ChatGPT：新消息到来时显示"跳到最新"按钮而非强制滚动
- 只有用户发送消息时才自动滚到底部

**修复方案：** [详见第 3.8 章](#318-实现智能聊天滚动逻辑)

---

#### Issue #9：分时图不显示完整全天时间轴
**现象：**
```
分时图不能显示完整的 09:30-15:00 时间段，未到达的时间不留白处理
Perplexity 的做法：全天时间轴 + 休市区间空白显示
```

**问题分析：**
- x 轴范围没有固定为交易时段
- 休市时间（11:30-13:00）没有特殊处理
- 未来时间段没有显示
- 用户无法一眼看出全天行情

**最佳实践参考：**
- Highcharts 日内图表示例：固定 xAxis min/max，用 plotBand/markArea 处理非交易时段
- TradingView：使用 breaks 机制显示市场休市
- Bloomberg、Yahoo Finance：全天轴 + 休市灰色背景

**修复方案：** [详见第 3.9 章](#319-优化分时图完整时间轴显示)

---

## Design Tokens 系统

### 核心变量定义

把这些变量定义在你的 CSS/设计系统中，后续所有组件都通过这些 tokens 保持一致性：

```css
:root {
  /* 字体 */
  --font-mono: 'SF Mono', 'Monaco', monospace;
  --font-sans: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* 字号 */
  --font-size-xs: 10px;      /* 极小标签 */
  --font-size-sm: 11px;      /* 辅助信息、轴标签 */
  --font-size-base: 12px;    /* 标签、小数据 */
  --font-size-md: 13px;      /* 代码块、sparkline 标签 */
  --font-size-lg: 14px;      /* 常规正文、列表项 */
  --font-size-xl: 16px;      /* 重要数据（如当前价格） */
  --font-size-2xl: 18px;     /* 标题、强调 */
  --font-size-3xl: 24px;     /* 大标题 */
  
  /* 字重 */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  
  /* 圆角 */
  --radius-sm: 6px;
  --radius-base: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* 颜色 - 文本 */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  
  /* 颜色 - 背景 */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #fafafa;
  --color-bg-tertiary: #f5f5f5;
  
  /* 颜色 - 边框/分割线 */
  --color-border-light: #efefef;
  --color-border-base: #e5e5e5;
  --color-border-dark: #d0d0d0;
  
  /* 颜色 - 指标 */
  --color-positive: #16a34a;    /* 涨 - 绿 */
  --color-negative: #dc2626;    /* 跌 - 红 */
  --color-neutral: #6b7280;     /* 中立 - 灰 */
  --color-accent: #0066ff;      /* 强调 - 蓝 */
  
  /* 颜色 - 填充/透明 */
  --color-positive-light: rgba(22, 163, 74, 0.15);
  --color-negative-light: rgba(220, 38, 38, 0.15);
  
  /* 数字格式特性 */
  --font-variant-numeric: tabular-nums;
}
```

### 应用示例

```css
/* 股票代码（列表） */
.stock-code {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-variant-numeric: var(--font-variant-numeric);
}

/* 价格数据 */
.stock-price {
  font-family: var(--font-mono);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-variant-numeric: var(--font-variant-numeric);
}

/* 涨跌幅 */
.stock-change-percent {
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-positive);
  font-variant-numeric: var(--font-variant-numeric);
}

.stock-change-percent.negative {
  color: var(--color-negative);
}

/* 徽章 */
.badge {
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-base);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
}

/* 分割线 */
.divider {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: var(--space-4) 0;
}

/* 搜索框 */
.search-input {
  padding: var(--space-2) var(--space-3);
  height: 36px;
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-base);
  background: var(--color-bg-primary);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-base);
}

/* 聊天消息 */
.chat-message {
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  line-height: 1.5;
  padding: var(--space-3) var(--space-4);
}

.chat-message code {
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
}
```

---

## 按优先级的详细方案

### 3.1 修复股票代码重复显示

**检查步骤：**

**步骤 1：检查 HTML 结构**

```html
<!-- ❌ 错误示例 - 删除重复的 span -->
<div class="stock-item">
  <span class="stock-code">300308</span>
  <span class="stock-code-bold">300308</span>  ← 删除此行
  <span class="stock-price">607.82</span>
  <span class="stock-change">-1.46%</span>
</div>

<!-- ✅ 正确示例 - 保持单一渲染 -->
<div class="stock-item">
  <span class="stock-code">300308</span>
  <span class="stock-price">607.82</span>
  <span class="stock-change">-1.46%</span>
</div>
```

**步骤 2：检查 CSS 规则**

```css
/* ❌ 错误 - 删除重复定义 */
.stock-code {
  font-family: 'SF Mono', monospace;
  font-weight: 600;
  font-size: 14px;
}

.stock-code-bold {  /* ← 删除这个规则 */
  font-family: 'SF Mono', monospace;
  font-weight: 700;
  font-size: 14px;
}

/* ✅ 正确 - 仅保留一个规则 */
.stock-code {
  font-family: 'SF Mono', monospace;
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}
```

**步骤 3：检查 JavaScript 渲染逻辑**

```javascript
/* ❌ 错误 - 删除重复渲染 */
function renderStockItem(stock) {
  return `
    <div class="stock-item">
      <span class="stock-code">${stock.code}</span>
      <span class="stock-code-bold">${stock.code}</span>  ← 删除此行
      <span class="stock-price">${stock.price}</span>
    </div>
  `;
}

/* ✅ 正确 - 仅渲染一次 */
function renderStockItem(stock) {
  return `
    <div class="stock-item">
      <span class="stock-code">${stock.code}</span>
      <span class="stock-price">${stock.price}</span>
      <span class="stock-change">${stock.changePercent}</span>
    </div>
  `;
}
```

**验证修复：**
```
修复前：300308 300308  ← ❌
修复后：300308        ← ✅
```

---

### 3.2 优化右侧顶部信息展示

**问题：** 数字信息"挤在一行"（价格 + 涨跌额 + 涨跌幅），视觉层级不清

**最佳实践：**
- 当前价格最大、最重、最突出
- 涨跌额在第二行（中等大小）
- 涨跌幅作为百分比参考（可选，或与涨跌额同行）

**HTML 重构：**

```html
<!-- ❌ 旧设计 - 挤在一行 -->
<div class="stock-header">
  <span class="price">607.98</span>
  <span class="change-amount">-9.02</span>
  <span class="change-percent">-1.46%</span>
</div>

<!-- ✅ 新设计 - 层级清晰 -->
<div class="stock-header">
  <div class="price-row">
    <span class="current-price">607.98</span>
    <span class="price-change negative">-9.02</span>
    <span class="price-change-percent negative">-1.46%</span>
  </div>
  
  <div class="secondary-info">
    <span class="label">主力净流入</span>
    <span class="value">-9.76亿</span>
  </div>
  
  <div class="secondary-info">
    <span class="label">超大单</span>
    <span class="value negative">-0...</span>
  </div>
</div>
```

**CSS：**

```css
.stock-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.current-price {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);        /* 18px - 最大 */
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.price-change {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);          /* 14px - 中等 */
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.price-change-percent {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);          /* 14px - 中等 */
  font-weight: var(--font-weight-medium);
  color: var(--color-positive);            /* 绿色 */
  font-variant-numeric: tabular-nums;
}

.price-change-percent.negative {
  color: var(--color-negative);            /* 红色 */
}

.secondary-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.secondary-info .label {
  font-family: var(--font-sans);
  font-weight: var(--font-weight-normal);
}

.secondary-info .value {
  font-family: var(--font-mono);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}
```

**预期效果：**

```
┌────────────────────────┐
│ 607.98  -9.02  -1.46%  │  ← 价格区域（层级清晰）
├────────────────────────┤
│ 主力净流入    -9.76亿  │  ← 指标区域（单独行）
│ 超大单       -0...     │
│ ...                    │
└────────────────────────┘
```

---

### 3.3 统一徽章与标签组件

**问题：** 不同标签的圆角、边框、padding、字体不统一

**标准化定义：**

```css
/* 基础徽章样式 */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);    /* 4px 12px */
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);             /* 11px */
  font-weight: var(--font-weight-medium);     /* 500 */
  border-radius: var(--radius-full);          /* 9999px */
  border: 1px solid var(--color-border-base); /* #e5e5e5 */
  background: var(--color-bg-primary);        /* 纯白 */
  color: var(--color-text-secondary);         /* 灰色 */
  white-space: nowrap;
  line-height: 1;
}

/* 不同类型的徽章 */
.badge.positive {
  border-color: var(--color-positive);
  color: var(--color-positive);
  background: var(--color-positive-light);
}

.badge.negative {
  border-color: var(--color-negative);
  color: var(--color-negative);
  background: var(--color-negative-light);
}

.badge.accent {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(0, 102, 255, 0.1);
}

/* 徽章内的图标 */
.badge-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
```

**HTML 使用：**

```html
<!-- 中性徽章 -->
<span class="badge">人气#165</span>

<!-- 正面徽章 -->
<span class="badge positive">
  <span class="badge-icon">📈</span>
  涨势
</span>

<!-- 负面徽章 -->
<span class="badge negative">
  <span class="badge-icon">📉</span>
  跌势
</span>

<!-- 强调徽章 -->
<span class="badge accent">
  <span class="badge-icon">⚡</span>
  推荐
</span>
```

**验证清单：**
- [ ] 所有徽章圆角都是 9999px（完全圆形）
- [ ] 所有徽章 padding 都是 4px 12px
- [ ] 所有徽章字号都是 11px，字重 500
- [ ] 边框都是 1px solid #e5e5e5
- [ ] 同类型徽章颜色一致

---

### 3.4 紧凑化左侧搜索框与列表项

**问题：** 搜索框高度、padding、圆角偏大，占用空间过多

**当前 vs 目标：**

```
当前（松散）          目标（紧凑）
┌──────────────┐     ┌────────────┐
│              │     │ 🔍 搜索... │  ← 高度 36px
│ 🔍 搜索框     │     └────────────┘
│              │     
└──────────────┘     
高度 40-48px         
padding 12-16px      
```

**CSS 修改：**

```css
/* 左侧容器 */
.left-sidebar {
  width: 240px;           /* 从 280-300px 缩至 240px */
  padding: var(--space-4);  /* 16px */
  display: flex;
  flex-direction: column;
  gap: var(--space-2);     /* 8px */
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  height: 36px;            /* 从 40-48px 改为 36px */
  padding: var(--space-2) var(--space-3);  /* 8px 12px */
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-base);      /* 8px */
  background: var(--color-bg-secondary);  /* #fafafa */
  gap: var(--space-2);
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);         /* 14px */
  color: var(--color-text-primary);
  outline: none;
}

.search-box input::placeholder {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-md);         /* 13px */
}

/* 搜索图标 */
.search-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
}

/* 列表项 */
.stock-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;            /* 从 50-60px 改为 40px */
  padding: var(--space-2) var(--space-3);  /* 8px 12px */
  border-radius: var(--radius-base);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  gap: var(--space-2);
  transition: background 200ms ease;
}

.stock-list-item:hover {
  background: var(--color-bg-secondary);
}

.stock-list-item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.stock-list-item-code {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.stock-list-item-sparkline {
  width: 40px;
  height: 24px;
  flex-shrink: 0;
}

.stock-list-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex-shrink: 0;
}

.stock-list-item-price {
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.stock-list-item-change {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-variant-numeric: tabular-nums;
}

.stock-list-item-change.positive {
  color: var(--color-positive);
}

.stock-list-item-change.negative {
  color: var(--color-negative);
}
```

**HTML 结构：**

```html
<div class="left-sidebar">
  <div class="search-box">
    <svg class="search-icon" viewBox="0 0 24 24">
      <!-- 搜索图标 SVG -->
    </svg>
    <input type="text" placeholder="搜索股票代码/名称" />
  </div>
  
  <div class="stock-list">
    <div class="stock-list-item">
      <div class="stock-list-item-info">
        <span class="stock-list-item-code">300308</span>
        <div class="stock-list-item-sparkline">
          <!-- Sparkline 图表 -->
        </div>
      </div>
      <div class="stock-list-item-right">
        <span class="stock-list-item-price">607.82</span>
        <span class="stock-list-item-change negative">-1.46%</span>
      </div>
    </div>
  </div>
</div>
```

**预期效果：**

```
紧凑布局：
┌──────────────────┐
│ 🔍 搜索... [x]   │ ← 36px 高度
├──────────────────┤
│ 300308 📈 607.82 │ ← 40px 高度
│        -1.46%    │
├──────────────────┤
│ 002594 📉 145.67 │ ← 整体更紧凑、专业
│        +2.33%    │
└──────────────────┘
```

---

### 3.5 优化左侧列表 Sparkline

**问题：** 小走势图对比度过高，抢过主要信息的注意力

**最佳实践：**
- Sparkline 应该 "minimal and non-intrusive"
- 无坐标轴、无标记点、无图例
- 弱对比度（opacity 0.4-0.6），hover 时增强
- 高度 20-24px，宽度 40-50px
- 线条宽度 1.5px

**Highcharts Sparkline 配置：**

```javascript
// 默认状态 - 弱对比
const sparklineConfig = {
  chart: {
    type: 'area',
    height: 24,
    width: 50,
    margin: [0, 0, 0, 0],
    backgroundColor: 'transparent'
  },
  title: { text: null },
  credits: { enabled: false },
  legend: { enabled: false },
  xAxis: { 
    visible: false,
    type: 'datetime'
  },
  yAxis: { visible: false },
  plotOptions: {
    series: {
      lineWidth: 1.5,
      states: {
        hover: { enabled: false }  // 禁用默认 hover
      }
    },
    area: {
      fillOpacity: 0.2,
      pointStart: Date.UTC(2026, 0, 19, 9, 30),
      pointInterval: 1000 * 60 * 5  // 5分钟间隔
    }
  },
  tooltip: { enabled: false },
  series: [
    {
      name: '价格',
      data: sparklineData,
      color: 'rgba(22, 163, 74, 0.6)',     /* 弱绿色 */
      fillColor: 'rgba(22, 163, 74, 0.15)' /* 极淡绿 */
    }
  ]
};

// HTML 中使用
<div class="stock-list-item-sparkline" id="sparkline-300308"></div>

// JavaScript 初始化
Highcharts.chart('sparkline-300308', sparklineConfig);
```

**CSS 增强：**

```css
.stock-list-item-sparkline {
  width: 50px;
  height: 24px;
  flex-shrink: 0;
  opacity: 0.5;                    /* 默认弱对比 */
  transition: opacity 200ms ease;
}

.stock-list-item:hover .stock-list-item-sparkline {
  opacity: 0.8;                    /* Hover 时增强 */
}

/* 选中时加强 */
.stock-list-item.active .stock-list-item-sparkline {
  opacity: 1;
}
```

**HTML：**

```html
<div class="stock-list-item">
  <div class="stock-list-item-info">
    <span class="stock-list-item-code">300308</span>
    <div class="stock-list-item-sparkline" id="sparkline-300308"></div>
  </div>
  <div class="stock-list-item-right">
    <span class="stock-list-item-price">607.82</span>
    <span class="stock-list-item-change negative">-1.46%</span>
  </div>
</div>
```

**预期效果：**

```
修改前：300308 [████] 607.82     ← 小图过抢眼
修改后：300308 [░░░░] 607.82     ← 弱对比，只提供趋势感
```

---

### 3.6 优化分割线与边框

**问题：** 边框颜色过深、线条过多，显得杂乱

**最佳实践参考：**
- 分割线颜色应该极淡（#efefef 或 #e5e5e5）
- 优先用留白/背景色变化分组，后用线
- 不必要的线条要删除

**CSS：**

```css
/* 分割线 - 极淡 */
.divider {
  border: none;
  border-top: 1px solid var(--color-border-light);  /* #efefef */
  margin: var(--space-4) 0;
}

/* 卡片边框 */
.card {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-base);
  background: var(--color-bg-primary);
  box-shadow: none;  /* 不用阴影，用边框 */
}

.card.subtle {
  border-color: var(--color-border-light);
  background: var(--color-bg-secondary);  /* 背景色分组，而非边框 */
}

/* 表格边框 */
.table {
  border-collapse: collapse;
}

.table th,
.table td {
  border: none;
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--space-3) var(--space-4);
}

.table th {
  border-bottom: 1px solid var(--color-border-base);  /* 表头线稍深一点 */
  font-weight: var(--font-weight-semibold);
}

.table tr:last-child td {
  border-bottom: none;
}

/* 分组 - 优先用背景色和间距，不用线 */
.group {
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-base);
  margin-bottom: var(--space-4);
}

.group + .group {
  margin-top: var(--space-4);
  /* 用间距分组，而不是用线 */
}

/* 输入框边框 */
.input {
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-base);
  padding: var(--space-2) var(--space-3);
}

.input:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);  /* 轻微阴影代替重边框 */
}

/* 侧边栏分隔 */
.sidebar-divider {
  /* 删除线条，改用背景色和间距分隔 */
  margin: var(--space-4) 0;
}
```

**修改前后对比：**

```
修改前（杂乱）：              修改后（清晰）：
┌───────────────┐            ┌───────────────┐
│ 标题          │            │ 标题          │
├───────────────┤  ← 深线     │               │
│ 内容 1        │            │ 内容 1        │
├───────────────┤  ← 深线     │               │  ← 背景色变化
│ 内容 2        │            │ 内容 2        │
├───────────────┤  ← 深线     │               │
│ 内容 3        │            │ 内容 3        │
├───────────────┤  ← 深线     └───────────────┘
│ 底部          │
└───────────────┘
```

---

### 3.7 聊天栏字体与间距统一

**问题：** 聊天区的字体/字号/间距与主界面不一致，显得"拼装感"

**核心原则：** 聊天区使用完全相同的 Design Tokens

**CSS：**

```css
/* 聊天容器 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-primary);
}

/* 消息列表 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* 消息气泡 - 用户 */
.message.user {
  align-self: flex-end;
  max-width: 70%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-accent);
  color: white;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  line-height: 1.5;
}

/* 消息气泡 - AI */
.message.ai {
  align-self: flex-start;
  max-width: 70%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  line-height: 1.5;
}

/* 消息中的代码块 */
.message code {
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  background: rgba(0, 0, 0, 0.1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.message.user code {
  background: rgba(255, 255, 255, 0.2);
}

/* 消息时间戳 */
.message-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}

/* 输入框 */
.chat-input-wrapper {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
  display: flex;
  gap: var(--space-2);
}

.chat-input {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.chat-input-field {
  flex: 1;
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-base);
  padding: var(--space-2) var(--space-3);
  resize: none;
  max-height: 100px;
  min-height: 36px;
}

.chat-input-field:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
}

.chat-send-btn {
  padding: var(--space-2) var(--space-3);
  height: 36px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-base);
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background 200ms ease;
}

.chat-send-btn:hover {
  background: #0052cc;
}

/* 新消息按钮 */
.new-message-button {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  transition: all 200ms ease;
  z-index: 100;
}

.new-message-button:hover {
  background: #0052cc;
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 102, 255, 0.4);
}

.new-message-button.hidden {
  display: none;
}

/* 脉动动画 */
@keyframes pulse {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.05); }
}

.new-message-button.has-unread {
  animation: pulse 2s infinite;
}
```

**HTML 示例：**

```html
<div class="chat-container">
  <div class="messages" id="messagesContainer">
    <div class="message ai">
      <span>这是 AI 的回复</span>
      <div class="message-time">14:30</div>
    </div>
    
    <div class="message user">
      <span>用户的问题</span>
      <div class="message-time">14:31</div>
    </div>
  </div>
  
  <button class="new-message-button" id="newMsgBtn" hidden>
    ↓ 查看新消息
  </button>
  
  <div class="chat-input-wrapper">
    <div class="chat-input">
      <textarea 
        class="chat-input-field" 
        placeholder="输入消息..."
      ></textarea>
      <button class="chat-send-btn">发送</button>
    </div>
  </div>
</div>
```

**检查清单：**
- [ ] 所有文本字体用 PingFang SC
- [ ] 所有数字用 SF Mono
- [ ] 消息气泡 padding 统一为 12px 16px
- [ ] 消息间 gap 为 12px（--space-3）
- [ ] 代码块字号 13px，背景使用半透明
- [ ] 输入框高度 36px，padding 8px 12px
- [ ] 颜色全部使用 CSS 变量

---

### 3.8 实现智能聊天滚动逻辑

**问题：** 用户正在查看历史消息时被自动拉到底部

**最佳实践（Nielsen Norman Group）：**
- 保留用户滚动位置
- 仅当用户意图明显时才重置
- 给清晰的视觉提示（"跳到最新"按钮）

**完整实现：**

```javascript
class ChatScroller {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.isUserAtBottom = false;
    this.hasUnreadMessages = false;
    this.scrollThreshold = 100;
    
    this.init();
  }
  
  init() {
    if (!this.container) return;
    
    // 监听滚动事件
    this.container.addEventListener('scroll', () => this.onScroll());
    
    // 初始化状态
    this.isUserAtBottom = this.checkIfAtBottom();
  }
  
  // 检测用户是否在底部
  checkIfAtBottom() {
    const { scrollTop, scrollHeight, clientHeight } = this.container;
    return scrollHeight - scrollTop - clientHeight < this.scrollThreshold;
  }
  
  // 用户滚动时
  onScroll() {
    const wasAtBottom = this.isUserAtBottom;
    this.isUserAtBottom = this.checkIfAtBottom();
    
    // 用户到达底部 → 隐藏"新消息"按钮
    if (this.isUserAtBottom && !wasAtBottom) {
      this.hideNewMessageButton();
    }
    
    // 用户离开底部 → 显示"新消息"按钮（如果有未读）
    if (!this.isUserAtBottom && wasAtBottom && this.hasUnreadMessages) {
      this.showNewMessageButton();
    }
  }
  
  // 用户发送消息
  onUserSendMessage() {
    // 始终滚到底部
    this.scrollToBottom(smooth = true);
    this.hasUnreadMessages = false;
    this.hideNewMessageButton();
  }
  
  // 新消息到来
  onNewMessageArrival() {
    this.hasUnreadMessages = true;
    
    if (this.isUserAtBottom) {
      // 用户在底部 → 自动跟随
      this.scrollToBottom(smooth = true);
    } else {
      // 用户在上方 → 显示提示按钮
      this.showNewMessageButton();
    }
  }
  
  // 流式输出中
  onStreamingOutput() {
    // 使用节流避免频繁滚动
    if (this.streamingTimeout) {
      clearTimeout(this.streamingTimeout);
    }
    
    this.streamingTimeout = setTimeout(() => {
      if (this.isUserAtBottom) {
        // 仅当用户在底部时才滚动
        this.scrollToBottom(smooth = false);
      }
    }, 150);
  }
  
  // 平滑滚到底部
  scrollToBottom(smooth = true) {
    this.container.scrollTo({
      top: this.container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    this.isUserAtBottom = true;
  }
  
  // 显示"新消息"按钮
  showNewMessageButton() {
    const btn = document.getElementById('newMsgBtn');
    if (btn) {
      btn.classList.remove('hidden');
      btn.classList.add('has-unread');
    }
  }
  
  // 隐藏"新消息"按钮
  hideNewMessageButton() {
    const btn = document.getElementById('newMsgBtn');
    if (btn) {
      btn.classList.add('hidden');
      btn.classList.remove('has-unread');
    }
  }
}

// 使用方式
const chatScroller = new ChatScroller('.chat-container');

// 用户发送消息时
document.querySelector('.chat-send-btn')?.addEventListener('click', () => {
  // ... 发送消息逻辑
  chatScroller.onUserSendMessage();
});

// AI 返回新消息时
function onAIResponse(message) {
  // ... 添加消息到 DOM
  chatScroller.onNewMessageArrival();
}

// 流式输出中
function onStreamingChunk(chunk) {
  // ... 追加内容到最后一条消息
  chatScroller.onStreamingOutput();
}
```

**HTML 结构：**

```html
<div class="chat-container" id="chatContainer">
  <div class="messages" id="messagesContainer">
    <!-- 消息会动态插入这里 -->
  </div>
  
  <!-- "新消息"按钮 -->
  <button class="new-message-button" id="newMsgBtn" hidden>
    <span>↓</span>
    <span>查看新消息</span>
  </button>
  
  <div class="chat-input-wrapper">
    <div class="chat-input">
      <textarea 
        class="chat-input-field" 
        id="chatInput"
        placeholder="输入消息..."
      ></textarea>
      <button class="chat-send-btn" id="chatSendBtn">发送</button>
    </div>
  </div>
</div>
```

**工作流程：**

```
用户行为                滚动响应
─────────────────────────────────────
用户发送消息 ────────→ 立即滚到底部 ✓
新消息到来（用户在底部）────→ 自动跟随 ✓
新消息到来（用户在上方）────→ 显示按钮 ✓
用户查看历史 ────────→ 不打断，保留位置 ✓
用户点击"新消息"按钮 ────→ 平滑滚到底部 ✓
流式输出中 ────────→ 节流滚动（150ms） ✓
```

---

### 3.9 优化分时图完整时间轴显示

**问题：** 分时图不显示完整的 09:30-15:00，未来时间不留白

**最佳实践（Highcharts）：**
- 固定 x 轴范围为交易时段
- 休市时段用 plotBand 做空白/浅灰背景
- 未来时间留白显示
- 当前时刻用竖线标记

**Highcharts 配置：**

```javascript
const intradayChartConfig = {
  chart: {
    type: 'area',
    height: 400,
    backgroundColor: 'white',
    borderColor: '#efefef',
    borderRadius: 8,
    margin: [40, 40, 80, 60]
  },
  
  title: { text: null },
  credits: { enabled: false },
  
  // X 轴 - 固定时间范围
  xAxis: {
    type: 'datetime',
    // 固定显示完整交易时段
    min: new Date(2026, 0, 19, 9, 30).getTime(),
    max: new Date(2026, 0, 19, 15, 0).getTime(),
    
    // 网格线极淡
    gridLineColor: '#f0f0f0',
    gridLineWidth: 1,
    
    // 轴线
    lineColor: '#e5e5e5',
    lineWidth: 1,
    
    // 标签格式
    labels: {
      format: '{value:%H:%M}',
      style: {
        fontFamily: "'SF Mono', monospace",
        fontSize: '11px',
        color: '#666666'
      }
    },
    
    // 刻度线
    tickInterval: 1000 * 60 * 30,  // 30 分钟
    tickWidth: 1,
    tickColor: '#e5e5e5'
  },
  
  // Y 轴 - 价格
  yAxis: {
    title: { text: null },
    
    // 网格线极淡
    gridLineColor: '#f0f0f0',
    gridLineWidth: 1,
    
    // 标签
    labels: {
      format: '¥{value:.2f}',
      style: {
        fontFamily: "'SF Mono', monospace",
        fontSize: '11px',
        color: '#666666'
      }
    }
  },
  
  // 图表元素
  plotOptions: {
    series: {
      lineWidth: 2,
      pointStart: new Date(2026, 0, 19, 9, 30),
      pointInterval: 1000 * 60 * 5  // 5 分钟
    },
    area: {
      fillOpacity: 0.15,
      color: '#16a34a',  // 绿色
      fillColor: 'rgba(22, 163, 74, 0.15)'
    }
  },
  
  // 鼠标提示
  tooltip: {
    shared: true,
    headerFormat: '<span style="font-family: SF Mono; font-size: 12px;">{point.key:%H:%M}</span><br/>',
    pointFormat: '<span style="color:{series.color}">●</span> ' +
                 '<span style="font-family: SF Mono;">{point.y:.2f}</span><br/>',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'transparent',
    borderRadius: 8,
    style: {
      color: 'white',
      fontSize: '12px'
    }
  },
  
  // 休市区间 - 用 plotBand 表示
  plotBands: [
    {
      from: new Date(2026, 0, 19, 11, 30).getTime(),
      to: new Date(2026, 0, 19, 13, 0).getTime(),
      color: '#fafafa',
      label: {
        text: '休市',
        align: 'center',
        y: 10,
        style: {
          fontFamily: "'PingFang SC', sans-serif",
          fontSize: '12px',
          color: '#999999'
        }
      }
    }
  ],
  
  // 当前时刻 - 用 plotLine 标记
  plotLines: [
    {
      value: new Date(2026, 0, 19, 11, 23).getTime(),  // 当前时间
      color: '#0066ff',
      width: 2,
      label: {
        text: '当前',
        align: 'right',
        x: -10,
        style: {
          fontFamily: "'SF Mono', monospace",
          fontSize: '11px',
          color: '#0066ff',
          fontWeight: 'bold'
        }
      }
    }
  ],
  
  // 数据系列
  series: [
    {
      name: '分时价格',
      data: intradayData,  // 您的分时数据
      color: '#16a34a'
    }
  ]
};

// 初始化
Highcharts.chart('chartContainer', intradayChartConfig);
```

**HTML：**

```html
<div id="chartContainer" style="width: 100%; height: 400px;"></div>
```

**关键参数说明：**

```javascript
// 固定 X 轴范围
min: new Date(2026, 0, 19, 9, 30).getTime(),   // 09:30 开市
max: new Date(2026, 0, 19, 15, 0).getTime(),   // 15:00 收市

// 休市区间 - 11:30 至 13:00
plotBands: [{
  from: new Date(2026, 0, 19, 11, 30).getTime(),
  to: new Date(2026, 0, 19, 13, 0).getTime(),
  color: '#fafafa'  // 极浅灰背景
}]

// 当前时刻标记
plotLines: [{
  value: currentTime,  // 动态更新
  color: '#0066ff',
  width: 2
}]
```

**预期效果：**

```
分时图展示：
┌─────────────────────────────────────────┐
│                                         │
│ ↑ 当前                                  │
│ │                                       │
│ │  ╱╲    ╱╲     ╱╲                      │
│ │ ╱  ╲  ╱  ╲   ╱  ╲                     │
│ ╱    ╲╱    ╲ ╱    ╲                    │
│ │                      ████████ (休市)  │
│ │                      ████████ (空白)  │
│ │                    ╱╲                 │
│ │                   ╱  ╲    ╱╲          │
│ │                  ╱    ╲  ╱  ╲        │
│ └─────────────────────────────────────────┘
│  09:30  10:00  10:30  11:30 13:00 15:00
   上午         休市      下午
```

---

## 最佳实践参考

### 字体对齐（SF Mono）
```css
/* 关键属性：tabular-nums 让数字等宽对齐 */
.price-data {
  font-family: 'SF Mono', monospace;
  font-variant-numeric: tabular-nums;
}

/* 效果 */
607.82  ← 小数点完美对齐
145.67
 89.01
```

### 信息层级（Perplexity 风格）
```
大 - 最重要（当前价格）
├─ 中 - 重要（涨跌幅）
├─ 小 - 参考（涨跌额）
└─ 极小 - 辅助（其他指标）
```

### Sparkline 最佳实践（Highcharts）
```javascript
// Minimal and non-intrusive
{
  height: 24,           // 小高度
  margin: [0,0,0,0],    // 无边距
  legend: false,        // 无图例
  xAxis: { visible: false },  // 无轴
  yAxis: { visible: false },
  tooltip: false,       // 无提示
  lineWidth: 1.5,       // 细线
  opacity: 0.5          // 弱对比
}
```

### 聊天滚动最佳实践（Nielsen Norman）
- 保留用户位置为默认
- 检测用户在底部（100px 阈值）
- 显示"跳到最新"按钮而非强制滚动
- 流式输出时节流（150ms）

### 分时图时间轴（Highcharts）
- 固定 x 轴范围（09:30-15:00）
- plotBand 处理休市（11:30-13:00）
- plotLine 标记当前时刻
- 未来时间自然留白

---

## 实施计划

### 第一阶段 - P0 紧急修复（5-10分钟）

```bash
□ 删除重复的股票代码 HTML 元素
□ 移除多余的 CSS 加粗规则
□ 清理冗余的 JavaScript 渲染逻辑
□ 验证修复效果：不再显示代码重复
```

### 第二阶段 - P1 本周实施（2-3天）

```bash
□ 建立 Design Tokens CSS 系统
□ 实现字体系统（SF Mono + PingFang SC）
  └─ 左侧列表数字
  └─ 右侧信息面板数字
  └─ 图表轴标签
  └─ 聊天区数据

□ 优化右侧顶部信息展示（价格拆分为多行）
  └─ 当前价格 18px 突出
  └─ 涨跌幅 14px 陪衬
  └─ 其他指标单独行

□ 统一徽章/标签样式
  └─ 统一圆角 9999px
  └─ 统一 padding 4px 12px
  └─ 统一字号 11px、字重 500

□ 紧凑化左侧面板
  └─ 缩小宽度 240px
  └─ 搜索框 36px 高度
  └─ 列表项 40px 高度

□ 优化 Sparkline 小图
  └─ 弱对比（opacity 0.5）
  └─ Hover 增强（opacity 0.8）
  └─ 高度 24px、宽度 50px

□ 优化分割线（颜色改淡）
  └─ 改用 #efefef 极淡灰
  └─ 删除不必要的线条

□ 聊天栏字体/间距统一
  └─ 共享 Design Tokens
  └─ 所有文本/数据/代码用一套标准
```

### 第三阶段 - P2 后续优化（1-2周）

```bash
□ 实现智能聊天滚动逻辑
  └─ 检测用户位置（100px 阈值）
  └─ 显示"新消息"按钮
  └─ 流式输出节流（150ms）
  └─ 测试各种场景

□ 优化分时图
  └─ 固定 X 轴范围 09:30-15:00
  └─ plotBand 处理休市区间
  └─ plotLine 标记当前时刻
  └─ 未来时间留白显示
  └─ 测试实时更新

□ 性能优化
  └─ 虚拟滚动（大列表）
  └─ 图表懒加载
  └─ 消息虚拟化
```

### 第四阶段 - 测试与验收

```bash
□ 浏览器兼容性测试（Chrome、Safari、Firefox）
□ 响应式设计测试（1280px、1440px、1600px+）
□ 移动端适配测试
□ 性能指标检查（FPS、首屏时间）
□ 无障碍检查（对比度、键盘导航）
□ 最终对标 Perplexity 风格
```

---

## 对标 Perplexity Finance - 最后检查清单

### 视觉一致性
- [ ] 字体：数字 SF Mono + 文字 PingFang SC
- [ ] 颜色：淡灰边框、强调蓝、涨绿跌红
- [ ] 间距：8px 网格系统贯穿全局
- [ ] 圆角：卡片 8px、徽章 9999px
- [ ] 阴影：最小化，优先用边框/背景色

### 信息层级
- [ ] 价格突出（18px，加粗）
- [ ] 涨跌幅陪衬（14px）
- [ ] 其他指标分离显示
- [ ] 徽章样式统一

### 交互体验
- [ ] 聊天滚动智能化（显示"新消息"按钮）
- [ ] 分时图全天显示 + 休市空白
- [ ] Sparkline 弱对比不喧宾夺主

### 代码质量
- [ ] 无代码重复（股票代码仅显示一次）
- [ ] CSS 使用 Design Tokens
- [ ] JavaScript 解耦（聊天滚动独立类）
- [ ] HTML 语义化

---

## 常见问题解答

**Q: 为什么要用 SF Mono？**
A: SF Mono 是苹果的专业等宽字体，所有数字天然等宽，配合 `font-variant-numeric: tabular-nums` 能实现完美的数字对齐，提升专业感。

**Q: 搜索框高度从 40px 改成 36px，是不是太小了？**
A: 不会。36px 是桌面应用标准（包括 Chrome、Figma），40px+ 是移动端标准。36px 看起来会更紧凑、更专业。

**Q: Sparkline 为什么要弱对比？**
A: Sparkline 的作用是"提供趋势感"而非"主要信息"。过抢眼会分散用户的注意力，反而降低可读性。Highcharts、Yahoo Finance 都采用弱对比 + hover 增强的方案。

**Q: 聊天滚动的 100px 阈值从哪来？**
A: 这是 Slack、Discord 等产品的标准做法。100px 足够让用户感到"我在看最新消息"，同时避免因为输入框高度变化就频繁滚动。

**Q: Design Tokens 要全部用 CSS 变量吗？**
A: 如果用 React/Vue，也可以用 JS 常量。但 CSS 变量的优势是"无需编译，可动态切换主题"。建议用 CSS 变量。

**Q: 怎么验证修复成功？**
A: 对标 Perplexity Finance 截图进行对比：
- [ ] 界面整体不再"杂乱"
- [ ] 数字完美对齐
- [ ] 徽章风格统一
- [ ] 分时图显示完整
- [ ] 聊天滚动不打断阅读

---

## 技术栈补充

如果你想告诉我你的前端技术栈（React/Vue/原生？图表库？），我可以提供更具体的：
- 组件封装示例
- 状态管理方案（Redux/Pinia）
- 性能优化技巧
- 单元测试用例

---

**下一步行动：** 建议从 P0 开始，预计今天内可完成股票代码重复问题的修复。然后按 P1 → P2 的顺序逐步改进。祝修复顺利！🚀
