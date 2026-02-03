
interface FundsBarProps {
  mainFlow: number;
  turnoverRate: number;
  amplitude: number;
  superLargeFlow?: number;
  largeFlow?: number;
}

export const FundsBar: React.FC<FundsBarProps> = ({
  mainFlow,
  turnoverRate,
  amplitude,
  superLargeFlow,
  largeFlow,
}) => {
  return (
    <div className="flex gap-6 text-sm bg-[var(--bg-secondary)] p-3 rounded border border-[var(--panel-border)]">
      <FundsItem
        label="主力净流入"
        value={`${mainFlow > 0 ? "+" : ""}${mainFlow.toFixed(2)}亿`}
        type={mainFlow > 0 ? "up" : mainFlow < 0 ? "down" : "neutral"}
      />

      {superLargeFlow !== undefined && (
        <FundsItem
          label="超大单"
          value={`${superLargeFlow > 0 ? "+" : ""}${superLargeFlow.toFixed(2)}亿`}
          type={
            superLargeFlow > 0
              ? "up"
              : superLargeFlow < 0
                ? "down"
                : "neutral"
          }
        />
      )}

      {largeFlow !== undefined && (
        <FundsItem
          label="大单"
          value={`${largeFlow > 0 ? "+" : ""}${largeFlow.toFixed(2)}亿`}
          type={
            largeFlow > 0
              ? "up"
              : largeFlow < 0
                ? "down"
                : "neutral"
          }
        />
      )}

      <FundsItem
        label="换手率"
        value={`${turnoverRate.toFixed(2)}%`}
        type="neutral"
      />

      <FundsItem
        label="振幅"
        value={`${amplitude.toFixed(2)}%`}
        type="neutral"
      />
    </div>
  );
};

interface FundsItemProps {
  label: string;
  value: string;
  type: "up" | "down" | "neutral";
}

const FundsItem: React.FC<FundsItemProps> = ({ label, value, type }) => {
  const colorClass =
    type === "up"
      ? "text-[var(--color-up)]"
      : type === "down"
        ? "text-[var(--color-down)]"
        : "text-[var(--text-primary)]";

  return (
    <div>
      <span className="text-[var(--text-muted)]">{label}</span>
      <div className={`font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
};
