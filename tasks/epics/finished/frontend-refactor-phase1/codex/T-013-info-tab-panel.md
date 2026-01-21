# T-013: CenterBottom InfoTabPanel 骨架

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-001 (types 契约)

## 目标
- [ ] 创建 CenterBottom 目录结构
- [ ] 实现 InfoTabPanel 组件（带 ARIA）
- [ ] 为 4 个 Tab 创建骨架组件
- [ ] 预留 React.lazy 懒加载点位

---

## 步骤

### Step 1: 创建目录结构

```bash
cd client/src/refactor_v2/components
mkdir -p CenterBottom/tabs
```

### Step 2: 创建 Tab 类型定义

```typescript
// client/src/refactor_v2/components/CenterBottom/types.ts

export type TabId = "news" | "fundamental" | "sentiment" | "technical";

export interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

export const TABS: TabConfig[] = [
  { id: "news", label: "新闻", icon: "📰" },
  { id: "fundamental", label: "基本面", icon: "📊" },
  { id: "sentiment", label: "情绪", icon: "💭" },
  { id: "technical", label: "技术", icon: "📈" },
];
```

### Step 3: 创建 Tab 骨架组件

```typescript
// client/src/refactor_v2/components/CenterBottom/tabs/NewsTab.tsx

import React from "react";

interface NewsTabProps {
  symbol: string;
}

export const NewsTab: React.FC<NewsTabProps> = ({ symbol }) => {
  // TODO: Fetch real news data
  const mockNews = [
    {
      id: "1",
      title: "重大公告",
      summary: "2026-01-19 公司发布三季度业绩报告...",
      time: "10:30",
    },
    {
      id: "2",
      title: "行业动态",
      summary: "本月光芯片产业景气度提升...",
      time: "09:15",
    },
  ];

  return (
    <div className="space-y-3">
      {mockNews.map((news) => (
        <div
          key={news.id}
          className="p-3 bg-[var(--bg-secondary)] rounded hover:bg-[var(--panel-hover)] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-[var(--text-primary)]">
              {news.title}
            </p>
            <span className="text-xs text-[var(--text-muted)]">{news.time}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
            {news.summary}
          </p>
        </div>
      ))}
    </div>
  );
};

export default NewsTab;
```

```typescript
// client/src/refactor_v2/components/CenterBottom/tabs/FundamentalTab.tsx

import React from "react";

interface FundamentalTabProps {
  symbol: string;
}

export const FundamentalTab: React.FC<FundamentalTabProps> = ({ symbol }) => {
  // TODO: Fetch real fundamental data
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
      {mockData.map((item) => (
        <div
          key={item.label}
          className="p-3 bg-[var(--bg-secondary)] rounded"
        >
          <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
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
```

```typescript
// client/src/refactor_v2/components/CenterBottom/tabs/SentimentTab.tsx

import React from "react";

interface SentimentTabProps {
  symbol: string;
}

export const SentimentTab: React.FC<SentimentTabProps> = ({ symbol }) => {
  // TODO: Integrate with MarketSentimentPanel or similar
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="text-4xl mb-4">📊</div>
      <p className="text-[var(--text-muted)] text-sm">
        情绪数据加载中...
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-2">
        股票代码: {symbol}
      </p>
    </div>
  );
};

export default SentimentTab;
```

```typescript
// client/src/refactor_v2/components/CenterBottom/tabs/TechnicalTab.tsx

import React from "react";

interface TechnicalTabProps {
  symbol: string;
}

export const TechnicalTab: React.FC<TechnicalTabProps> = ({ symbol }) => {
  // TODO: Show technical indicators
  const mockIndicators = [
    { label: "MACD", signal: "金叉", type: "bullish" },
    { label: "RSI", value: "65.3", signal: "中性", type: "neutral" },
    { label: "KDJ", signal: "超买", type: "bearish" },
    { label: "BOLL", signal: "上轨附近", type: "neutral" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {mockIndicators.map((indicator) => (
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
```

### Step 4: 创建 tabs/index.ts

```typescript
// client/src/refactor_v2/components/CenterBottom/tabs/index.ts

import { lazy } from "react";

// Lazy load tab components for better performance
export const NewsTab = lazy(() => import("./NewsTab"));
export const FundamentalTab = lazy(() => import("./FundamentalTab"));
export const SentimentTab = lazy(() => import("./SentimentTab"));
export const TechnicalTab = lazy(() => import("./TechnicalTab"));
```

### Step 5: 创建 InfoTabPanel.tsx

```typescript
// client/src/refactor_v2/components/CenterBottom/InfoTabPanel.tsx

import React, { useState, Suspense } from "react";
import { TABS, TabId } from "./types";
import { NewsTab, FundamentalTab, SentimentTab, TechnicalTab } from "./tabs";

interface InfoTabPanelProps {
  symbol: string;
}

export const InfoTabPanel: React.FC<InfoTabPanelProps> = ({ symbol }) => {
  const [activeTab, setActiveTab] = useState<TabId>("news");

  const renderTabContent = () => {
    const props = { symbol };

    switch (activeTab) {
      case "news":
        return <NewsTab {...props} />;
      case "fundamental":
        return <FundamentalTab {...props} />;
      case "sentiment":
        return <SentimentTab {...props} />;
      case "technical":
        return <TechnicalTab {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab List with ARIA */}
      <div
        role="tablist"
        aria-label="股票信息面板"
        className="flex gap-1 border-b border-[var(--panel-border)] px-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => {
              // Keyboard navigation
              const currentIndex = TABS.findIndex((t) => t.id === activeTab);
              if (e.key === "ArrowRight") {
                const nextIndex = (currentIndex + 1) % TABS.length;
                setActiveTab(TABS[nextIndex].id);
              } else if (e.key === "ArrowLeft") {
                const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
                setActiveTab(TABS[prevIndex].id);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
              activeTab === tab.id
                ? "border-[var(--accent-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panel with ARIA */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="flex-1 overflow-y-auto p-4"
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
              加载中...
            </div>
          }
        >
          {renderTabContent()}
        </Suspense>
      </div>
    </div>
  );
};
```

### Step 6: 创建 CenterBottom/index.tsx

```typescript
// client/src/refactor_v2/components/CenterBottom/index.tsx

import React from "react";
import { useWatchlistStore } from "@/refactor_v2/stores/watchlist.store";
import { InfoTabPanel } from "./InfoTabPanel";

export const CenterBottom: React.FC = () => {
  const { currentSymbol } = useWatchlistStore();

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      <InfoTabPanel symbol={currentSymbol} />
    </div>
  );
};

export default CenterBottom;
```

### Step 7: 清理旧文件

```bash
mv client/src/refactor_v2/components/CenterBottom.tsx client/src/refactor_v2/components/CenterBottom.tsx.bak
# 或删除
rm client/src/refactor_v2/components/CenterBottom.tsx
```

### Step 8: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] CenterBottom 目录创建成功
- [ ] InfoTabPanel 有完整的 ARIA 属性
- [ ] 4 个 Tab 组件都有骨架
- [ ] 使用 React.lazy 懒加载
- [ ] 键盘导航（左右箭头）可用
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/CenterBottom/index.tsx`
- `client/src/refactor_v2/components/CenterBottom/InfoTabPanel.tsx`
- `client/src/refactor_v2/components/CenterBottom/types.ts`
- `client/src/refactor_v2/components/CenterBottom/tabs/index.ts`
- `client/src/refactor_v2/components/CenterBottom/tabs/NewsTab.tsx`
- `client/src/refactor_v2/components/CenterBottom/tabs/FundamentalTab.tsx`
- `client/src/refactor_v2/components/CenterBottom/tabs/SentimentTab.tsx`
- `client/src/refactor_v2/components/CenterBottom/tabs/TechnicalTab.tsx`
