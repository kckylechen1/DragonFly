import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  Time,
  MouseEventParams,
  ISeriesApi,
  AreaSeries,
  HistogramSeries,
  CandlestickSeries,
} from "lightweight-charts";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Camera,
  Maximize2,
  LineChart,
  ChartCandlestick,
  GitCompare,
  MoreVertical,
  Calendar,
} from "lucide-react";
import type { ChartPeriod } from "@/types";

const PERIODS: ChartPeriod[] = [
  "1D",
  "5D",
  "1M",
  "6M",
  "YTD",
  "1Y",
  "5Y",
  "MAX",
];

const INTRADAY_TICK_MINUTES = new Set([
  570, 600, 630, 660, 690, 780, 810, 840, 870, 900,
]);

const TRADING_SESSIONS = [
  { start: 9 * 60 + 30, end: 11 * 60 + 30 },
  { start: 13 * 60, end: 15 * 60 },
];

type ChartType = "line" | "candlestick";

const getDefaultChartType = (period: ChartPeriod): ChartType =>
  period === "1D" || period === "5D" ? "line" : "candlestick";

const getLocalMinutes = (timestampSeconds: number) => {
  const date = new Date(timestampSeconds * 1000);
  return date.getHours() * 60 + date.getMinutes();
};

const formatMinutesLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
};

const isTradingMinute = (minutes: number) =>
  TRADING_SESSIONS.some(
    session => minutes >= session.start && minutes <= session.end
  );

interface StockChartProps {
  data: {
    time: number;
    value: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }[];
  height?: number;
  activePeriod?: ChartPeriod;
  onPeriodChange?: (period: ChartPeriod) => void;
}

export const StockChart: React.FC<StockChartProps> = ({
  data,
  height = 400,
  activePeriod = "1D",
  onPeriodChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const defaultChartType = getDefaultChartType(activePeriod);
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [isChartTypePinned, setIsChartTypePinned] = useState(false);
  const effectiveChartType = isChartTypePinned ? chartType : defaultChartType;
  const isLineChart = effectiveChartType === "line";
  const { theme } = useTheme();
  const isIntraday = activePeriod === "1D";

  const handleChartTypeChange = useCallback((nextType: ChartType) => {
    setChartType(nextType);
    setIsChartTypePinned(nextType !== getDefaultChartType(activePeriod));
  }, [activePeriod]);

  const filteredData = useMemo(() => {
    if (!isIntraday) return data;
    return data.filter(point => isTradingMinute(getLocalMinutes(point.time)));
  }, [data, isIntraday]);

  const dataByTime = useMemo(() => {
    const map = new Map<number, StockChartProps["data"][number]>();
    filteredData.forEach(point => {
      map.set(point.time, point);
    });
    return map;
  }, [filteredData]);

  const [tooltipData, setTooltipData] = useState<{
    time: string;
    price: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    x: number;
    y: number;
    visible: boolean;
  } | null>(null);

  // 1. 创建图表 (只在 mount 时创建一次)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === "dark";
    const backgroundColor = "transparent";
    const textColor = isDark ? "#9ca3af" : "#4b5563";
    const gridColor = isDark ? "#1f2937" : "#e5e7eb";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: gridColor, style: 1 },
        horzLines: { color: gridColor, style: 1 },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: "#6b7280",
          style: 3,
          labelBackgroundColor: "#4b5563",
        },
        horzLine: {
          width: 1,
          color: "#6b7280",
          style: 3,
          labelBackgroundColor: "#4b5563",
        },
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        minBarSpacing: 3,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      rightPriceScale: {
        borderColor: gridColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // ResizeObserver - 只更新尺寸，不调用 fitContent
    const resizeObserver = new ResizeObserver(entries => {
      if (!chartContainerRef.current || !chartRef.current) return;
      const { width, height: containerHeight } = entries[0].contentRect;
      if (width > 0 && containerHeight > 0) {
        chartRef.current.applyOptions({
          width,
          height: containerHeight,
        });
      }
    });
    resizeObserver.observe(chartContainerRef.current);
    resizeObserverRef.current = resizeObserver;

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      areaSeriesRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [theme, height]);

  // 2. 更新 timeScale 配置 (当 period 变化时)
  useEffect(() => {
    if (!chartRef.current) return;

    const isDark = theme === "dark";
    const gridColor = isDark ? "#1f2937" : "#e5e7eb";

    chartRef.current.timeScale().applyOptions({
      borderColor: gridColor,
      timeVisible: isIntraday,
      secondsVisible: false,
    });

    if (isIntraday) {
      chartRef.current.applyOptions({
        localization: {
          timeFormatter: (time: Time) => {
            if (typeof time !== "number") return "";
            return formatMinutesLabel(getLocalMinutes(time));
          },
        },
      });
    }
  }, [isIntraday, theme]);

  // 3. 管理 series (当图表类型变化时重建 series)
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;
    const lineColor = "#ef4444";
    const isDark = theme === "dark";
    const areaTopColor = isDark
      ? "rgba(239, 68, 68, 0.2)"
      : "rgba(239, 68, 68, 0.2)";
    const areaBottomColor = isDark
      ? "rgba(239, 68, 68, 0)"
      : "rgba(239, 68, 68, 0)";

    // 移除旧 series
    if (areaSeriesRef.current) {
      chart.removeSeries(areaSeriesRef.current);
      areaSeriesRef.current = null;
    }
    if (candlestickSeriesRef.current) {
      chart.removeSeries(candlestickSeriesRef.current);
      candlestickSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      chart.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    // 创建新 series
    if (isLineChart) {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: lineColor,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
        lineWidth: 2,
        priceLineVisible: false,
      });
      areaSeriesRef.current = areaSeries;
    } else {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#ef4444",
        downColor: "#10b981",
        borderVisible: false,
        wickUpColor: "#ef4444",
        wickDownColor: "#10b981",
      });
      candlestickSeriesRef.current = candlestickSeries;
    }

    // Volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;
  }, [isLineChart, theme]);

  // 4. 更新数据 (当 filteredData 或 series 类型变化时)
  useEffect(() => {
    if (!chartRef.current) return;
    if (filteredData.length === 0) return;

    // 设置价格数据
    if (isLineChart && areaSeriesRef.current) {
      const formattedData = filteredData.map(d => ({
        time: d.time as Time,
        value: d.close || d.value,
      }));
      areaSeriesRef.current.setData(formattedData);
    } else if (!isLineChart && candlestickSeriesRef.current) {
      const candleData = filteredData.map(d => ({
        time: d.time as Time,
        open: d.open || d.value,
        high: d.high || d.value,
        low: d.low || d.value,
        close: d.close || d.value,
      }));
      candlestickSeriesRef.current.setData(candleData);
    }

    // 设置成交量数据
    if (volumeSeriesRef.current) {
      const volumeData = filteredData.map(d => ({
        time: d.time as Time,
        value: d.volume || 0,
        color:
          (d.close || d.value) >= (d.open || d.value)
            ? "rgba(239, 68, 68, 0.5)"
            : "rgba(16, 185, 129, 0.5)",
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    // 只在数据首次加载或 period 切换时 fitContent
    chartRef.current.timeScale().fitContent();
  }, [filteredData, isLineChart]);

  // 5. Crosshair tooltip
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;
    const handleCrosshairMove = (param: MouseEventParams) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > (chartContainerRef.current?.clientWidth || 0) ||
        param.point.y < 0 ||
        param.point.y > (chartContainerRef.current?.clientHeight || 0)
      ) {
        setTooltipData(null);
      } else {
        const dataPoint =
          typeof param.time === "number"
            ? dataByTime.get(param.time)
            : undefined;
        if (dataPoint) {
          const tooltipTime = isIntraday
            ? formatMinutesLabel(getLocalMinutes(dataPoint.time))
            : new Date(dataPoint.time * 1000).toLocaleString("zh-CN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
          setTooltipData({
            time: tooltipTime,
            price: dataPoint.close || dataPoint.value,
            open: dataPoint.open,
            high: dataPoint.high,
            low: dataPoint.low,
            close: dataPoint.close,
            volume: dataPoint.volume,
            x: param.point.x,
            y: param.point.y,
            visible: true,
          });
        }
      }
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);
    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [dataByTime, isIntraday]);

  return (
    <div className="relative w-full h-full">
      {/* Chart Container - 必须有明确的高度 */}
      <div
        ref={chartContainerRef}
        className="absolute inset-0"
        style={{ minHeight: height }}
      />

      {/* Chart Toolbar */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)]/80 backdrop-blur-md border border-solid border-[var(--panel-border)] rounded-lg p-1 shadow-[var(--shadow-md)] overflow-hidden">
          <div className="flex items-center gap-1 rounded-md">
            {PERIODS.map(period => (
              <button
                key={period}
                onClick={() => onPeriodChange?.(period)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  activePeriod === period
                    ? "bg-[var(--accent-primary)] text-white font-medium"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <button
            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="选择日期"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-6 bg-[var(--panel-border)]/80" />

          <div className="flex items-center gap-1">
            <button
              className={`p-1.5 rounded-md transition-colors ${
                effectiveChartType === "line"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
              }`}
              title="线图"
              onClick={() => handleChartTypeChange("line")}
            >
              <LineChart className="w-4 h-4" />
            </button>
            <button
              className={`p-1.5 rounded-md transition-colors ${
                effectiveChartType === "candlestick"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
              }`}
              title="K线"
              onClick={() => handleChartTypeChange("candlestick")}
            >
              <ChartCandlestick className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-[var(--panel-border)]/80" />

          <button className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <div className="flex items-center gap-1 text-xs">
              <GitCompare className="w-3.5 h-3.5" />
              比较
            </div>
          </button>
          <button className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Camera className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && tooltipData.visible && (
        <div
          className="absolute z-20 bg-[var(--panel-bg)]/90 backdrop-blur-sm border border-[var(--panel-border)] rounded-lg p-3 shadow-lg pointer-events-none text-xs"
          style={{
            left:
              tooltipData.x + 20 >
              (chartContainerRef.current?.clientWidth || 0) - 200
                ? tooltipData.x - 180
                : tooltipData.x + 20,
            top: tooltipData.y,
          }}
        >
          <div className="text-[var(--text-muted)] mb-1">{tooltipData.time}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-[var(--text-secondary)]">收盘</span>
            <span className="text-right font-mono text-[var(--text-primary)]">
              ¥{tooltipData.price.toFixed(2)}
            </span>

            {tooltipData.open !== undefined && (
              <>
                <span className="text-[var(--text-secondary)]">开盘</span>
                <span className="text-right font-mono text-[var(--text-primary)]">
                  ¥{tooltipData.open.toFixed(2)}
                </span>
              </>
            )}

            {tooltipData.high !== undefined && (
              <>
                <span className="text-[var(--text-secondary)]">最高</span>
                <span className="text-right font-mono text-[var(--text-primary)]">
                  ¥{tooltipData.high.toFixed(2)}
                </span>
              </>
            )}

            {tooltipData.low !== undefined && (
              <>
                <span className="text-[var(--text-secondary)]">最低</span>
                <span className="text-right font-mono text-[var(--text-primary)]">
                  ¥{tooltipData.low.toFixed(2)}
                </span>
              </>
            )}

            {tooltipData.volume !== undefined && (
              <>
                <span className="text-[var(--text-secondary)]">成交量</span>
                <span className="text-right font-mono text-[var(--text-primary)]">
                  {tooltipData.volume.toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
