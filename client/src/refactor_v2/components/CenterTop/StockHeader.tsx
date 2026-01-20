import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { StockQuote } from "@/refactor_v2/types";

interface StockHeaderProps {
  quote: StockQuote;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ quote }) => {
  const isUp = quote.change >= 0;

  return (
    <div className="flex items-center gap-4 flex-wrap glass rounded-lg px-4 py-3">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        {quote.name}
      </h2>
      <span className="text-lg text-[var(--text-secondary)] price-display">
        ¥{quote.price.toFixed(2)}
      </span>
      <div
        className={`flex items-center gap-1 price-display ${
          isUp ? "text-[var(--color-up)]" : "text-[var(--color-down)]"
        }`}
      >
        {isUp ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span>
          {isUp ? "+" : ""}
          {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
};
