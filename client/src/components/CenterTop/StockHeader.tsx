import React, { memo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { StockQuote } from "@/types";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface StockHeaderProps {
  quote: StockQuote;
}

export const StockHeader: React.FC<StockHeaderProps> = memo(
  function StockHeader({ quote }) {
    const isUp = quote.change >= 0;

    return (
      <div className="flex items-center gap-4 flex-wrap glass rounded-lg px-4 py-3">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {quote.name || quote.symbol}
          </h2>
          <span className="text-xs text-[var(--text-muted)] price-display">
            {quote.symbol}
          </span>
        </div>
        <div className="flex flex-col">
          <AnimatedNumber
            value={quote.price}
            decimals={2}
            prefix="¥"
            className="text-2xl font-bold text-[var(--text-primary)] price-display"
          />
          <span
            className={`flex items-center gap-1 text-sm ${
              isUp ? "text-[var(--color-up)]" : "text-[var(--color-down)]"
            }`}
          >
            {isUp ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <AnimatedNumber
              value={quote.change}
              decimals={2}
              prefix={isUp ? "+" : ""}
              className="price-display"
            />
            <span className="price-display">
              ({isUp ? "+" : ""}
              {quote.changePercent.toFixed(2)}%)
            </span>
          </span>
        </div>
      </div>
    );
  }
);
