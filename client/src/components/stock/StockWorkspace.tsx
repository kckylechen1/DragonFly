import { StockMainPanel } from "./StockMainPanel";
import { StockNewsPanel } from "./StockNewsPanel";
import { StockTabBar } from "./StockTabBar";

import type { MouseEvent } from "react";

export interface StockWorkspaceProps {
  openedTabs: string[];
  selectedStock: string | null;
  onSwitchTab: (code: string) => void;
  onCloseTab: (code: string, event: MouseEvent<HTMLButtonElement>) => void;
  showSidePanels: boolean;
  onToggleSidePanels: () => void;
  onSelectTopStock: (code: string) => void;
}

export function StockWorkspace({
  openedTabs,
  selectedStock,
  onSwitchTab,
  onCloseTab,
  showSidePanels,
  onToggleSidePanels,
  onSelectTopStock,
}: StockWorkspaceProps) {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <StockTabBar
        openedTabs={openedTabs}
        selectedStock={selectedStock}
        onSwitchTab={onSwitchTab}
        onCloseTab={onCloseTab}
      />

      <div className="flex-1 min-h-0 flex">
        <StockMainPanel
          selectedStock={selectedStock}
          showSidePanels={showSidePanels}
          onToggleSidePanels={onToggleSidePanels}
          onSelectTopStock={onSelectTopStock}
        />
      </div>

      <StockNewsPanel selectedStock={selectedStock} />
    </div>
  );
}

