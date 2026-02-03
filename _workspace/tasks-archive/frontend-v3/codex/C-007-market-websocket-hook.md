# C-007: Market WebSocket Hook

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- C-002 (Market Client)

## 目标
- [ ] 创建 `hooks/useMarketWebSocket.ts`
- [ ] 封装 `marketClient` 的订阅逻辑
- [ ] 提供连接状态的声明式访问

---

## 步骤

### Step 1: 创建 hooks/useMarketWebSocket.ts

```typescript
// client/src/refactor_v2/hooks/useMarketWebSocket.ts

import { useEffect, useCallback } from "react";
import { marketClient } from "../realtime/marketClient";
import { useConnectionStore } from "../stores/connection.store";

interface UseMarketWSProps {
  symbols: string[];
  autoConnect?: boolean;
}

/**
 * 市场行情 WebSocket Hook
 * 
 * 作用：在组件生命周期内管理对特定 symbol 的订阅，并暴露连接状态。
 */
export function useMarketWebSocket({ symbols, autoConnect = true }: UseMarketWSProps) {
  const wsStatus = useConnectionStore((s) => s.wsStatus);

  // 连接函数
  const connect = useCallback(() => {
    marketClient.connect();
  }, []);

  // 断开函数
  const disconnect = useCallback(() => {
    marketClient.disconnect();
  }, []);

  useEffect(() => {
    if (autoConnect) {
      marketClient.connect();
    }
  }, [autoConnect]);

  // ⚠️ 维护订阅引用计数
  useEffect(() => {
    if (symbols.length === 0) return;

    // 订阅
    symbols.forEach(symbol => marketClient.subscribe(symbol));

    return () => {
      // 取消订阅
      symbols.forEach(symbol => marketClient.unsubscribe(symbol));
    };
  }, [symbols.join(',')]);

  return {
    connect,
    disconnect,
    status: wsStatus.state,
    isConnected: wsStatus.state === "open",
    retryCount: wsStatus.retryCount,
    lastMessageAt: wsStatus.lastMessageAt,
    lastError: wsStatus.lastError,
  };
}
```

### Step 2: 更新 hooks/index.ts

```typescript
// client/src/refactor_v2/hooks/index.ts

export * from "./useMarketWebSocket";
```

### Step 3: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `useMarketWebSocket.ts` 已创建
- [ ] 实现组件卸载时自动减少 `refCount`（核心 C-002 逻辑验证）
- [ ] 暴露 `isConnected` 和 `status` 等状态
- [ ] `pnpm check` 通道

---

## 产出文件

- `client/src/refactor_v2/hooks/useMarketWebSocket.ts`
- `client/src/refactor_v2/hooks/index.ts`
