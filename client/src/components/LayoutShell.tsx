import React, { ReactNode } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import {
  AI_PANEL_WIDTH,
  CENTER_BOTTOM_MIN_SIZE,
  CENTER_TOP_MIN_SIZE,
} from "@/constants/layout";
import {
  CenterBottomErrorBoundary,
  CenterTopErrorBoundary,
  LeftPaneErrorBoundary,
  RightPaneErrorBoundary,
} from "@/components/ErrorBoundary";
import { useLayoutStore } from "@/stores/layout.store";

interface LayoutShellProps {
  left: ReactNode;
  centerTop: ReactNode;
  centerBottom: ReactNode;
  right: ReactNode;
  floatingElement?: ReactNode;
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
        <Panel
          defaultSize={leftPanelSize}
          minSize={10}
          maxSize={35}
          onResize={setLeftPanelSize}
          className="border-r border-[var(--panel-border)] overflow-hidden"
        >
          <LeftPaneErrorBoundary>{left}</LeftPaneErrorBoundary>
        </Panel>

        <ResizeHandle direction="horizontal" />

        <Panel
          className="flex flex-col overflow-hidden transition-all duration-300 relative"
          style={{ marginRight: `${rightWidth}px` }}
        >
          <PanelGroup direction="vertical" autoSaveId="dragonfly-layout-v">
            <Panel
              defaultSize={centerTopSize}
              minSize={CENTER_TOP_MIN_SIZE}
              maxSize={80}
              onResize={setCenterTopSize}
              className="overflow-hidden"
            >
              <CenterTopErrorBoundary>{centerTop}</CenterTopErrorBoundary>
            </Panel>

            <ResizeHandle direction="vertical" />

            <Panel
              minSize={CENTER_BOTTOM_MIN_SIZE}
              className="overflow-hidden relative"
            >
              <CenterBottomErrorBoundary>{centerBottom}</CenterBottomErrorBoundary>
            </Panel>
          </PanelGroup>

          {floatingElement}
        </Panel>
      </PanelGroup>

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
