import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { StockQuote } from "@/refactor_v2/types";
import { AnimatedNumber } from "@/refactor_v2/components/ui/AnimatedNumber";

interface StockHeaderProps {
  quote: StockQuote;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ quote }) => {
  const isUp = quote.change >= 0;

  return (
    <div className="flex items-center gap-4 flex-wrap glass rounded-lg px-4 py-3">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {quote.name || quote.symbol}
        </h2>
        <span className="text-xs text-[var(--text-muted)] font-mono">
          {quote.symbol}
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <AnimatedNumber
          value={quote.price}
          decimals={2}
          prefix="¥"
          className="text-2xl font-semibold text-[var(--text-primary)] price-display"
        />
        <span
          className={`flex items-center gap-1 text-sm price-display ${
            isUp ? "text-[var(--color-up)]" : "text-[var(--color-down)]"
          }`}
        >
          {isUp ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {isUp ? "+" : ""}
          <AnimatedNumber
            value={quote.change}
            decimals={2}
            className="font-semibold"
          />
          <span>
            ({isUp ? "+" : ""}
            {quote.changePercent.toFixed(2)}%)
          </span>
        </span>
      </div>
    </div>
  );
};
