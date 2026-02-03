/**
 * L-015: IndicatorsPanel - 指标面板
 * 开始时间: 2026-01-30 00:45:00
 * 更新: 卡片式布局，横向滚动，指标状态高亮
 */

import React, { useMemo } from "react";
import type { PanelProps } from "../../types/panel";
import { useMarketStore } from "../../stores/market.store";
import type { StockInfo } from "../../types/market";

type IndicatorStatus = "low" | "normal" | "high" | "good" | "warn";

interface IndicatorConfig {
  key: keyof StockInfo | "custom";
  label: string;
  format: (info: StockInfo) => string;
  getStatus: (info: StockInfo) => IndicatorStatus;
  getStatusLabel: (info: StockInfo) => string;
}

const indicatorConfigs: IndicatorConfig[] = [
  {
    key: "pe",
    label: "PE (TTM)",
    format: (info) => info.pe?.toFixed(2) ?? "--",
    getStatus: (info) => {
      if (!info.pe) return "normal";
      if (info.pe < 15) return "low";
      if (info.pe > 30) return "high";
      return "normal";
    },
    getStatusLabel: (info) => {
      if (!info.pe) return "";
      if (info.pe < 15) return "低估";
      if (info.pe > 30) return "高估";
      return "正常";
    },
  },
  {
    key: "pb",
    label: "PB",
    format: (info) => info.pb?.toFixed(2) ?? "--",
    getStatus: (info) => {
      if (!info.pb) return "normal";
      if (info.pb < 1.5) return "low";
      if (info.pb > 5) return "high";
      return "normal";
    },
    getStatusLabel: (info) => {
      if (!info.pb) return "";
      if (info.pb < 1.5) return "低估";
      if (info.pb > 5) return "高估";
      return "正常";
    },
  },
  {
    key: "roe",
    label: "ROE",
    format: (info) => (info.roe != null ? `${info.roe.toFixed(2)}%` : "--"),
    getStatus: (info) => {
      if (!info.roe) return "normal";
      if (info.roe > 15) return "good";
      return "normal";
    },
    getStatusLabel: (info) => {
      if (!info.roe) return "";
      if (info.roe > 15) return "优质";
      return "正常";
    },
  },
  {
    key: "marketCap",
    label: "市值",
    format: (info) =>
      info.marketCap ? `${(info.marketCap / 1e8).toFixed(0)}亿` : "--",
    getStatus: () => "normal",
    getStatusLabel: () => "",
  },
  {
    key: "floatMarketCap",
    label: "流通市值",
    format: (info) =>
      info.floatMarketCap ? `${(info.floatMarketCap / 1e8).toFixed(0)}亿` : "--",
    getStatus: () => "normal",
    getStatusLabel: () => "",
  },
  {
    key: "turnoverRate",
    label: "换手率",
    format: (info) =>
      info.turnoverRate != null ? `${info.turnoverRate.toFixed(2)}%` : "--",
    getStatus: (info) => {
      if (!info.turnoverRate) return "normal";
      if (info.turnoverRate > 10) return "warn";
      return "normal";
    },
    getStatusLabel: (info) => {
      if (!info.turnoverRate) return "";
      if (info.turnoverRate > 10) return "高换手";
      return "正常";
    },
  },
  {
    key: "volumeRatio",
    label: "量比",
    format: (info) => info.volumeRatio?.toFixed(2) ?? "--",
    getStatus: (info) => {
      if (!info.volumeRatio) return "normal";
      if (info.volumeRatio > 3) return "warn";
      return "normal";
    },
    getStatusLabel: (info) => {
      if (!info.volumeRatio) return "";
      if (info.volumeRatio > 3) return "放量";
      return "正常";
    },
  },
  {
    key: "dividendYield",
    label: "股息率",
    format: (info) =>
      info.dividendYield != null ? `${info.dividendYield.toFixed(2)}%` : "--",
    getStatus: (info) => {
      if (!info.dividendYield) return "normal";
      if (info.dividendYield > 3) return "good";
      return "normal";
    },
    getStatusLabel: (info) => {
      if (!info.dividendYield) return "";
      if (info.dividendYield > 3) return "高息";
      return "正常";
    },
  },
];

const statusColors: Record<IndicatorStatus, string> = {
  low: "var(--color-success, #22c55e)",
  good: "var(--color-success, #22c55e)",
  normal: "var(--color-text-secondary, #9ca3af)",
  high: "var(--color-danger, #ef4444)",
  warn: "var(--color-warning, #eab308)",
};

const statusBgColors: Record<IndicatorStatus, string> = {
  low: "rgba(34, 197, 94, 0.15)",
  good: "rgba(34, 197, 94, 0.15)",
  normal: "transparent",
  high: "rgba(239, 68, 68, 0.15)",
  warn: "rgba(234, 179, 8, 0.15)",
};

const IndicatorsPanel: React.FC<PanelProps> = ({ symbol }) => {
  const info = useMarketStore((s) => s.stockInfo[symbol]);

  const defaultInfo: StockInfo = useMemo(
    () => ({
      symbol,
      name: "",
      exchange: "",
      industry: "",
    }),
    [symbol]
  );

  const safeInfo = info ?? defaultInfo;

  return (
    <div
      className="h-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
      style={{
        padding: "var(--spacing-md, 16px)",
      }}
    >
      <div
        className="flex gap-3"
        style={{ minWidth: "max-content" }}
      >
        {indicatorConfigs.map((config) => (
          <IndicatorCard key={config.key} config={config} info={safeInfo} />
        ))}
      </div>
    </div>
  );
};

interface IndicatorCardProps {
  config: IndicatorConfig;
  info: StockInfo;
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({ config, info }) => {
  const status = config.getStatus(info);
  const statusLabel = config.getStatusLabel(info);
  const value = config.format(info);

  return (
    <div
      className="flex-shrink-0 rounded-lg border transition-all hover:border-opacity-80"
      style={{
        width: "100px",
        padding: "var(--spacing-sm, 12px)",
        backgroundColor: "var(--color-surface, rgba(31, 41, 55, 0.4))",
        borderColor: "var(--color-border, rgba(75, 85, 99, 0.5))",
      }}
    >
      <div
        className="text-[10px] uppercase tracking-widest mb-2"
        style={{ color: "var(--color-text-muted, #6b7280)" }}
      >
        {config.label}
      </div>
      <div
        className="text-base font-bold mb-1"
        style={{ color: statusColors[status] }}
      >
        {value}
      </div>
      {statusLabel && (
        <div
          className="text-[10px] px-1.5 py-0.5 rounded inline-block"
          style={{
            color: statusColors[status],
            backgroundColor: statusBgColors[status],
          }}
        >
          {statusLabel}
        </div>
      )}
    </div>
  );
};

export default IndicatorsPanel;
