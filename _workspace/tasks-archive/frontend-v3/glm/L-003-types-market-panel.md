# L-003: 创建 Market 和 Panel 类型定义

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- L-002 (Chat 类型)

## 目标
- [ ] 创建 `types/market.ts` - 行情、K线、盘口类型
- [ ] 创建 `types/panel.ts` - 面板类型（含能力声明）
- [ ] 创建 `types/connection.ts` - 连接状态类型
- [ ] 更新 `types/index.ts`

---

## 参考文档

- `tasks/FutureShop/frontend-architecture-guide.md` 第 824-886 行
- `FRONTEND_REFACTOR_REVIEW.md` 第 865-887 行（Panel 能力声明）
- `FRONTEND_REFACTOR_REVIEW.md` 第 828-850 行（ConnectionState）

---

## 步骤

### Step 1: 创建 types/market.ts

```typescript
// client/src/refactor_v2/types/market.ts

/**
 * 实时行情 Tick
 */
export interface MarketTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

/**
 * K线数据
 */
export interface KLine {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 盘口数据（买五卖五）
 */
export interface OrderBook {
  /** 卖盘 [价格, 数量][] */
  asks: Array<[number, number]>;
  /** 买盘 [价格, 数量][] */
  bids: Array<[number, number]>;
  timestamp: number;
}

/**
 * 股票基本信息
 */
export interface StockInfo {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  pe?: number;
  pb?: number;
  marketCap?: number;
}

/**
 * 资讯
 */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: number;
  url: string;
}
```

### Step 2: 创建 types/panel.ts

```typescript
// client/src/refactor_v2/types/panel.ts

import type { ReactNode, ComponentType } from "react";

/**
 * 面板 Props
 */
export interface PanelProps {
  symbol: string;
}

/**
 * 面板上下文（提供给 setup 函数）
 */
export interface PanelContext {
  symbol: string;
  // marketClient 和 queryClient 由使用方注入
}

/**
 * 面板能力声明（参考 FRONTEND_REFACTOR_REVIEW.md 第 865-887 行）
 */
export interface Panel {
  id: string;
  title: string;
  icon: ReactNode;

  /**
   * 声明式依赖
   */
  requires: {
    realtime?: ("tick" | "orderbook")[];
    queries?: ("kline" | "info" | "news")[];
  };

  /**
   * 统一生命周期（返回 cleanup 函数）
   */
  setup?: (ctx: PanelContext) => () => void;

  /**
   * 面板组件
   */
  component: ComponentType<PanelProps>;
}

/**
 * 面板 ID 类型
 */
export type PanelId =
  | "kline"
  | "intraday"
  | "orderbook"
  | "indicators"
  | "advice"
  | "news";
```

### Step 3: 创建 types/connection.ts

```typescript
// client/src/refactor_v2/types/connection.ts

/**
 * 连接状态（参考 FRONTEND_REFACTOR_REVIEW.md 第 828-850 行）
 */
export type ConnectionState =
  | "idle"
  | "connecting"
  | "open"
  | "degraded"
  | "closed"
  | "error";

/**
 * 连接状态详情
 */
export interface ConnectionStatus {
  state: ConnectionState;
  lastMessageAt: number | null;
  retryCount: number;
  lastError: Error | null;
}
```

### Step 4: 更新 types/index.ts

```typescript
// client/src/refactor_v2/types/index.ts

export * from "./chat";
export * from "./market";
export * from "./panel";
export * from "./connection";
```

### Step 5: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `types/market.ts` 已创建，包含 MarketTick, KLine, OrderBook, StockInfo
- [ ] `types/panel.ts` 已创建，Panel 接口包含 requires 能力声明
- [ ] `types/connection.ts` 已创建
- [ ] `types/index.ts` 导出所有类型
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/types/market.ts`
- `client/src/refactor_v2/types/panel.ts`
- `client/src/refactor_v2/types/connection.ts`
- `client/src/refactor_v2/types/index.ts` (更新)
