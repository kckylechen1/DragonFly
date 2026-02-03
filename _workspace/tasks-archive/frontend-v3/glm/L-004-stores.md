# L-004: 创建 Zustand Stores

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- L-003 (所有类型定义)

## 目标
- [ ] 创建 `stores/chat.store.ts`
- [ ] 创建 `stores/market.store.ts`（含 batchUpdateTicks）
- [ ] 创建 `stores/ui.store.ts`（含 sidebarCollapsed、settingsOpen）
- [ ] 创建 `stores/connection.store.ts`
- [ ] 创建 `stores/index.ts`

---

## 参考文档

- `tasks/FutureShop/frontend-architecture-guide.md` 第 824-886 行
- `FRONTEND_REFACTOR_REVIEW.md` 第 123-148 行（UIState）

---

## 步骤

### Step 1: 创建目录

```bash
mkdir -p client/src/refactor_v2/stores
```

### Step 2: 创建 stores/chat.store.ts

```typescript
// client/src/refactor_v2/stores/chat.store.ts

import { create } from "zustand";
import type { Message } from "../types/chat";

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentConversationId: string | null;
}

interface ChatActions {
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendContent: (id: string, delta: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  setConversationId: (id: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState & ChatActions>()((set) => ({
  // State
  messages: [],
  isStreaming: false,
  currentConversationId: null,

  // Actions
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  appendContent: (id, delta) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + delta } : m
      ),
    })),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setConversationId: (id) => set({ currentConversationId: id }),

  clearMessages: () => set({ messages: [], currentConversationId: null }),
}));
```

### Step 3: 创建 stores/market.store.ts

```typescript
// client/src/refactor_v2/stores/market.store.ts

import { create } from "zustand";
import type { MarketTick, KLine, OrderBook, StockInfo } from "../types/market";

interface MarketState {
  data: Record<string, MarketTick>;
  klineHistory: Record<string, KLine[]>;
  orderbook: Record<string, OrderBook>;
  stockInfo: Record<string, StockInfo>;
}

interface MarketActions {
  /**
   * ⚠️ CRITICAL: 批量更新 tick，由 tickBuffer 调用
   * 不要直接对每个 tick 调用 set
   */
  batchUpdateTicks: (updates: Record<string, MarketTick>) => void;
  setKlineHistory: (symbol: string, data: KLine[]) => void;
  appendKline: (symbol: string, kline: KLine) => void;
  setOrderbook: (symbol: string, orderbook: OrderBook) => void;
  setStockInfo: (symbol: string, info: StockInfo) => void;
}

export const useMarketStore = create<MarketState & MarketActions>()((set) => ({
  // State
  data: {},
  klineHistory: {},
  orderbook: {},
  stockInfo: {},

  // Actions
  batchUpdateTicks: (updates) =>
    set((state) => ({
      data: { ...state.data, ...updates },
    })),

  setKlineHistory: (symbol, data) =>
    set((state) => ({
      klineHistory: { ...state.klineHistory, [symbol]: data },
    })),

  appendKline: (symbol, kline) =>
    set((state) => ({
      klineHistory: {
        ...state.klineHistory,
        [symbol]: [...(state.klineHistory[symbol] || []), kline],
      },
    })),

  setOrderbook: (symbol, orderbook) =>
    set((state) => ({
      orderbook: { ...state.orderbook, [symbol]: orderbook },
    })),

  setStockInfo: (symbol, info) =>
    set((state) => ({
      stockInfo: { ...state.stockInfo, [symbol]: info },
    })),
}));
```

### Step 4: 创建 stores/ui.store.ts

```typescript
// client/src/refactor_v2/stores/ui.store.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PanelId } from "../types/panel";

interface UIState {
  // 侧边栏
  sidebarCollapsed: boolean;
  // 设置面板
  settingsOpen: boolean;
  // Command Palette
  commandPaletteOpen: boolean;
  // 当前股票
  currentSymbol: string;
  // 当前激活面板
  activePanelId: PanelId;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setCurrentSymbol: (symbol: string) => void;
  setActivePanelId: (id: PanelId) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      // State
      sidebarCollapsed: false,
      settingsOpen: false,
      commandPaletteOpen: false,
      currentSymbol: "AAPL",
      activePanelId: "kline",

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),

      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),

      setCurrentSymbol: (symbol) => set({ currentSymbol: symbol }),

      setActivePanelId: (id) => set({ activePanelId: id }),
    }),
    {
      name: "dragonfly-ui-state",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        currentSymbol: state.currentSymbol,
        activePanelId: state.activePanelId,
      }),
    }
  )
);
```

### Step 5: 创建 stores/connection.store.ts

```typescript
// client/src/refactor_v2/stores/connection.store.ts

import { create } from "zustand";
import type { ConnectionStatus } from "../types/connection";

interface ConnectionStore {
  wsStatus: ConnectionStatus;
  sseStatus: ConnectionStatus;
  setWsStatus: (status: Partial<ConnectionStatus>) => void;
  setSseStatus: (status: Partial<ConnectionStatus>) => void;
}

const initialStatus: ConnectionStatus = {
  state: "idle",
  lastMessageAt: null,
  retryCount: 0,
  lastError: null,
};

export const useConnectionStore = create<ConnectionStore>()((set) => ({
  wsStatus: { ...initialStatus },
  sseStatus: { ...initialStatus },

  setWsStatus: (status) =>
    set((state) => ({ wsStatus: { ...state.wsStatus, ...status } })),

  setSseStatus: (status) =>
    set((state) => ({ sseStatus: { ...state.sseStatus, ...status } })),
}));
```

### Step 6: 创建 stores/index.ts

```typescript
// client/src/refactor_v2/stores/index.ts

export { useChatStore } from "./chat.store";
export { useMarketStore } from "./market.store";
export { useUIStore } from "./ui.store";
export { useConnectionStore } from "./connection.store";
```

### Step 7: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] 4 个 store 文件已创建
- [ ] useChatStore 有 appendContent 方法
- [ ] useMarketStore 有 batchUpdateTicks 方法（⚠️ CRITICAL）
- [ ] useUIStore 使用 persist 中间件
- [ ] useConnectionStore 有 wsStatus 和 sseStatus
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/stores/chat.store.ts`
- `client/src/refactor_v2/stores/market.store.ts`
- `client/src/refactor_v2/stores/ui.store.ts`
- `client/src/refactor_v2/stores/connection.store.ts`
- `client/src/refactor_v2/stores/index.ts`
