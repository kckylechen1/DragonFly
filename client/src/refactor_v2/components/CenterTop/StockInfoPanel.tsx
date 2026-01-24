import React from "react";
import type { StockQuote } from "@/refactor_v2/types";

interface CapitalFlow {
  mainNetInflow?: number | null;
  superLargeNetInflow?: number | null;
  largeNetInflow?: number | null;
  mediumNetInflow?: number | null;
  smallNetInflow?: number | null;
}

interface StockInfoPanelProps {
  quote: StockQuote;
  capitalFlow?: CapitalFlow | null;
}

export const StockInfoPanel: React.FC<StockInfoPanelProps> = ({
  quote,
  capitalFlow,
}) => {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--bg-secondary)] p-3 text-xs">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <DataCellInline
          label="主力净流入"
          value={formatFundFlow(capitalFlow?.mainNetInflow)}
          isUp={resolveDirection(capitalFlow?.mainNetInflow)}
        />
        <DataCellInline
          label="超大单"
          value={formatFundFlow(capitalFlow?.superLargeNetInflow)}
          isUp={resolveDirection(capitalFlow?.superLargeNetInflow)}
        />
        <DataCellInline
          label="大单"
          value={formatFundFlow(capitalFlow?.largeNetInflow)}
          isUp={resolveDirection(capitalFlow?.largeNetInflow)}
        />
        <DataCellInline
          label="换手率"
          value={
            typeof quote.turnoverRate === "number"
              ? `${quote.turnoverRate.toFixed(2)}%`
              : "--"
          }
        />
        <DataCellInline
          label="量比"
          value={
            typeof quote.volumeRatio === "number"
              ? quote.volumeRatio.toFixed(2)
              : "--"
          }
          isUp={resolveDirection(quote.volumeRatio)}
        />
      </div>

      <div className="border-t border-[var(--panel-border)] pt-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <DataCellInline
            label="今开"
            value={formatPrice(quote.open)}
            isUp={
              quote.open && quote.prevClose
                ? quote.open > quote.prevClose
                : undefined
            }
          />
          <DataCellInline label="昨收" value={formatPrice(quote.prevClose)} />
          <DataCellInline label="最高" value={formatPrice(quote.high)} />
          <DataCellInline label="最低" value={formatPrice(quote.low)} />
          <DataCellInline label="成交量" value={formatVolume(quote.volume)} />
          <DataCellInline label="成交额" value={formatAmount(quote.amount)} />
          <DataCellInline
            label="市盈率"
            value={formatNumber(quote.pe)}
          />
          <DataCellInline
            label="总市值"
            value={formatMarketCap(quote.marketCap)}
          />
          <DataCellInline
            label="流通市值"
            value={formatMarketCap(quote.circulationMarketCap)}
          />
        </div>
      </div>
    </div>
  );
};

function splitNumeric(value?: string): { num: string; rest: string } {
  if (!value) return { num: "--", rest: "" };
  const match = value.match(/^([+-]?[0-9.,]+)(.*)$/);
  if (!match) return { num: value, rest: "" };
  return { num: match[1], rest: match[2] };
}

function DataCellInline({
  label,
  value,
  isUp,
}: {
  label: string;
  value?: string;
  isUp?: boolean;
}) {
  let valueColor = "text-[var(--text-primary)]";
  if (isUp === true) valueColor = "text-[var(--color-up)]";
  if (isUp === false) valueColor = "text-[var(--color-down)]";

  const { num, rest } = splitNumeric(value);

  return (
    <span className="whitespace-nowrap">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`ml-1 ${valueColor}`}>
        <span className="price-display">{num}</span>
        {rest && <span>{rest}</span>}
      </span>
    </span>
  );
}

function resolveDirection(value?: number | null) {
  if (value === null || value === undefined) return undefined;
  return value > 0 ? true : value < 0 ? false : undefined;
}

function formatPrice(value?: number) {
  if (value === null || value === undefined) return "--";
  return value.toFixed(2);
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "--";
  return Number.isFinite(value) ? value.toFixed(2) : "--";
}

function formatVolume(volume?: number) {
  if (!volume) return "--";
  if (volume >= 100000000) {
    return `${(volume / 100000000).toFixed(2)}亿手`;
  }
  if (volume >= 10000) {
    return `${(volume / 10000).toFixed(2)}万手`;
  }
  return `${volume}手`;
}

function formatAmount(amount?: number) {
  if (!amount) return "--";
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}亿`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`;
  }
  return `${amount}元`;
}

function formatFundFlow(amount?: number | null) {
  if (amount == null || Number.isNaN(amount)) return "--";
  const value = amount / 100000000;
  if (Number.isNaN(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}亿`;
}

function formatMarketCap(cap?: number | null) {
  if (!cap) return "--";
  if (cap >= 100000000) {
    return `${(cap / 100000000).toFixed(2)}亿`;
  }
  if (cap >= 10000) {
    return `${(cap / 10000).toFixed(2)}万`;
  }
  return `${cap}元`;
}
