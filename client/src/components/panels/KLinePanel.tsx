/**
 * K线面板（Imperative 更新）
 *
 * 负责人: 🟢 Codex
 * ⏱️ 开始时间: 2026-01-30 00:00
 *
 * ⚠️ CRITICAL: 使用 imperative 更新
 * 图表更新直接调用 series.update()，不经过 React state
 */

import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";
import { marketClient } from "../../realtime/marketClient";
import { useMarketStore } from "../../stores/market.store";
import type { PanelProps } from "../../types/panel";

// A股颜色：红涨绿跌
const COLORS = {
  up: "#ef4444", // 红色 - 涨
  upBorder: "#ef4444",
  upWick: "#ef4444",
  down: "#10b981", // 绿色 - 跌
  downBorder: "#10b981",
  downWick: "#10b981",
  bg: "#0A0F1C",
  text: "#94A3B8",
  grid: "rgba(255, 255, 255, 0.05)",
  crosshair: "rgba(6, 182, 212, 0.4)",
};

export default function KLinePanel({ symbol }: PanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 图表初始化
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建图表
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: COLORS.bg },
        textColor: COLORS.text,
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
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
          color: COLORS.crosshair,
        },
        horzLine: {
          color: COLORS.crosshair,
        },
      },
    });

    // 创建 K 线序列 (v5 API) - A股颜色：红涨绿跌
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.up,
      downColor: COLORS.down,
      borderUpColor: COLORS.upBorder,
      borderDownColor: COLORS.downBorder,
      wickUpColor: COLORS.upWick,
      wickDownColor: COLORS.downWick,
    });

    // 创建成交量序列 (v5 API)
    const volumeSeries = chart.addSeries(HistogramSeries, {
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
    const resizeObserver = new ResizeObserver(entries => {
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

  // 加载历史数据 - 使用订阅模式确保数据更新时重新渲染
  useEffect(() => {
    const renderChart = (klineHistory: any[]) => {
      if (
        !klineHistory ||
        klineHistory.length === 0 ||
        !candleSeriesRef.current
      ) {
        setIsLoading(true);
        return;
      }

      const candleData: CandlestickData<Time>[] = klineHistory.map(k => ({
        time: (k.time / 1000) as Time, // 转换为秒
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }));

      candleSeriesRef.current.setData(candleData);

      // 成交量数据 - A股颜色：红涨绿跌
      if (volumeSeriesRef.current) {
        const volumeData = klineHistory.map(k => ({
          time: (k.time / 1000) as Time,
          value: k.volume,
          color:
            k.close >= k.open
              ? "rgba(239, 68, 68, 0.6)"
              : "rgba(16, 185, 129, 0.6)",
        }));
        volumeSeriesRef.current.setData(volumeData);
      }
      setIsLoading(false);
    };

    // 初始加载
    const initialHistory = useMarketStore.getState().klineHistory[symbol];
    renderChart(initialHistory);

    // 订阅 klineHistory 变化
    const unsubscribe = useMarketStore.subscribe(
      state => state.klineHistory[symbol],
      klineHistory => {
        console.log("[KLinePanel] Kline data updated:", klineHistory?.length);
        renderChart(klineHistory);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [symbol]);

  // ⚠️ CRITICAL: 订阅实时更新，使用 imperative 更新
  // ⚠️ Oracle P0: 使用 selector 订阅避免全 store 更新触发回调
  useEffect(() => {
    // 订阅行情
    marketClient.subscribe(symbol);

    // 订阅 tick 更新 (带 selector 优化)
    const unsubscribe = useMarketStore.subscribe(
      state => state.data[symbol],
      (tick, prevTick) => {
        if (!tick || !candleSeriesRef.current) return;
        if (tick.timestamp === prevTick?.timestamp) return;

        // ⚠️ 直接调用图表 API，不经过 React state
        const time = (Math.floor(tick.timestamp / 60000) * 60) as Time; // 分钟级别

        candleSeriesRef.current.update({
          time,
          open: tick.price, // 简化：实际应该维护 OHLC
          high: tick.price,
          low: tick.price,
          close: tick.price,
        });
      },
      {
        equalityFn: (a, b) => a?.timestamp === b?.timestamp,
      }
    );

    return () => {
      unsubscribe();
      marketClient.unsubscribe(symbol);
    };
  }, [symbol]);

  return (
    <div className="w-full h-full relative bg-[var(--bg-primary)]">
      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)] z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
            <span className="text-sm text-[var(--text-muted)]">
              加载图表数据...
            </span>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />

      {/* TradingView 归属（Lightweight Charts 要求显示） */}
      <div className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)] pointer-events-none">
        Powered by TradingView Lightweight Charts
      </div>
    </div>
  );
}
