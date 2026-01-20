import React from "react";

interface FundamentalTabProps {
  symbol: string;
}

export const FundamentalTab: React.FC<FundamentalTabProps> = ({ symbol }) => {
  const mockData = [
    { label: "市盈率", value: "28.5", unit: "" },
    { label: "市净率", value: "3.2", unit: "" },
    { label: "ROE", value: "11.5", unit: "%" },
    { label: "总市值", value: "450", unit: "亿" },
    { label: "流通市值", value: "380", unit: "亿" },
    { label: "营收增长", value: "23.5", unit: "%" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {mockData.map(item => (
        <div key={item.label} className="p-3 bg-[var(--bg-secondary)] rounded">
          <span className="text-xs text-[var(--text-muted)]">
            {item.label}
          </span>
          <div className="font-semibold text-[var(--text-primary)] mt-1">
            {item.value}
            {item.unit && (
              <span className="text-xs text-[var(--text-secondary)] ml-1">
                {item.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FundamentalTab;
