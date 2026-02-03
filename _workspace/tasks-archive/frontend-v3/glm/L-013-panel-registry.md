# L-013: Panel Registry 面板注册表

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 2026-01-30 10:13
- ✅ 结束时间: 2026-01-30 10:18 

## 前置依赖
- L-006 (MainLayout 占位)

## 目标
- [ ] 创建 `components/panels/PanelRegistry.ts`
- [ ] 使用 `next/dynamic` 方案实现面板懒加载（⚠️ CRITICAL）
- [ ] 定义所有可用面板及其元数据

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 554-580 行

---

## 步骤

### Step 1: 创建 PanelRegistry.ts

```typescript
// client/src/refactor_v2/components/panels/PanelRegistry.ts

import dynamic from "next/dynamic";
import React from "react";
import { 
  BarChart3, 
  Activity, 
  ListOrdered, 
  Info, 
  Lightbulb, 
  Newspaper 
} from "lucide-react";
import type { Panel, PanelId } from "../../types/panel";

/**
 * 面板骨架屏组件
 */
const PanelSkeleton = () => (
  <div className="flex-1 w-full h-full bg-gray-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full border-4 border-gray-800 border-t-cyan-500 animate-spin" />
      <span className="text-xs text-gray-500 font-mono tracking-widest">LOADING MODULAR UI...</span>
    </div>
  </div>
);

/**
 * ⚠️ CRITICAL: 全局面板注册表
 * 使用 dynamic() 动态导入，实现组件级 Bundle Split。
 * 只有当面板被激活时才会加载其 JS 资源。
 */
export const panelRegistry: Record<PanelId, Panel> = {
  kline: {
    id: "kline",
    title: "K线分析",
    icon: React.createElement(BarChart3, { size: 16 }),
    requires: {
      realtime: ["tick"],
      queries: ["kline"],
    },
    component: dynamic(() => import("./KLinePanel"), {
      loading: () => React.createElement(PanelSkeleton),
      ssr: false,
    }),
  },
  intraday: {
    id: "intraday",
    title: "分时图",
    icon: React.createElement(Activity, { size: 16 }),
    requires: {
      realtime: ["tick"],
    },
    component: dynamic(() => import("./IntradayPanel"), {
      loading: () => React.createElement(PanelSkeleton),
      ssr: false,
    }),
  },
  orderbook: {
    id: "orderbook",
    title: "买卖盘口",
    icon: React.createElement(ListOrdered, { size: 16 }),
    requires: {
      realtime: ["orderbook"],
    },
    component: dynamic(() => import("./OrderBookPanel"), {
      loading: () => React.createElement(PanelSkeleton),
      ssr: false,
    }),
  },
  indicators: {
    id: "indicators",
    title: "核心指标",
    icon: React.createElement(Info, { size: 16 }),
    requires: {
      queries: ["info"],
    },
    component: dynamic(() => import("./IndicatorsPanel"), {
      loading: () => React.createElement(PanelSkeleton),
      ssr: false,
    }),
  },
  advice: {
    id: "advice",
    title: "AI 建议",
    icon: React.createElement(Lightbulb, { size: 16 }),
    requires: {
      queries: ["info"],
    },
    component: dynamic(() => import("./AdvicePanel"), {
      loading: () => React.createElement(PanelSkeleton),
      ssr: false,
    }),
  },
  news: {
    id: "news",
    title: "相关资讯",
    icon: React.createElement(Newspaper, { size: 16 }),
    requires: {
      queries: ["news"],
    },
    component: dynamic(() => import("./NewsPanel"), {
      loading: () => React.createElement(PanelSkeleton),
      ssr: false,
    }),
  },
};

/**
 * 获取所有面板列表
 */
export const getPanels = () => Object.values(panelRegistry);
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `PanelRegistry.ts` 已创建
- [ ] 所有面板入口均使用 `dynamic()` 实现懒加载
- [ ] 每个面板均声明了 `requires` 数据依赖
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/panels/PanelRegistry.ts`
