# T-002: 完善 layout.store actions

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-001 (types & constants 已创建)

## 目标
- [ ] 添加 rightPanelOpen 的 toggle/open/close actions
- [ ] 引入 constants 替换 magic numbers
- [ ] 同步更新 aiChat.store 的 panel actions
- [ ] 确保 store 接口与类型契约一致

---

## 步骤

### Step 1: 更新 layout.store.ts

```typescript
// client/src/refactor_v2/stores/layout.store.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  LEFT_PANE_DEFAULT_WIDTH,
  LEFT_PANE_MIN_WIDTH,
  LEFT_PANE_MAX_WIDTH,
  CENTER_TOP_DEFAULT_SIZE,
} from "@/refactor_v2/constants/layout";

interface LayoutState {
  leftPanelWidth: number;
  centerTopSize: number; // percentage (0-100)
  rightPanelOpen: boolean;
}

interface LayoutActions {
  setLeftPanelWidth: (width: number) => void;
  setCenterTopSize: (size: number) => void;
  setRightPanelOpen: (open: boolean) => void;
  openRightPanel: () => void;
  closeRightPanel: () => void;
  toggleRightPanel: () => void;
  resetLayout: () => void;
}

export type LayoutStore = LayoutState & LayoutActions;

const initialState: LayoutState = {
  leftPanelWidth: LEFT_PANE_DEFAULT_WIDTH,
  centerTopSize: CENTER_TOP_DEFAULT_SIZE,
  rightPanelOpen: false,
};

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      ...initialState,

      setLeftPanelWidth: (width) =>
        set({
          leftPanelWidth: Math.min(
            Math.max(width, LEFT_PANE_MIN_WIDTH),
            LEFT_PANE_MAX_WIDTH
          ),
        }),

      setCenterTopSize: (size) =>
        set({ centerTopSize: Math.min(Math.max(size, 30), 80) }),

      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

      openRightPanel: () => set({ rightPanelOpen: true }),

      closeRightPanel: () => set({ rightPanelOpen: false }),

      toggleRightPanel: () =>
        set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

      resetLayout: () => set(initialState),
    }),
    { name: "layout-store" }
  )
);
```

### Step 2: 更新 aiChat.store.ts

确保 aiChat store 使用 layout store 的 panel 控制，或者保持自己的逻辑但保持一致：

```typescript
// client/src/refactor_v2/stores/aiChat.store.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIMessage, AIChatStore } from "@/refactor_v2/types/ai";
import { useLayoutStore } from "./layout.store";

interface AIChatState {
  messages: AIMessage[];
  isLoading: boolean;
}

interface AIChatActions {
  addMessage: (message: Omit<AIMessage, "id" | "createdAt">) => void;
  setIsLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

// Note: aiPanelOpen 现在由 layoutStore.rightPanelOpen 管理
// 这里只保留消息相关状态

export const useAIChatStore = create<AIChatState & AIChatActions>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              createdAt: Date.now(),
            },
          ],
        })),

      setIsLoading: (loading) => set({ isLoading: loading }),

      clearMessages: () => set({ messages: [] }),
    }),
    { name: "ai-chat-store" }
  )
);

// Helper: 使用 layout store 控制面板
export const useAIPanelControl = () => {
  const { rightPanelOpen, openRightPanel, closeRightPanel, toggleRightPanel } =
    useLayoutStore();

  return {
    isOpen: rightPanelOpen,
    open: openRightPanel,
    close: closeRightPanel,
    toggle: toggleRightPanel,
  };
};
```

### Step 3: 更新依赖该 store 的组件

更新 `AIChatPanel.tsx` 使用新的 store 结构：

```typescript
// client/src/refactor_v2/components/AIChatPanel.tsx

import React from "react";
import { X, Copy, ThumbsUp, RotateCcw } from "lucide-react";
import { useAIChatStore, useAIPanelControl } from "@/refactor_v2/stores/aiChat.store";

export const AIChatPanel: React.FC = () => {
  const { messages, clearMessages } = useAIChatStore();
  const { close } = useAIPanelControl();

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--panel-border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">AI 分析</h3>
        <button
          onClick={close}
          className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
        >
          <X className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      </div>

      {/* ... rest stays the same ... */}
    </div>
  );
};
```

更新 `FloatingAIChatInput.tsx`：

```typescript
// 在 FloatingAIChatInput.tsx 中
import { useAIChatStore, useAIPanelControl } from "@/refactor_v2/stores/aiChat.store";

// ...
const { addMessage } = useAIChatStore();
const { open, close } = useAIPanelControl();

// handleSend 中使用 open() 替代 setAIPanelOpen(true)
```

### Step 4: 更新 LayoutShell.tsx 使用常量

```typescript
// client/src/refactor_v2/components/LayoutShell.tsx

import { AI_PANEL_WIDTH } from "@/refactor_v2/constants/layout";

// 替换所有 384 为 AI_PANEL_WIDTH
const rightWidth = rightPanelOpen ? AI_PANEL_WIDTH : 0;

// style={{ width: 384, ... }} 改为
style={{ width: AI_PANEL_WIDTH, ... }}
```

### Step 5: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] layout.store 有完整的 open/close/toggle actions
- [ ] Magic number 384/280 已替换为常量
- [ ] aiChat.store 与 layout.store 面板状态统一
- [ ] 依赖组件已更新
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/stores/layout.store.ts` (更新)
- `client/src/refactor_v2/stores/aiChat.store.ts` (更新)
- `client/src/refactor_v2/components/AIChatPanel.tsx` (更新)
- `client/src/refactor_v2/components/FloatingAIChatInput.tsx` (更新)
- `client/src/refactor_v2/components/LayoutShell.tsx` (更新)
