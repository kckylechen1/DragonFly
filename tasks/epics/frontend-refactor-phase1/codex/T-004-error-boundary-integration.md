# T-004: ErrorBoundary 集成到 LayoutShell

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-003 (ErrorBoundary 组件已创建)

## 目标
- [ ] 在 LayoutShell 中为四个区域添加 ErrorBoundary
- [ ] 确保单个区域崩溃不影响其他区域

---

## 步骤

### Step 1: 更新 LayoutShell.tsx

```typescript
// client/src/refactor_v2/components/LayoutShell.tsx

import React, { ReactNode } from "react";
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
  const { leftPanelWidth, rightPanelOpen } = useLayoutStore();
  const rightWidth = rightPanelOpen ? AI_PANEL_WIDTH : 0;

  return (
    <div
      className={`flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden ${className || ""}`}
    >
      {/* Left Pane with ErrorBoundary */}
      <div
        style={{ width: `${leftPanelWidth}px` }}
        className="border-r border-[var(--panel-border)] overflow-hidden flex flex-col flex-shrink-0"
      >
        <LeftPaneErrorBoundary>{left}</LeftPaneErrorBoundary>
      </div>

      {/* Center Pane */}
      <div
        style={{ marginRight: `${rightWidth}px` }}
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
      >
        {/* CenterTop with ErrorBoundary */}
        <div className="flex-[1.35] border-b border-[var(--panel-border)] overflow-hidden">
          <CenterTopErrorBoundary>{centerTop}</CenterTopErrorBoundary>
        </div>

        {/* CenterBottom with ErrorBoundary */}
        <div className="flex-[0.65] overflow-hidden relative">
          <CenterBottomErrorBoundary>{centerBottom}</CenterBottomErrorBoundary>
        </div>
      </div>

      {/* Right Pane (AI Panel) with ErrorBoundary */}
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

### Step 2: 创建测试组件验证 ErrorBoundary

创建一个临时测试组件来验证 ErrorBoundary 工作正常：

```typescript
// client/src/refactor_v2/components/__tests__/ErrorBoundaryTest.tsx
// (仅用于手动测试，验证后可删除)

import React, { useState } from "react";

export const ErrorThrower: React.FC<{ label: string }> = ({ label }) => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error(`测试错误 from ${label}`);
  }

  return (
    <button
      onClick={() => setShouldError(true)}
      className="px-3 py-2 bg-red-500/20 text-red-400 rounded text-sm"
    >
      点击触发 {label} 错误
    </button>
  );
};
```

### Step 3: 验证

```bash
pnpm check
```

手动验证步骤（可选）：
1. 在某个 pane 中放入 `<ErrorThrower label="Left" />`
2. 点击按钮触发错误
3. 确认只有该区域显示错误 UI，其他区域正常

---

## 验收标准

- [ ] LayoutShell 四个区域都有 ErrorBoundary 包裹
- [ ] 使用了正确的预配置 ErrorBoundary 组件
- [ ] `pnpm check` 通过
- [ ] （可选）手动测试单区域崩溃不影响其他区域

---

## 产出文件

- `client/src/refactor_v2/components/LayoutShell.tsx` (更新)
