# C-006: K线面板（Imperative 更新）

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- C-002 (Market Client)

## ⚠️ CRITICAL - 图表必须使用 imperative 更新

## 目标
- [ ] 创建 `components/panels/KLinePanel.tsx`
- [ ] 使用 Lightweight Charts
- [ ] 实现 imperative 更新（不经过 React state）
- [ ] 订阅实时数据

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 735-758 行
- `tasks/FutureShop/frontend-architecture-guide.md` 第 470-550 行

---

## 问题背景

图表更新通过 React state 中转会增加延迟，导致卡顿。

**解决方案**: 直接调用 Lightweight Charts API，不经过 React。

---

## 步骤

### Step 1: 确保安装依赖

```bash
pnpm add lightweight-charts
```

### Step 2: 创建 KLinePanel.tsx

```typescript
// client/src/refactor_v2/components/panels/KLinePanel.tsx

import React, { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
} from "lightweight-charts";
import { marketClient } from "../../realtime/marketClient";
import { useMarketStore } from "../../stores/market.store";
import type { PanelProps } from "../../types/panel";

/**
 * K线图面板
 * 
 * ⚠️ CRITICAL: 使用 imperative 更新
 * 图表更新直接调用 series.update()，不经过 React state
 */
export default function KLinePanel({ symbol }: PanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // 图表初始化
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建图表
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#0A0F1C" },
        textColor: "#94A3B8",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          color: "rgba(0, 245, 255, 0.4)",
        },
        horzLine: {
          color: "rgba(0, 245, 255, 0.4)",
        },
      },
    });

    // 创建 K 线序列
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00FF88",
      downColor: "#FF3366",
      borderUpColor: "#00FF88",
      borderDownColor: "#FF3366",
      wickUpColor: "#00FF88",
      wickDownColor: "#FF3366",
    });

    // 创建成交量序列
    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // 使用单独的价格轴
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // 响应容器大小变化
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // 加载历史数据
  useEffect(() => {
    const loadHistory = async () => {
      // 从 store 获取历史数据
      const klineHistory = useMarketStore.getState().klineHistory[symbol];

      if (klineHistory && candleSeriesRef.current) {
        const candleData: CandlestickData<Time>[] = klineHistory.map((k) => ({
          time: (k.time / 1000) as Time, // 转换为秒
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
        }));

        candleSeriesRef.current.setData(candleData);

        // 成交量数据
        if (volumeSeriesRef.current) {
          const volumeData = klineHistory.map((k) => ({
            time: (k.time / 1000) as Time,
            value: k.volume,
            color: k.close >= k.open ? "#00FF8866" : "#FF336666",
          }));
          volumeSeriesRef.current.setData(volumeData);
        }
      }
    };

    loadHistory();
  }, [symbol]);

  // ⚠️ CRITICAL: 订阅实时更新，使用 imperative 更新
  useEffect(() => {
    // 订阅行情
    marketClient.subscribe(symbol);

    // 订阅 tick 更新
    const unsubscribe = useMarketStore.subscribe(
      (state) => state.data[symbol],
      (tick) => {
        if (!tick || !candleSeriesRef.current) return;

        // ⚠️ 直接调用图表 API，不经过 React state
        const time = (Math.floor(tick.timestamp / 60000) * 60) as Time; // 分钟级别

        candleSeriesRef.current.update({
          time,
          open: tick.price, // 简化：实际应该维护 OHLC
          high: tick.price,
          low: tick.price,
          close: tick.price,
        });
      }
    );

    return () => {
      unsubscribe();
      marketClient.unsubscribe(symbol);
    };
  }, [symbol]);

  return (
    <div className="w-full h-full relative bg-gray-900">
      <div ref={containerRef} className="w-full h-full" />

      {/* TradingView 归属（Lightweight Charts 要求显示） */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-600 pointer-events-none">
        Powered by TradingView Lightweight Charts
      </div>
    </div>
  );
}
```

### Step 3: 创建 panels/index.ts

```typescript
// client/src/refactor_v2/components/panels/index.ts

export { default as KLinePanel } from "./KLinePanel";
```

### Step 4: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `KLinePanel.tsx` 已创建
- [ ] 使用 Lightweight Charts
- [ ] 实时更新使用 `series.update()` 而非 React state
- [ ] 订阅/取消订阅正确
- [ ] 有 TradingView 归属声明
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/panels/KLinePanel.tsx`
- `client/src/refactor_v2/components/panels/index.ts`
