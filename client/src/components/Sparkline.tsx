import React, { memo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  isUp?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

const SparklineComponent: React.FC<SparklineProps> = ({
  data,
  isUp = true,
  width = 50,
  height = 24,
  className = "",
}) => {
  if (!data || data.length < 2) return null;

  const chartData = data.map((value, index) => ({ value, index }));
  const color = isUp ? "var(--color-up)" : "var(--color-down)";

  return (
    <div
      className={`sparkline-container transition-opacity duration-200 ${className}`}
      style={{ width, height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const Sparkline = memo(SparklineComponent);
