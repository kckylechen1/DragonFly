# T-008: react-resizable-panels 左右 Split

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-002 (layout.store 已完善)

## 目标
- [ ] 使用 react-resizable-panels 实现左右拖拽
- [ ] 左侧面板宽度可调整并持久化
- [ ] 设置合理的 min/max 约束

---

## 步骤

### Step 1: 确认依赖已安装

```bash
# 检查 react-resizable-panels 是否已安装
pnpm list react-resizable-panels

# 如果没有安装
pnpm add react-resizable-panels
```

### Step 2: 更新 layout.store 支持 panel sizes

```typescript
// client/src/refactor_v2/stores/layout.store.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  LEFT_PANE_MIN_WIDTH,
  LEFT_PANE_MAX_WIDTH,
  CENTER_TOP_DEFAULT_SIZE,
} from "@/refactor_v2/constants/layout";

interface LayoutState {
  // 使用百分比而非像素，更适合 react-resizable-panels
  leftPanelSize: number; // percentage (0-100)
  centerTopSize: number; // percentage (0-100)
  rightPanelOpen: boolean;
}

interface LayoutActions {
  setLeftPanelSize: (size: number) => void;
  setCenterTopSize: (size: number) => void;
  setRightPanelOpen: (open: boolean) => void;
  openRightPanel: () => void;
  closeRightPanel: () => void;
  toggleRightPanel: () => void;
  resetLayout: () => void;
}

export type LayoutStore = LayoutState & LayoutActions;

const initialState: LayoutState = {
  leftPanelSize: 20, // 20% default
  centerTopSize: CENTER_TOP_DEFAULT_SIZE,
  rightPanelOpen: false,
};

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      ...initialState,

      setLeftPanelSize: (size) =>
        set({ leftPanelSize: Math.min(Math.max(size, 10), 35) }),

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

### Step 3: 更新 LayoutShell 使用 react-resizable-panels

```typescript
// client/src/refactor_v2/components/LayoutShell.tsx

import React, { ReactNode } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useLayoutStore } from "@/refactor_v2/stores/layout.store";
import { AI_PANEL_WIDTH } from "@/refactor_v2/constants/layout";
import {
  LeftPaneErrorBoundary,
  CenterTopErrorBoundary,
  CenterBottomErrorBoundary,
  RightPaneErrorBoundary,
} from "./ErrorBoundary";

interface LayoutShellProps {
  left: ReactNode;
  centerTop: ReactNode;
  centerBottom: ReactNode;
  right: ReactNode;
  className?: string;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({
  left,
  centerTop,
  centerBottom,
  right,
  className,
}) => {
  const {
    leftPanelSize,
    setLeftPanelSize,
    rightPanelOpen,
  } = useLayoutStore();

  const rightWidth = rightPanelOpen ? AI_PANEL_WIDTH : 0;

  return (
    <div
      className={`flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden ${className || ""}`}
    >
      <PanelGroup
        direction="horizontal"
        className="flex-1"
        autoSaveId="dragonfly-layout-horizontal"
      >
        {/* Left Panel */}
        <Panel
          defaultSize={leftPanelSize}
          minSize={10}
          maxSize={35}
          onResize={setLeftPanelSize}
          className="border-r border-[var(--panel-border)] overflow-hidden"
        >
          <LeftPaneErrorBoundary>{left}</LeftPaneErrorBoundary>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-transparent hover:bg-[var(--accent-primary)] transition-colors cursor-col-resize" />

        {/* Center Panel */}
        <Panel
          className="flex flex-col overflow-hidden transition-all duration-300"
          style={{ marginRight: `${rightWidth}px` }}
        >
          {/* CenterTop */}
          <div className="flex-[1.35] border-b border-[var(--panel-border)] overflow-hidden">
            <CenterTopErrorBoundary>{centerTop}</CenterTopErrorBoundary>
          </div>

          {/* CenterBottom */}
          <div className="flex-[0.65] overflow-hidden relative">
            <CenterBottomErrorBoundary>{centerBottom}</CenterBottomErrorBoundary>
          </div>
        </Panel>
      </PanelGroup>

      {/* Right Pane (AI Panel) - Positioned absolutely */}
      <div
        style={{
          width: AI_PANEL_WIDTH,
          transform: rightPanelOpen ? "translateX(0)" : "translateX(100%)",
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
        }}
        className="border-l border-[var(--panel-border)] overflow-hidden transition-transform duration-300 bg-[var(--panel-bg)] z-20"
      >
        <RightPaneErrorBoundary>{right}</RightPaneErrorBoundary>
      </div>
    </div>
  );
};
```

### Step 4: 添加 ResizeHandle 样式

可选：创建更精致的 ResizeHandle 样式

```css
/* 添加到 tokens.css 或单独的样式文件 */

/* Resize Handle */
[data-panel-resize-handle-id] {
  position: relative;
}

[data-panel-resize-handle-id]::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 32px;
  border-radius: 2px;
  background: var(--panel-border);
  opacity: 0;
  transition: opacity 0.2s;
}

[data-panel-resize-handle-id]:hover::after,
[data-panel-resize-handle-id][data-resize-handle-active]::after {
  opacity: 1;
  background: var(--accent-primary);
}
```

### Step 5: 验证

```bash
pnpm check
```

手动验证：
1. 拖拽左侧面板边缘
2. 确认宽度可调整
3. 刷新页面，确认宽度保持
4. 确认有 min/max 约束

---

## 验收标准

- [ ] react-resizable-panels 已集成
- [ ] 左侧面板可拖拽调整宽度
- [ ] 有 min(10%)/max(35%) 约束
- [ ] 尺寸持久化到 localStorage
- [ ] ResizeHandle 有视觉反馈
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/stores/layout.store.ts` (更新)
- `client/src/refactor_v2/components/LayoutShell.tsx` (更新)
