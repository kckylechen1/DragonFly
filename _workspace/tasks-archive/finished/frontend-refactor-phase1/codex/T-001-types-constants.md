# T-001: 创建 types & constants 契约文件

## 负责 Agent: 🟢 Codex

## 目标
- [ ] 创建 `types/ai.ts` - AI 消息类型定义
- [ ] 创建 `types/chart.ts` - K 线图数据类型
- [ ] 创建 `types/watchlist.ts` - 自选股类型
- [ ] 创建 `constants/layout.ts` - 布局常量

---

## 步骤

### Step 1: 创建目录结构

```bash
cd client/src/refactor_v2
mkdir -p types constants
```

### Step 2: 创建 types/ai.ts

```typescript
// client/src/refactor_v2/types/ai.ts

export type MessageRole = "user" | "assistant";
export type MessageStatus = "streaming" | "done" | "error";

export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status?: MessageStatus;
}

export interface AIChatState {
  messages: AIMessage[];
  isLoading: boolean;
  aiPanelOpen: boolean;
}

export interface AIChatActions {
  addMessage: (message: Omit<AIMessage, "id" | "createdAt">) => void;
  setIsLoading: (loading: boolean) => void;
  setAIPanelOpen: (open: boolean) => void;
  toggleAIPanel: () => void;
  openAIPanel: () => void;
  closeAIPanel: () => void;
  clearMessages: () => void;
}

export type AIChatStore = AIChatState & AIChatActions;
```

### Step 3: 创建 types/chart.ts

```typescript
// client/src/refactor_v2/types/chart.ts

import type { Time } from "lightweight-charts";

export interface CandlestickPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumePoint {
  time: Time;
  value: number;
  color?: string;
}

export interface LinePoint {
  time: Time;
  value: number;
}

export interface ChartDataPoint {
  time: number;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export type ChartPeriod = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  mainFlow: number;
  turnoverRate: number;
  amplitude: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  prevClose?: number;
}
```

### Step 4: 创建 types/watchlist.ts

```typescript
// client/src/refactor_v2/types/watchlist.ts

export interface WatchlistItem {
  symbol: string;
  name: string;
  groupId?: string;
}

export interface WatchlistGroup {
  id: string;
  name: string;
  order: number;
}

export interface WatchlistState {
  currentSymbol: string;
  watchlist: WatchlistItem[];
  groups?: WatchlistGroup[];
}

export interface WatchlistActions {
  setCurrentSymbol: (symbol: string) => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export type WatchlistStore = WatchlistState & WatchlistActions;
```

### Step 5: 创建 constants/layout.ts

```typescript
// client/src/refactor_v2/constants/layout.ts

// Panel widths
export const AI_PANEL_WIDTH = 384;
export const LEFT_PANE_DEFAULT_WIDTH = 280;
export const LEFT_PANE_MIN_WIDTH = 200;
export const LEFT_PANE_MAX_WIDTH = 400;

// Panel heights (as percentages for resizable panels)
export const CENTER_TOP_DEFAULT_SIZE = 65; // percentage
export const CENTER_BOTTOM_DEFAULT_SIZE = 35;
export const CENTER_TOP_MIN_SIZE = 40;
export const CENTER_BOTTOM_MIN_SIZE = 20;

// Animation durations
export const PANEL_TRANSITION_DURATION = 300; // ms

// Keyboard shortcuts
export const HOTKEYS = {
  FOCUS_AI_INPUT: "mod+k", // ⌘/Ctrl + K
  TOGGLE_AI_PANEL: "mod+i", // ⌘/Ctrl + I
  CLOSE_AI_PANEL: "Escape",
} as const;

// Z-index layers
export const Z_INDEX = {
  FLOATING_INPUT: 10,
  AI_PANEL: 20,
  TOOLTIP: 30,
  MODAL: 40,
} as const;
```

### Step 6: 创建 types/index.ts 导出

```typescript
// client/src/refactor_v2/types/index.ts

export * from "./ai";
export * from "./chart";
export * from "./watchlist";
```

### Step 7: 验证

```bash
pnpm check
```

确保所有类型文件无错误。

---

## 验收标准

- [ ] 4 个类型文件已创建
- [ ] 1 个常量文件已创建
- [ ] `pnpm check` 通过
- [ ] 导出索引文件存在

---

## 产出文件

- `client/src/refactor_v2/types/ai.ts`
- `client/src/refactor_v2/types/chart.ts`
- `client/src/refactor_v2/types/watchlist.ts`
- `client/src/refactor_v2/types/index.ts`
- `client/src/refactor_v2/constants/layout.ts`
