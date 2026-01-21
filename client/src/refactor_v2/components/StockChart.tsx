import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useTheme } from "@/refactor_v2/contexts/ThemeContext";
import {
  Camera,
  Maximize2,
  LineChart,
  ChartCandlestick,
  GitCompare,
  MoreVertical,
  Calendar,
} from "lucide-react";
import type { ChartPeriod } from "@/refactor_v2/types";

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
  570,
  600,
  630,
  660,
  690,
  780,
  810,
  840,
  870,
  900,
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
    value: number; // for line/area
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

  const defaultChartType = getDefaultChartType(activePeriod);
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [isChartTypePinned, setIsChartTypePinned] = useState(false);
  const effectiveChartType = isChartTypePinned ? chartType : defaultChartType;
  const isLineChart = effectiveChartType === "line";
  const { theme } = useTheme();
  const isIntraday = activePeriod === "1D";

  const handleChartTypeChange = (nextType: ChartType) => {
    setChartType(nextType);
    setIsChartTypePinned(nextType !== defaultChartType);
  };

  const filteredData = useMemo(() => {
    if (!isIntraday) return data;
    return data.filter(point =>
      isTradingMinute(getLocalMinutes(point.time))
    );
  }, [data, isIntraday]);

  const dataByTime = useMemo(() => {
    const map = new Map<number, StockChartProps["data"][number]>();
    filteredData.forEach(point => {
      map.set(point.time, point);
    });
    return map;
  }, [filteredData]);

  // Tooltip state
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

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Define colors based on theme
    const isDark = theme === "dark";
    const backgroundColor = "transparent";
    const lineColor = "#ef4444"; // Red color for the main line as in the screenshot
    const areaTopColor = isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.2)";
    const areaBottomColor = isDark ? "rgba(239, 68, 68, 0)" : "rgba(239, 68, 68, 0)";
    const textColor = isDark ? "#9ca3af" : "#4b5563";
    const gridColor = isDark ? "#1f2937" : "#e5e7eb";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || height,
      grid: {
        vertLines: { color: gridColor, style: 1 }, // Dotted style
        horzLines: { color: gridColor, style: 1 },
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          width: 1,
          color: "#6b7280",
          style: 3, // Dashed
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
        tickMarkFormatter: isIntraday
          ? (time: Time) => {
            if (typeof time !== "number") return "";
            const minutes = getLocalMinutes(time);
            if (!INTRADAY_TICK_MINUTES.has(minutes)) return "";
            return formatMinutesLabel(minutes);
          }
          : undefined,
      },
      rightPriceScale: {
        borderColor: gridColor,
        scaleMargins: {
          top: 0.2, // Leave space for top info
          bottom: 0.2, // Leave space for volume
        },
      },
      localization: isIntraday
        ? {
          timeFormatter: (time: Time) => {
            if (typeof time !== "number") return "";
            return formatMinutesLabel(getLocalMinutes(time));
          },
        }
        : undefined,
    });

    chartRef.current = chart;

    // Add series based on chart type
    if (isLineChart) {
      // Line/Area chart for 1D/5D
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: lineColor,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
        lineWidth: 2,
        priceLineVisible: false,
      });
      areaSeriesRef.current = areaSeries;
      candlestickSeriesRef.current = null;
    } else {
      // Candlestick chart for 1M/6M/YTD/1Y/5Y/MAX
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#ef4444", // A股: 红涨
        downColor: "#10b981", // A股: 绿跌
        borderVisible: false,
        wickUpColor: "#ef4444",
        wickDownColor: "#10b981",
      });
      candlestickSeriesRef.current = candlestickSeries;
      areaSeriesRef.current = null;
    }

    // Add Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // Overlay on the same scale but positioned at bottom
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Set Data based on chart type
    if (isLineChart && areaSeriesRef.current) {
      const formattedData = filteredData.map((d) => ({
        time: d.time as Time,
        value: d.close || d.value,
      }));
      areaSeriesRef.current.setData(formattedData);
    } else if (!isLineChart && candlestickSeriesRef.current) {
      const candleData = filteredData.map((d) => ({
        time: d.time as Time,
        open: d.open || d.value,
        high: d.high || d.value,
        low: d.low || d.value,
        close: d.close || d.value,
      }));
      candlestickSeriesRef.current.setData(candleData);
    }

    const volumeData = filteredData.map((d) => ({
      time: d.time as Time,
      value: d.volume || 0,
      color: (d.close || d.value) >= (d.open || d.value)
        ? "rgba(239, 68, 68, 0.6)"
        : "rgba(16, 185, 129, 0.6)",
    }));
    volumeSeries.setData(volumeData);

    // Fit Content
    chart.timeScale().fitContent();

    // Tooltip Logic
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current!.clientHeight
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
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!chartContainerRef.current) return;
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight || height,
      });
      chart.timeScale().fitContent();
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [dataByTime, filteredData, height, isIntraday, theme, isLineChart]);

  return (
    <div className="relative w-full h-full" ref={chartContainerRef}>
      {/* Chart Toolbar */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)]/80 backdrop-blur-md border border-solid border-[var(--panel-border)] rounded-lg p-1 shadow-[var(--shadow-md)] overflow-hidden">
          <div className="flex items-center gap-1 rounded-md">
            {PERIODS.map(period => (
              <button
                key={period}
                onClick={() => onPeriodChange?.(period)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${activePeriod === period
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
              className={`p-1.5 rounded-md transition-colors ${effectiveChartType === "line"
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              title="线图"
              onClick={() => handleChartTypeChange("line")}
            >
              <LineChart className="w-4 h-4" />
            </button>
            <button
              className={`p-1.5 rounded-md transition-colors ${effectiveChartType === "candlestick"
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
            left: tooltipData.x + 20 > (chartContainerRef.current?.clientWidth || 0) - 200 ? tooltipData.x - 180 : tooltipData.x + 20,
            top: tooltipData.y,
          }}
        >
          <div className="text-[var(--text-muted)] mb-1">{tooltipData.time}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-[var(--text-secondary)]">关闭</span>
            <span className="text-right font-mono text-[var(--text-primary)]">¥{tooltipData.price.toFixed(2)}</span>

            {tooltipData.open && (
              <>
                <span className="text-[var(--text-secondary)]">打开</span>
                <span className="text-right font-mono text-[var(--text-primary)]">¥{tooltipData.open.toFixed(2)}</span>
              </>
            )}

            {tooltipData.high && (
              <>
                <span className="text-[var(--text-secondary)]">高</span>
                <span className="text-right font-mono text-[var(--text-primary)]">¥{tooltipData.high.toFixed(2)}</span>
              </>
            )}

            {tooltipData.low && (
              <>
                <span className="text-[var(--text-secondary)]">最低</span>
                <span className="text-right font-mono text-[var(--text-primary)]">¥{tooltipData.low.toFixed(2)}</span>
              </>
            )}

            {tooltipData.volume && (
              <>
                <span className="text-[var(--text-secondary)]">成交量</span>
                <span className="text-right font-mono text-[var(--text-primary)]">{tooltipData.volume.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>
      )
      }
    </div >
  );
};
