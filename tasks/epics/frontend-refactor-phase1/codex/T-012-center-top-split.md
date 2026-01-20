# T-012: CenterTop 拆分子组件

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-001 (types 契约)

## 目标
- [ ] 将 CenterTop 拆分为多个子组件
- [ ] 目标：主组件缩到 ~100 行
- [ ] 保持 UI 与当前完全一致

---

## 步骤

### Step 1: 创建 CenterTop 目录结构

```bash
cd client/src/refactor_v2/components
mkdir -p CenterTop
```

### Step 2: 创建 StockHeader.tsx

```typescript
// client/src/refactor_v2/components/CenterTop/StockHeader.tsx

import React from "react";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import type { StockQuote, ChartPeriod } from "@/refactor_v2/types";

interface StockHeaderProps {
  symbol: string;
  quote: StockQuote;
  activePeriod?: ChartPeriod;
  onPeriodChange?: (period: ChartPeriod) => void;
}

const PERIODS: ChartPeriod[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];

export const StockHeader: React.FC<StockHeaderProps> = ({
  symbol,
  quote,
  activePeriod = "1D",
  onPeriodChange,
}) => {
  const isUp = quote.change >= 0;

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      {/* Stock info */}
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {symbol}
        </h2>
        <span className="text-lg text-[var(--text-secondary)]">
          ¥{quote.price.toFixed(2)}
        </span>
        <div
          className={`flex items-center gap-1 ${
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

      {/* Period selector */}
      <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1 overflow-x-auto">
        {PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => onPeriodChange?.(period)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activePeriod === period
                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {period}
          </button>
        ))}
        <button
          className="px-2 py-1 text-xs rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
          title="选择日期"
        >
          <Calendar className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
```

### Step 3: 创建 BadgeCloud.tsx

```typescript
// client/src/refactor_v2/components/CenterTop/BadgeCloud.tsx

import React from "react";
import { LucideIcon, Zap, Flame, TrendingUp, Newspaper, Building } from "lucide-react";

interface Badge {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
}

interface BadgeCloudProps {
  badges: Badge[];
  maxVisible?: number;
}

export const BadgeCloud: React.FC<BadgeCloudProps> = ({
  badges,
  maxVisible = 6,
}) => {
  const visibleBadges = badges.slice(0, maxVisible);

  if (visibleBadges.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap overflow-x-auto">
      {visibleBadges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.id}
            className={`flex items-center gap-1 px-3 py-1 rounded bg-[var(--bg-secondary)] text-sm ${badge.color}`}
          >
            <Icon className="w-4 h-4" />
            <span>{badge.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Badge generation utilities
export function generateBadges(quote: {
  mainFlow: number;
  symbol?: string;
}): Badge[] {
  const badges: Badge[] = [];

  // Main flow badge
  if (Math.abs(quote.mainFlow) > 1) {
    badges.push({
      id: "main-flow",
      icon: Zap,
      label:
        quote.mainFlow > 0
          ? `主力净流入 ¥${quote.mainFlow.toFixed(2)}亿`
          : `主力净流出 ¥${Math.abs(quote.mainFlow).toFixed(2)}亿`,
      color:
        quote.mainFlow > 0
          ? "text-[var(--color-up)]"
          : "text-[var(--color-down)]",
    });
  }

  // Popularity badge (mock - should come from real data)
  if (Math.random() > 0.5) {
    badges.push({
      id: "popularity",
      icon: Flame,
      label: `人气 #${Math.floor(Math.random() * 200) + 100}`,
      color: "text-orange-500",
    });
  }

  return badges;
}
```

### Step 4: 创建 FundsBar.tsx

```typescript
// client/src/refactor_v2/components/CenterTop/FundsBar.tsx

import React from "react";

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
    <div className="flex gap-6 text-sm bg-[var(--bg-secondary)] p-3 rounded border border-[var(--panel-border)] overflow-x-auto">
      {/* Main Flow */}
      <FundsItem
        label="主力净流入"
        value={`${mainFlow > 0 ? "+" : ""}${mainFlow.toFixed(2)}亿`}
        type={mainFlow > 0 ? "up" : mainFlow < 0 ? "down" : "neutral"}
      />

      {/* Super Large Orders */}
      {superLargeFlow !== undefined && (
        <FundsItem
          label="超大单"
          value={`${superLargeFlow > 0 ? "+" : ""}${superLargeFlow.toFixed(2)}亿`}
          type={superLargeFlow > 0 ? "up" : superLargeFlow < 0 ? "down" : "neutral"}
        />
      )}

      {/* Large Orders */}
      {largeFlow !== undefined && (
        <FundsItem
          label="大单"
          value={`${largeFlow > 0 ? "+" : ""}${largeFlow.toFixed(2)}亿`}
          type={largeFlow > 0 ? "up" : largeFlow < 0 ? "down" : "neutral"}
        />
      )}

      {/* Turnover Rate */}
      <FundsItem label="换手率" value={`${turnoverRate.toFixed(2)}%`} type="neutral" />

      {/* Amplitude */}
      <FundsItem label="振幅" value={`${amplitude.toFixed(2)}%`} type="neutral" />
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
    <div className="flex-shrink-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <div className={`font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
};
```

### Step 5: 创建 CenterTop/index.tsx (主入口)

```typescript
// client/src/refactor_v2/components/CenterTop/index.tsx

import React, { useMemo, useState } from "react";
import { useWatchlistStore } from "@/refactor_v2/stores/watchlist.store";
import type { ChartPeriod, StockQuote, ChartDataPoint } from "@/refactor_v2/types";
import { StockHeader } from "./StockHeader";
import { BadgeCloud, generateBadges } from "./BadgeCloud";
import { FundsBar } from "./FundsBar";
import { StockChart } from "../StockChart";

// Mock data - should come from API
const MOCK_QUOTES: Record<string, StockQuote> = {
  "300308": {
    symbol: "300308",
    name: "中际旭创",
    price: 45.23,
    change: 1.23,
    changePercent: 2.79,
    mainFlow: -9.76,
    turnoverRate: 1.77,
    amplitude: 2.8,
  },
  "000858": {
    symbol: "000858",
    name: "五粮液",
    price: 1280.5,
    change: -15.5,
    changePercent: -1.19,
    mainFlow: 5.43,
    turnoverRate: 0.92,
    amplitude: 1.5,
  },
  "600519": {
    symbol: "600519",
    name: "贵州茅台",
    price: 2180.3,
    change: 8.3,
    changePercent: 0.38,
    mainFlow: 2.1,
    turnoverRate: 0.65,
    amplitude: 1.2,
  },
};

// Generate mock chart data
function generateChartData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let price = 615.0;
  const now = Math.floor(Date.now() / 1000);
  const start = now - 4 * 60 * 60;

  for (let t = start; t <= now; t += 60) {
    const change = (Math.random() - 0.5) * 0.5;
    price += change;
    data.push({
      time: t,
      value: price,
      open: price - change * 0.8,
      high: price + Math.abs(change) * 1.2,
      low: price - Math.abs(change) * 1.2,
      close: price,
      volume: Math.floor(Math.random() * 10000),
    });
  }
  return data;
}

export const CenterTop: React.FC = () => {
  const { currentSymbol } = useWatchlistStore();
  const [activePeriod, setActivePeriod] = useState<ChartPeriod>("1D");

  const quote = MOCK_QUOTES[currentSymbol] || MOCK_QUOTES["300308"];
  const badges = useMemo(() => generateBadges(quote), [quote]);
  const chartData = useMemo(() => generateChartData(), [currentSymbol]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] p-4 gap-4">
      <StockHeader
        symbol={currentSymbol}
        quote={quote}
        activePeriod={activePeriod}
        onPeriodChange={setActivePeriod}
      />

      <BadgeCloud badges={badges} />

      <FundsBar
        mainFlow={quote.mainFlow}
        turnoverRate={quote.turnoverRate}
        amplitude={quote.amplitude}
      />

      <div className="flex-1 min-h-[420px] bg-[var(--bg-secondary)] rounded border border-[var(--panel-border)] overflow-hidden">
        <StockChart data={chartData} height={520} />
      </div>
    </div>
  );
};

export default CenterTop;
```

### Step 6: 删除或归档旧的 CenterTop.tsx

```bash
# 可以先备份
mv client/src/refactor_v2/components/CenterTop.tsx client/src/refactor_v2/components/CenterTop.tsx.bak

# 或直接删除（因为新版本已在目录中）
rm client/src/refactor_v2/components/CenterTop.tsx
```

### Step 7: 验证

```bash
pnpm check
```

视觉验证：UI 应与重构前完全一致。

---

## 验收标准

- [ ] CenterTop 目录创建，包含 4 个文件
- [ ] 主 index.tsx 约 ~60 行
- [ ] StockHeader, BadgeCloud, FundsBar 各自独立
- [ ] UI 与重构前一致
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/CenterTop/index.tsx`
- `client/src/refactor_v2/components/CenterTop/StockHeader.tsx`
- `client/src/refactor_v2/components/CenterTop/BadgeCloud.tsx`
- `client/src/refactor_v2/components/CenterTop/FundsBar.tsx`
