# Bugfix 任务 - 股票名称显示问题

> **执行者**: Codex  
> **审查者**: Antigravity  
> **优先级**: 高

---

## 问题描述

当前 Header 显示的是股票代码 (如 "688525") 而不是股票名称 (如 "中际旭创")。

**原因分析**:
1. 后端 API `stocks.getQuote` 返回的 `name` 字段有时为空
2. 本地 watchlist 只缓存了少量股票，新选择的股票没有本地名称缓存

---

## 任务列表

### BF-001: 确保后端 getQuote 返回 name 字段
**文件**: `server/routers/stocks.ts`
**预估**: 15 min

检查 `getQuote` 函数，确保返回的数据包含 `name` 字段。

现有代码使用 `getQuoteWithFallback`，需要确认：
1. 该函数调用的数据源 (eastmoney/akshare) 是否返回 name
2. 如果不返回，添加额外查询获取股票名称

```typescript
// 修改思路：确保返回对象包含 name
getQuote: publicProcedure
  .input(z.object({ code: z.string() }))
  .query(async ({ input }) => {
    try {
      const quote = await getQuoteWithFallback(input.code);
      // 如果 name 为空，尝试从其他数据源获取
      if (quote && !quote.name) {
        const akshare = await import("../akshare");
        const stockInfo = await akshare.getStockInfo(input.code);
        quote.name = stockInfo?.name || input.code;
      }
      return quote;
    } catch (error) {
      // ...
    }
  }),
```

---

### BF-002: 增强前端 fallback 逻辑
**文件**: `client/src/refactor_v2/components/CenterTop/index.tsx`
**预估**: 10 min

当前代码已有 localName fallback，但 localName 只在 watchlist 中有这个股票时才有效。

添加一个新的 fallback 层：从 `chartHistory` store 获取名称。

```typescript
import { useChartHistoryStore } from "@/refactor_v2/stores/chartHistory.store";

// 在组件内
const { history } = useChartHistoryStore();

const localName = useMemo(() => {
  // 1. 先从 watchlist 查找
  const watchItem = watchlist.find(w => w.symbol === currentSymbol);
  if (watchItem?.name) return watchItem.name;
  
  // 2. 从 chartHistory 查找
  const historyItem = history.find(h => h.symbol === currentSymbol);
  if (historyItem?.name) return historyItem.name;
  
  // 3. 最后返回代码
  return currentSymbol;
}, [watchlist, history, currentSymbol]);
```

---

### BF-003: LeftPane 点击时传递股票名称
**文件**: `client/src/refactor_v2/components/LeftPane.tsx`
**预估**: 15 min

确保 LeftPane 列表显示股票时获取并缓存名称。

如果使用了 API 数据（`useWatchlist` hook），确保：
1. 列表 item 包含 `name` 字段
2. 点击股票时，调用 `addToHistory(symbol, name)`

---

### BF-004: 调试验证
**预估**: 10 min

1. 运行 `pnpm check` 确保无类型错误
2. 启动开发服务器 `pnpm dev`
3. 在控制台打印 `quoteData` 确认 `name` 字段值
4. 记录结果到 `REFACTOR-STATUS.md`

---

## 验证标准

修复后，股票 Header 应显示：
- ✅ "中际旭创" (而不是 "300308")
- ✅ "比亚迪" (而不是 "002594") 
- ✅ "东方财富" (而不是 "300059")

---

## 执行顺序

1. BF-001 (后端优先)
2. BF-002 + BF-003 (前端)
3. BF-004 (验证)
