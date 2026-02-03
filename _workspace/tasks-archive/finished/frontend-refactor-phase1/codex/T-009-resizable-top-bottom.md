# T-009: react-resizable-panels 上下 Split

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-008 (左右 resize 已实现)

## 目标
- [ ] 在中间区域实现上下拖拽分割
- [ ] CenterTop / CenterBottom 比例可调整
- [ ] 尺寸持久化

---

## 步骤

### Step 1: 更新 LayoutShell 添加垂直 PanelGroup

```typescript
// client/src/refactor_v2/components/LayoutShell.tsx

import React, { ReactNode } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useLayoutStore } from "@/refactor_v2/stores/layout.store";
import {
  AI_PANEL_WIDTH,
  CENTER_TOP_MIN_SIZE,
  CENTER_BOTTOM_MIN_SIZE,
} from "@/refactor_v2/constants/layout";
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
  floatingElement?: ReactNode; // For FloatingAIChatInput
  className?: string;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({
  left,
  centerTop,
  centerBottom,
  right,
  floatingElement,
  className,
}) => {
  const {
    leftPanelSize,
    setLeftPanelSize,
    centerTopSize,
    setCenterTopSize,
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
        autoSaveId="dragonfly-layout-h"
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

        {/* Horizontal Resize Handle */}
        <ResizeHandle direction="horizontal" />

        {/* Center Panel with Vertical Split */}
        <Panel
          className="flex flex-col overflow-hidden transition-all duration-300 relative"
          style={{ marginRight: `${rightWidth}px` }}
        >
          <PanelGroup
            direction="vertical"
            autoSaveId="dragonfly-layout-v"
          >
            {/* CenterTop */}
            <Panel
              defaultSize={centerTopSize}
              minSize={CENTER_TOP_MIN_SIZE}
              maxSize={80}
              onResize={setCenterTopSize}
              className="overflow-hidden"
            >
              <CenterTopErrorBoundary>{centerTop}</CenterTopErrorBoundary>
            </Panel>

            {/* Vertical Resize Handle */}
            <ResizeHandle direction="vertical" />

            {/* CenterBottom */}
            <Panel
              minSize={CENTER_BOTTOM_MIN_SIZE}
              className="overflow-hidden relative"
            >
              <CenterBottomErrorBoundary>{centerBottom}</CenterBottomErrorBoundary>
            </Panel>
          </PanelGroup>

          {/* Floating Element (AI Input) */}
          {floatingElement}
        </Panel>
      </PanelGroup>

      {/* Right Pane (AI Panel) */}
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

// Custom styled resize handle component
interface ResizeHandleProps {
  direction: "horizontal" | "vertical";
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ direction }) => {
  const isHorizontal = direction === "horizontal";

  return (
    <PanelResizeHandle
      className={`
        group relative flex items-center justify-center
        ${isHorizontal ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize"}
        bg-transparent hover:bg-[var(--accent-primary)]/20
        transition-colors duration-150
      `}
    >
      {/* Visual indicator */}
      <div
        className={`
          absolute bg-[var(--panel-border)] rounded-full
          group-hover:bg-[var(--accent-primary)]
          transition-colors duration-150
          ${isHorizontal ? "w-1 h-8" : "h-1 w-8"}
        `}
      />
    </PanelResizeHandle>
  );
};
```

### Step 2: 更新 constants/layout.ts

确保常量已定义：

```typescript
// client/src/refactor_v2/constants/layout.ts

// ... 已有内容 ...

// Panel size constraints (percentages)
export const CENTER_TOP_DEFAULT_SIZE = 65;
export const CENTER_BOTTOM_DEFAULT_SIZE = 35;
export const CENTER_TOP_MIN_SIZE = 40;
export const CENTER_BOTTOM_MIN_SIZE = 20;
```

### Step 3: 更新使用 LayoutShell 的地方

在使用 LayoutShell 的地方传入 floatingElement：

```typescript
// 示例用法
<LayoutShell
  left={<LeftPane />}
  centerTop={<CenterTop />}
  centerBottom={<CenterBottom />}
  right={<AIChatPanel />}
  floatingElement={<FloatingAIChatInput />}
/>
```

### Step 4: 验证

```bash
pnpm check
```

手动验证：
1. 拖拽上下分割线
2. 确认 CenterTop/CenterBottom 比例变化
3. 确认有最小尺寸约束（底部 Tab 不会被完全压没）
4. 刷新后尺寸保持

---

## 验收标准

- [ ] 上下分割线可拖拽
- [ ] CenterTop minSize=40%, CenterBottom minSize=20%
- [ ] 尺寸持久化
- [ ] ResizeHandle 有视觉反馈
- [ ] floatingElement 正确定位
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/LayoutShell.tsx` (更新)
- `client/src/refactor_v2/constants/layout.ts` (确认)
