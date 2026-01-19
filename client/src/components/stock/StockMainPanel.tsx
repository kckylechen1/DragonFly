import { useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  PanelRightClose,
  PanelRightOpen,
  TrendingUp,
} from "lucide-react";

import { MarketSentimentPanel, TopStocksPanel } from "@/components/market";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { StockDetailPanel } from "./StockDetailPanel";

export interface StockMainPanelProps {
  selectedStock: string | null;
  showSidePanels: boolean;
  onToggleSidePanels: () => void;
  onSelectTopStock: (code: string) => void;
}

export function StockMainPanel({
  selectedStock,
  showSidePanels,
  onToggleSidePanels,
  onSelectTopStock,
}: StockMainPanelProps) {
  const [showMarketPanel, setShowMarketPanel] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  return (
    <div className="flex-1 min-h-0 flex w-full h-full">
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {selectedStock ? (
          <div className="h-full">
            <StockDetailPanel stockCode={selectedStock} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">
                选择一只股票查看详情
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                从左侧列表中点击股票
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onToggleSidePanels}
          className="absolute right-2 top-2 z-20 2xl:hidden p-2 rounded-lg bg-card/90 border border-border hover:bg-accent transition-colors"
          title={showSidePanels ? "收起侧边栏" : "展开筹码/情绪面板"}
        >
          {showSidePanels ? (
            <PanelRightClose className="h-4 w-4 text-muted-foreground" />
          ) : (
            <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* 市场面板切换按钮 - 仅在面板隐藏时显示 */}
      {!showMarketPanel && (
        <button
          onClick={() => setShowMarketPanel(true)}
          className="flex items-center gap-1 px-2 py-4 bg-card/90 border border-border rounded-l-lg hover:bg-accent transition-colors"
          title="显示市场面板"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground writing-mode-vertical">
            市场
          </span>
        </button>
      )}

      {showMarketPanel && (
        <div
          className={`${showSidePanels ? "flex" : "hidden"} 2xl:flex flex-[15] min-w-[160px] border-l border-border flex-col bg-card/30`}
        >
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="flex-1 overflow-auto"
          >
            <AccordionItem
              value="sentiment"
              className="border-b border-border/50"
            >
              <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  市场情绪
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <MarketSentimentPanel
                  selectedStock={selectedStock ?? undefined}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="topstocks"
              className="border-b border-border/50"
            >
              <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  热门排行
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TopStocksPanel onSelectStock={onSelectTopStock} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="suggestion"
              className="border-b border-border/50"
            >
              <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  操作建议
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                  点击 AI 助手获取操作建议
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="p-2 border-t border-border/50 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs opacity-60 hover:opacity-100"
              onClick={() => setExpandedItems([])}
            >
              全部收起
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs opacity-60 hover:opacity-100"
              onClick={() => setShowMarketPanel(false)}
              title="隐藏面板"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
