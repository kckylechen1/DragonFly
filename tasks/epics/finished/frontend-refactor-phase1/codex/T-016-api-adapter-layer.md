# T-016: 创建 API Adapter 层（连接真实后端）

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-001 (types 契约)
- T-015 (基础集成完成)

## ⚠️ 重要说明
这个任务是 **Phase 1.5**，在基础 UI 重构完成后执行。
目的是将 mock 数据替换为真实的 tRPC API 调用。

## 目标
- [ ] 复用现有 tRPC client（`@/lib/trpc`）
- [ ] 创建 refactor_v2/api adapter hooks
- [ ] 类型对齐：使用 RouterOutputs 替代手写类型
- [ ] 保持 UI 不变，仅替换数据源

---

## 步骤

### Step 1: 创建 api 目录

```bash
mkdir -p client/src/refactor_v2/api
```

### Step 2: 创建类型推导工具

```typescript
// client/src/refactor_v2/api/types.ts

import type { AppRouter } from "@/lib/trpc";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

// 从 tRPC Router 推导类型
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// 常用类型别名
export type StockQuote = RouterOutputs["stocks"]["getQuote"];
export type StockExtras = RouterOutputs["stocks"]["getExtras"];
export type StockDetail = RouterOutputs["stocks"]["getDetail"];
export type KlineData = RouterOutputs["stocks"]["getKline"];
export type TimelineData = RouterOutputs["stocks"]["getTimeline"];
export type GaugeScore = RouterOutputs["stocks"]["getGaugeScore"];
export type WatchlistItem = RouterOutputs["watchlist"]["list"][number];
export type MarketSentiment = RouterOutputs["market"]["getSentiment"];

// AI 相关
export type AIHistory = RouterOutputs["ai"]["getHistory"];
export type AISessions = RouterOutputs["ai"]["getSessions"];
```

### Step 3: 创建 stocks adapter

```typescript
// client/src/refactor_v2/api/stocks.ts

import { trpc } from "@/lib/trpc";
import { useMemo } from "react";
import type { ChartPeriod } from "@/refactor_v2/types";

// 股票行情 hook
export function useStockQuote(code: string | null) {
  return trpc.stocks.getQuote.useQuery(
    { code: code || "" },
    { enabled: !!code }
  );
}

// 股票扩展数据 hook（资金流、人气排名）
export function useStockExtras(code: string | null) {
  return trpc.stocks.getExtras.useQuery(
    { code: code || "" },
    {
      enabled: !!code,
      staleTime: 10 * 60 * 1000, // 10分钟缓存
      refetchOnWindowFocus: false,
    }
  );
}

// 股票详情聚合 hook
export function useStockDetail(code: string | null) {
  return trpc.stocks.getDetail.useQuery(
    { code: code || "" },
    { enabled: !!code }
  );
}

// K线数据 hook
export function useKlineData(
  code: string | null,
  period: "day" | "week" | "month" = "day",
  limit = 60
) {
  return trpc.stocks.getKline.useQuery(
    { code: code || "", period, limit },
    { enabled: !!code }
  );
}

// 分时数据 hook
export function useTimelineData(code: string | null, days = 1) {
  return trpc.stocks.getTimeline.useQuery(
    { code: code || "", days },
    { enabled: !!code }
  );
}

// Gauge 评分 hook
export function useGaugeScore(code: string | null) {
  return trpc.stocks.getGaugeScore.useQuery(
    { code: code || "" },
    {
      enabled: !!code,
      staleTime: 5 * 60 * 1000,
    }
  );
}

// 股票搜索 hook
export function useStockSearch(keyword: string) {
  return trpc.stocks.search.useQuery(
    { keyword },
    { enabled: keyword.length > 0 }
  );
}

// CenterTop 专用聚合 hook（组合多个接口）
export function useCenterTopModel(symbol: string | null) {
  const { data: quote, isLoading: quoteLoading } = useStockQuote(symbol);
  const { data: extras, isLoading: extrasLoading } = useStockExtras(symbol);

  const model = useMemo(() => {
    if (!quote) return null;

    return {
      symbol: symbol || "",
      name: quote.name || "",
      price: quote.price || 0,
      change: quote.change || 0,
      changePercent: quote.changePercent || 0,
      // 资金流（从 extras 获取，单位：亿）
      mainFlow: extras?.capitalFlow?.mainNetInflow
        ? extras.capitalFlow.mainNetInflow / 100000000
        : 0,
      // 从 quote 获取（如果有）
      turnoverRate: quote.turnoverRate || 0,
      // 振幅需要计算：(high - low) / preClose * 100
      amplitude:
        quote.high && quote.low && quote.preClose
          ? ((quote.high - quote.low) / quote.preClose) * 100
          : 0,
      // 人气排名
      hotRank: extras?.hotRank || null,
      xueqiuRank: extras?.xueqiuRank || null,
    };
  }, [symbol, quote, extras]);

  return {
    data: model,
    isLoading: quoteLoading || extrasLoading,
  };
}

// 图表数据 hook（根据周期自动选择 timeline 或 kline）
export function useChartData(symbol: string | null, period: ChartPeriod) {
  // 1D, 5D 用分时数据
  const days = period === "1D" ? 1 : period === "5D" ? 5 : 0;
  const useTimeline = days > 0;

  const timeline = useTimelineData(symbol, useTimeline ? days : 1);
  const kline = useKlineData(
    symbol,
    "day",
    periodToLimit(period)
  );

  // 根据周期选择数据源
  if (useTimeline) {
    return {
      data: timeline.data?.timeline?.map((item: any) => ({
        time: item.time,
        value: item.price || item.value,
        volume: item.volume,
      })),
      isLoading: timeline.isLoading,
      type: "timeline" as const,
    };
  }

  return {
    data: kline.data?.map((item: any) => ({
      time: typeof item.time === "string" ? new Date(item.time).getTime() / 1000 : item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    })),
    isLoading: kline.isLoading,
    type: "kline" as const,
  };
}

// 周期到 K 线条数的映射
function periodToLimit(period: ChartPeriod): number {
  switch (period) {
    case "1M": return 22;
    case "6M": return 132;
    case "YTD": return 250;
    case "1Y": return 252;
    case "5Y": return 1260;
    case "MAX": return 2000;
    default: return 60;
  }
}
```

### Step 4: 创建 watchlist adapter

```typescript
// client/src/refactor_v2/api/watchlist.ts

import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useWatchlist() {
  const utils = trpc.useUtils();
  
  const { data: watchlist, isLoading, error } = trpc.watchlist.list.useQuery();
  
  const addMutation = trpc.watchlist.add.useMutation({
    onSuccess: () => {
      utils.watchlist.list.invalidate();
    },
  });
  
  const removeMutation = trpc.watchlist.remove.useMutation({
    onSuccess: () => {
      utils.watchlist.list.invalidate();
    },
  });

  const addStock = useCallback(
    (stockCode: string, options?: { targetPrice?: string; note?: string }) => {
      return addMutation.mutateAsync({ stockCode, ...options });
    },
    [addMutation]
  );

  const removeStock = useCallback(
    (id: number) => {
      return removeMutation.mutateAsync({ id });
    },
    [removeMutation]
  );

  return {
    watchlist: watchlist || [],
    isLoading,
    error,
    addStock,
    removeStock,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
```

### Step 5: 创建 market adapter

```typescript
// client/src/refactor_v2/api/market.ts

import { trpc } from "@/lib/trpc";

export function useMarketSentiment() {
  return trpc.market.getSentiment.useQuery(undefined, {
    staleTime: 60 * 1000, // 1分钟
  });
}

export function useHotRankList(limit = 20) {
  return trpc.market.getHotRankList.useQuery({ limit });
}

export function useFundFlowRank(
  type: "today" | "3day" | "5day" | "10day" = "today",
  limit = 20
) {
  return trpc.market.getFundFlowRank.useQuery({ type, limit });
}
```

### Step 6: 创建 api/index.ts 导出

```typescript
// client/src/refactor_v2/api/index.ts

export * from "./types";
export * from "./stocks";
export * from "./watchlist";
export * from "./market";
```

### Step 7: 更新 CenterTop 使用真实 API

```typescript
// client/src/refactor_v2/components/CenterTop/index.tsx

import React, { useState } from "react";
import { useWatchlistStore } from "@/refactor_v2/stores/watchlist.store";
import { useCenterTopModel, useChartData } from "@/refactor_v2/api";
import type { ChartPeriod } from "@/refactor_v2/types";
import { StockHeader } from "./StockHeader";
import { BadgeCloud, generateBadges } from "./BadgeCloud";
import { FundsBar } from "./FundsBar";
import { StockChart } from "../StockChart";

export const CenterTop: React.FC = () => {
  const { currentSymbol } = useWatchlistStore();
  const [activePeriod, setActivePeriod] = useState<ChartPeriod>("1D");

  // 使用真实 API
  const { data: model, isLoading: modelLoading } = useCenterTopModel(currentSymbol);
  const { data: chartData, isLoading: chartLoading, type: chartType } = useChartData(
    currentSymbol,
    activePeriod
  );

  // Loading state
  if (modelLoading || !model) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--bg-primary)]">
        <span className="text-[var(--text-muted)]">加载中...</span>
      </div>
    );
  }

  const badges = generateBadges({
    mainFlow: model.mainFlow,
    hotRank: model.hotRank,
  });

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] p-4 gap-4">
      <StockHeader
        symbol={currentSymbol}
        quote={model}
        activePeriod={activePeriod}
        onPeriodChange={setActivePeriod}
      />

      <BadgeCloud badges={badges} />

      <FundsBar
        mainFlow={model.mainFlow}
        turnoverRate={model.turnoverRate}
        amplitude={model.amplitude}
      />

      <div className="flex-1 min-h-[420px] bg-[var(--bg-secondary)] rounded border border-[var(--panel-border)] overflow-hidden">
        {chartLoading ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            图表加载中...
          </div>
        ) : (
          <StockChart 
            data={chartData || []} 
            height={520}
            chartType={chartType}
          />
        )}
      </div>
    </div>
  );
};

export default CenterTop;
```

### Step 8: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] api/ 目录创建，包含 types, stocks, watchlist, market
- [ ] 类型使用 RouterOutputs 推导
- [ ] CenterTop 使用真实 API
- [ ] Loading 状态正确处理
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/api/types.ts`
- `client/src/refactor_v2/api/stocks.ts`
- `client/src/refactor_v2/api/watchlist.ts`
- `client/src/refactor_v2/api/market.ts`
- `client/src/refactor_v2/api/index.ts`
- `client/src/refactor_v2/components/CenterTop/index.tsx` (更新)
