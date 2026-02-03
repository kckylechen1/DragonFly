/**
 * PanelRegistry - 面板注册表
 *
 * 负责人: 🔵 GLM
 * ⏱️ 开始时间: 2026-01-30 10:13
 * ⏱️ 结束时间: 2026-01-30 10:18
 */

import { lazy, Suspense, createElement } from "react";
import { type FC } from "react";
import {
  BarChart3,
  Activity,
  ListOrdered,
  Info,
  Lightbulb,
  Newspaper,
} from "lucide-react";
import type { Panel, PanelId, PanelProps } from "../../types/panel";

// 动态导入面板组件，实现 Bundle Split
const KLinePanel = lazy(() => import("./KLinePanel"));
const IntradayPanel = lazy(() => import("./IntradayPanel"));
const OrderBookPanel = lazy(() => import("./OrderBookPanel"));
const IndicatorsPanel = lazy(() => import("./IndicatorsPanel"));
const AdvicePanel = lazy(() => import("./AdvicePanel"));
const NewsPanel = lazy(() => import("./NewsPanel"));

/**
 * 面板骨架屏组件
 */
export const PanelSkeleton: FC = () => {
  return createElement(
    "div",
    {
      className:
        "flex-1 w-full h-full bg-gray-900 flex items-center justify-center",
    },
    createElement(
      "div",
      { className: "flex flex-col items-center gap-3" },
      createElement("div", {
        className:
          "w-12 h-12 rounded-full border-4 border-gray-800 border-t-cyan-500 animate-spin",
      }),
      createElement(
        "span",
        { className: "text-xs text-gray-500 font-mono tracking-widest" },
        "LOADING MODULAR UI..."
      )
    )
  );
};

// Helper function to create icons
const createIcon = (Icon: FC<{ size?: number }>) => {
  return createElement(Icon, { size: 16 });
};

/**
 * ⚠️ CRITICAL: 全局面板注册表
 * 使用 React.lazy() 动态导入，实现组件级 Bundle Split。
 * 只有当面板被激活时才会加载其 JS 资源。
 */
export const panelRegistry: Record<PanelId, Panel> = {
  kline: {
    id: "kline",
    title: "K线分析",
    icon: createIcon(BarChart3),
    requires: {
      realtime: ["tick"],
      queries: ["kline"],
    },
    component: KLinePanel,
  },
  intraday: {
    id: "intraday",
    title: "分时图",
    icon: createIcon(Activity),
    requires: {
      realtime: ["tick"],
    },
    component: IntradayPanel,
  },
  orderbook: {
    id: "orderbook",
    title: "买卖盘口",
    icon: createIcon(ListOrdered),
    requires: {
      realtime: ["orderbook"],
    },
    component: OrderBookPanel,
  },
  indicators: {
    id: "indicators",
    title: "核心指标",
    icon: createIcon(Info),
    requires: {
      queries: ["info"],
    },
    component: IndicatorsPanel,
  },
  advice: {
    id: "advice",
    title: "AI 建议",
    icon: createIcon(Lightbulb),
    requires: {
      queries: ["info"],
    },
    component: AdvicePanel,
  },
  news: {
    id: "news",
    title: "相关资讯",
    icon: createIcon(Newspaper),
    requires: {
      queries: ["news"],
    },
    component: NewsPanel,
  },
};

/**
 * 获取所有面板列表
 */
export const getPanels = () => Object.values(panelRegistry);

/**
 * 带 Suspense 包装的面板组件
 */
export const PanelWithSuspense: FC<{ panelId: PanelId; symbol: string }> = ({
  panelId,
  symbol,
}) => {
  const panel = panelRegistry[panelId];
  const ActiveComponent = panel.component;

  return createElement(
    Suspense,
    { fallback: createElement(PanelSkeleton) },
    createElement(ActiveComponent, { symbol })
  );
};
