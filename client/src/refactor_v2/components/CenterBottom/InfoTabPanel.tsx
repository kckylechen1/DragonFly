import React, { Suspense, useState } from "react";
import { TABS, type TabId } from "./types";
import { FundamentalTab, NewsTab, SentimentTab, TechnicalTab } from "./tabs";

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
      <div
        role="tablist"
        aria-label="股票信息面板"
        className="flex gap-1 border-b border-[var(--panel-border)] px-2"
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={e => {
              const currentIndex = TABS.findIndex(t => t.id === activeTab);
              if (e.key === "ArrowRight") {
                const nextIndex = (currentIndex + 1) % TABS.length;
                setActiveTab(TABS[nextIndex].id);
              } else if (e.key === "ArrowLeft") {
                const prevIndex =
                  (currentIndex - 1 + TABS.length) % TABS.length;
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
