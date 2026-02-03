# TASK-002: 侧边栏股票池接入动态数据

## 负责 Agent: 🟢 Codex

## 问题描述

当前侧边栏的股票池（自选股、持仓等）使用硬编码的模拟数据，需要改为从 API 动态获取。

## 目标

- [ ] 移除硬编码的 `watchlistGroups` 数据
- [ ] 调用后端 API 获取用户的自选股数据
- [ ] 实现加载状态和错误处理

## 当前代码位置

`client/src/components/layout/Sidebar.tsx` 第 99-128 行的硬编码数据：

```typescript
const watchlistGroups: WatchlistGroup[] = [
  {
    id: "portfolio",
    name: "持仓",
    type: "portfolio",
    items: [
      { symbol: "300308", name: "中际旭创", change: 2.35 },
      // ...
    ],
  },
  // ...
];
```

## 相关文件

| 操作 | 文件路径 |
|------|----------|
| MODIFY | `client/src/components/layout/Sidebar.tsx` |
| CHECK | `client/src/stores/watchlist.store.ts` |
| CHECK | `server/routers/stocks.ts` |

## Done Definition

- [ ] 股票池数据从 store 或 API 获取
- [ ] 移除硬编码数据
- [ ] 有 loading 状态显示
