# 修复股票名称显示问题（根因已确认）

## 负责 Agent: 🟢 Codex

## 根因分析

通过 API 拦截确认：

| 字段 | 值 | 正确性 |
|------|-----|:------:|
| `stock.name` | "中际旭创" | ✅ |
| `quote.name` | "300308" | ❌ |

**问题**：前端代码优先使用 `quote.name`，导致显示代码而不是名称。

---

## 修复方案

### 1. StockListItem.tsx（行 145-146）

**当前代码**：
```tsx
const rawName = quote?.quote?.name || quote?.stock?.name || "";
const name = rawName === item.stockCode ? "" : rawName || "加载中...";
```

**问题**：`quote?.quote?.name` 返回 "300308"，优先级错误

**修复**：优先使用 `stock.name`
```tsx
// 优先使用 stock.name（正确的名称），然后才是 quote.name
const rawName = quote?.stock?.name || quote?.quote?.name || "";
const name = rawName === item.stockCode ? "" : rawName || "加载中...";
```

### 2. StockDetailPanel.tsx（行 492-493）

**当前代码**：
```tsx
const rawDisplayName = quote?.name || extras?.stock?.name || "";
const displayName = rawDisplayName === stockCode ? "" : rawDisplayName || "加载中...";
```

**问题**：`quote?.name` 返回 "300308"，优先级错误

**修复**：优先使用 `extras?.stock?.name`
```tsx
// 优先使用 extras.stock.name（正确的名称），然后才是 quote.name
const rawDisplayName = extras?.stock?.name || quote?.name || "";
const displayName = rawDisplayName === stockCode ? "" : rawDisplayName || "加载中...";
```

---

## 验证检查清单

- [ ] 左侧列表显示："中际旭创" + "SZ 300308" + Sparkline + 涨跌幅
- [ ] 右侧面板显示："中际旭创 300308" + 价格 + 涨跌幅

---

## 回滚方式

```bash
git checkout client/src/components/stock/StockListItem.tsx
git checkout client/src/components/stock/StockDetailPanel.tsx
```
