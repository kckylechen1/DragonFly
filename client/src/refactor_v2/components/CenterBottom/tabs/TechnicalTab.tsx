import React from "react";

interface TechnicalTabProps {
  symbol: string;
}

export const TechnicalTab: React.FC<TechnicalTabProps> = ({ symbol }) => {
  const mockIndicators = [
    { label: "MACD", signal: "金叉", type: "bullish" },
    { label: "RSI", value: "65.3", signal: "中性", type: "neutral" },
    { label: "KDJ", signal: "超买", type: "bearish" },
    { label: "BOLL", signal: "上轨附近", type: "neutral" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {mockIndicators.map(indicator => (
        <div
          key={indicator.label}
          className="p-3 bg-[var(--bg-secondary)] rounded"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {indicator.label}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                indicator.type === "bullish"
                  ? "bg-[var(--color-up-bg)] text-[var(--color-up)]"
                  : indicator.type === "bearish"
                    ? "bg-[var(--color-down-bg)] text-[var(--color-down)]"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              }`}
            >
              {indicator.signal}
            </span>
          </div>
          {indicator.value && (
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {indicator.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TechnicalTab;
