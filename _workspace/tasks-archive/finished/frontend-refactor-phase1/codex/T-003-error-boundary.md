# T-003: 创建 ErrorBoundary 组件

## 负责 Agent: 🟢 Codex

## 目标
- [ ] 创建可复用的 ErrorBoundary 组件
- [ ] 支持自定义 fallback UI
- [ ] 支持错误重试功能
- [ ] 遵循 DRAGONFLY-REFACTOR.md 中的设计

---

## 步骤

### Step 1: 创建 ErrorBoundary 组件

```typescript
// client/src/refactor_v2/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <PanelErrorFallback
          title={this.props.title || "此区域"}
          error={this.state.error}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

// Default fallback component matching DRAGONFLY-REFACTOR.md design
interface PanelErrorFallbackProps {
  title: string;
  error: Error | null;
  onRetry: () => void;
  onReload: () => void;
}

function PanelErrorFallback({
  title,
  error,
  onRetry,
  onReload,
}: PanelErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-red-500/10">
      <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
      <p className="text-sm text-red-300 mb-1">{title} 加载失败</p>
      {error && (
        <p className="text-xs text-red-400/70 mb-4 max-w-[200px] text-center truncate">
          {error.message}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          重试
        </button>
        <button
          onClick={onReload}
          className="px-3 py-1.5 text-xs text-red-400 underline hover:text-red-300 transition-colors"
        >
          刷新页面
        </button>
      </div>
    </div>
  );
}

// Export a pre-configured version for each pane
export const LeftPaneErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => <ErrorBoundary title="自选股列表">{children}</ErrorBoundary>;

export const CenterTopErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => <ErrorBoundary title="K 线图区域">{children}</ErrorBoundary>;

export const CenterBottomErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => <ErrorBoundary title="信息面板">{children}</ErrorBoundary>;

export const RightPaneErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => <ErrorBoundary title="AI 面板">{children}</ErrorBoundary>;
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] ErrorBoundary 组件已创建
- [ ] 支持自定义 title 和 fallback
- [ ] 提供四区域的预配置版本
- [ ] UI 与 DRAGONFLY-REFACTOR.md 示例一致
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/ErrorBoundary.tsx`
