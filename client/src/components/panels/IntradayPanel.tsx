/**
 * L-015: IntradayPanel - 分时面板
 * 开始时间: 2026-01-30 00:45:00
 *
 * 功能:
 * - 使用 lightweight-charts LineSeries 显示分时线
 * - 均价线 (黄色虚线)
 * - 成交量柱
 * - X轴固定 09:30-15:00 (A股交易时间)
 * - 休市区间 11:30-13:00 灰色背景标记
 * - 左侧显示开盘/最高/最低/收盘/涨跌幅
 */

import React, { useEffect, useRef, useMemo } from "react";
import {
  createChart,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
  ColorType,
} from "lightweight-charts";
import type { PanelProps } from "../../types/panel";
import { useTimelineData } from "../../api/stocks";

interface TimelinePoint {
  time: string;
  price: number;
  avgPrice: number;
  volume: number;
  amount: number;
  changePercent: number;
}

interface TimelineResponse {
  preClose: number;
  timeline: TimelinePoint[];
}

const IntradayPanel: React.FC<PanelProps> = ({ symbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const avgSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const { data, isLoading, error } = useTimelineData(symbol);
  const timelineData = data as TimelineResponse | undefined;

  const summary = useMemo(() => {
    if (!timelineData?.timeline?.length) return null;
    const timeline = timelineData.timeline;
    const preClose = timelineData.preClose || 0;
    const prices = timeline.map((t) => t.price);
    const open = prices[0];
    const close = prices[prices.length - 1];
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const change = close - preClose;
    const changePercent = preClose > 0 ? (change / preClose) * 100 : 0;
    return { open, high, low, close, change, changePercent, preClose };
  }, [timelineData]);

  useEffect(() => {
    if (!containerRef.current) return;

    const styles = getComputedStyle(document.documentElement);
    const bgPrimary = styles.getPropertyValue("--bg-primary").trim() || "#0A0F1C";
    const textMuted = styles.getPropertyValue("--text-muted").trim() || "#64748b";
    const colorUp = styles.getPropertyValue("--color-up").trim() || "#ef4444";
    const colorDown = styles.getPropertyValue("--color-down").trim() || "#10b981";
    const panelBorder = styles.getPropertyValue("--panel-border").trim() || "rgba(255,255,255,0.1)";

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: bgPrimary },
        textColor: textMuted,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      timeScale: {
        borderColor: panelBorder,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: Time) => {
          const ts = typeof time === "number" ? time * 1000 : 0;
          const d = new Date(ts);
          const h = d.getHours().toString().padStart(2, "0");
          const m = d.getMinutes().toString().padStart(2, "0");
          return `${h}:${m}`;
        },
      },
      rightPriceScale: {
        borderColor: panelBorder,
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(6, 182, 212, 0.4)" },
        horzLine: { color: "rgba(6, 182, 212, 0.4)" },
      },
    });

    const priceSeries = chart.addSeries(LineSeries, {
      color: colorUp,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const avgSeries = chart.addSeries(LineSeries, {
      color: "#facc15",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(100, 116, 139, 0.5)",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    priceSeriesRef.current = priceSeries;
    avgSeriesRef.current = avgSeries;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      avgSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!timelineData?.timeline?.length) return;
    if (!priceSeriesRef.current || !avgSeriesRef.current || !volumeSeriesRef.current) return;

    const styles = getComputedStyle(document.documentElement);
    const colorUp = styles.getPropertyValue("--color-up").trim() || "#ef4444";
    const colorDown = styles.getPropertyValue("--color-down").trim() || "#10b981";

    const timeline = timelineData.timeline;
    const preClose = timelineData.preClose || timeline[0]?.price || 0;

    const priceData: { time: Time; value: number }[] = [];
    const avgData: { time: Time; value: number }[] = [];
    const volumeData: { time: Time; value: number; color: string }[] = [];

    for (const point of timeline) {
      const ts = parseTimeString(point.time);
      if (!ts) continue;
      const time = (ts / 1000) as Time;
      priceData.push({ time, value: point.price });
      avgData.push({ time, value: point.avgPrice });

      const isUp = point.price >= preClose;
      volumeData.push({
        time,
        value: point.volume,
        color: isUp ? `${colorUp}80` : `${colorDown}80`,
      });
    }

    priceSeriesRef.current.setData(priceData);
    avgSeriesRef.current.setData(avgData);
    volumeSeriesRef.current.setData(volumeData);

    const isUp = (timeline[timeline.length - 1]?.price || 0) >= preClose;
    priceSeriesRef.current.applyOptions({
      color: isUp ? colorUp : colorDown,
    });

    if (chartRef.current && priceData.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [timelineData]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
          <span className="text-sm text-[var(--text-muted)]">加载分时数据...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--text-muted)]">加载失败</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-[var(--bg-primary)] flex">
      {summary && <SummaryPanel summary={summary} />}
      <div ref={containerRef} className="flex-1 h-full" />
      <div className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)] pointer-events-none">
        Powered by TradingView Lightweight Charts
      </div>
    </div>
  );
};

interface SummaryData {
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  preClose: number;
}

const SummaryPanel: React.FC<{ summary: SummaryData }> = ({ summary }) => {
  const isUp = summary.changePercent >= 0;
  const changeColor = isUp ? "var(--color-up)" : "var(--color-down)";
  const sign = isUp ? "+" : "";

  const rows = [
    { label: "昨收", value: summary.preClose.toFixed(2), color: "var(--text-secondary)" },
    { label: "开盘", value: summary.open.toFixed(2), color: summary.open >= summary.preClose ? "var(--color-up)" : "var(--color-down)" },
    { label: "最高", value: summary.high.toFixed(2), color: "var(--color-up)" },
    { label: "最低", value: summary.low.toFixed(2), color: "var(--color-down)" },
    { label: "最新", value: summary.close.toFixed(2), color: changeColor },
    { label: "涨跌", value: `${sign}${summary.change.toFixed(2)}`, color: changeColor },
    { label: "涨幅", value: `${sign}${summary.changePercent.toFixed(2)}%`, color: changeColor },
  ];

  return (
    <div
      className="flex-shrink-0 border-r px-3 py-2 text-xs font-mono"
      style={{
        borderColor: "var(--panel-border)",
        minWidth: "90px",
      }}
    >
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between py-0.5">
          <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
          <span style={{ color: row.color }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
};

function parseTimeString(timeStr: string): number | null {
  const match = timeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute)
  ).getTime();
}

export default IntradayPanel;
