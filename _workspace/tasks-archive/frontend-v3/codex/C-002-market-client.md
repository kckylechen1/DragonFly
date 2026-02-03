# C-002: 创建 Market Client

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- C-001 (Tick Buffer)
- C-000-connection-state-machine.md

## ⚠️ Oracle P0 护栏 - 使用状态机管理生命周期

## ⚠️ CRITICAL - 这是性能关键代码

## 目标
- [ ] 创建 `realtime/marketClient.ts`
- [ ] 实现 WebSocket 连接管理
- [ ] 实现订阅引用计数（refCount）
- [ ] 创建单元测试

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 482-527 行

---

## 问题背景

现有方案将 WebSocket 连接逻辑放在 Zustand store 内，导致：

- 副作用与状态耦合，难以测试
- 多个组件订阅同一 symbol 时会重复订阅
- 断线重连逻辑混乱

**解决方案**: 独立的 marketClient 模块，使用引用计数管理订阅。

---

## 步骤

### Step 1: 创建 marketClient.ts

```typescript
// client/src/refactor_v2/realtime/marketClient.ts

import { tickBuffer } from "./tickBuffer";
import { ConnectionStateMachine } from "./connectionStateMachine";
import { useConnectionStore } from "../stores/connection.store";
import { useMarketStore } from "../stores/market.store";

/**
 * WebSocket 连接管理器 (使用状态机控制)
 * 
 * 功能：
 * 1. 管理 WebSocket 连接生命周期 (幂等性控制)
 * 2. 使用引用计数管理 symbol 订阅
 * 3. 自动重连（指数退避）
 * 4. 心跳检测
 */
class MarketClient {
  private ws: WebSocket | null = null;
  private url: string = "";
  private stateMachine = new ConnectionStateMachine();
  
  // 订阅引用计数
  private refCount = new Map<string, number>();
  
  // 重连状态
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  // 心跳
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs = 30000; // 30 秒

  /**
   * 连接 WebSocket
   */
  connect(url: string = "wss://market-api/ws") {
    this.url = url;

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.updateConnectionStatus({ state: "connecting" });

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      this.updateConnectionStatus({
        state: "error",
        lastError: error as Error,
      });
      this.scheduleReconnect();
    }
  }

  /**
   * 设置 WebSocket 事件处理
   */
  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.updateConnectionStatus({
        state: "open",
        lastError: null,
        retryCount: 0,
      });
      this.startHeartbeat();
      this.resubscribeAll();
    };

    this.ws.onmessage = (event) => {
      this.updateConnectionStatus({ lastMessageAt: Date.now() });

      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = (event) => {
      this.updateConnectionStatus({ state: "closed" });
      this.stopHeartbeat();

      // 非正常关闭时尝试重连
      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.updateConnectionStatus({
        state: "error",
        lastError: new Error("WebSocket connection error"),
      });
    };
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(data: any) {
    switch (data.type) {
      case "tick":
        // ⚠️ CRITICAL: 写入缓冲而非直接更新 store
        tickBuffer.add(data.symbol, data.tick);
        break;

      case "orderbook":
        // orderbook 更新频率较低，可以直接写入
        useMarketStore.getState().setOrderbook(data.symbol, data.orderbook);
        break;

      case "pong":
        // 心跳响应，不需要处理
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  }

  /**
   * 订阅 symbol
   */
  subscribe(symbol: string) {
    const count = (this.refCount.get(symbol) || 0) + 1;
    this.refCount.set(symbol, count);

    // 只在首次订阅时发送请求
    if (count === 1 && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "subscribe", symbol }));
    }
  }

  /**
   * 取消订阅 symbol
   */
  unsubscribe(symbol: string) {
    const count = (this.refCount.get(symbol) || 0) - 1;
    this.refCount.set(symbol, Math.max(0, count));

    // 只在最后一个订阅者取消时发送请求
    if (count <= 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "unsubscribe", symbol }));
      this.refCount.delete(symbol);
    }
  }

  /**
   * 重新订阅所有 symbol（重连后使用）
   */
  private resubscribeAll() {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    this.refCount.forEach((count, symbol) => {
      if (count > 0) {
        this.ws!.send(JSON.stringify({ action: "subscribe", symbol }));
      }
    });
  }

  /**
   * 开始心跳
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, this.heartbeatIntervalMs);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 调度重连（指数退避）
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      return;
    }

    // 清除之前的重连定时器
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // 指数退避：1s, 2s, 4s, 8s, ... 最大 30s
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      30000
    );
    this.reconnectAttempts++;

    this.updateConnectionStatus({ retryCount: this.reconnectAttempts });

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.url);
    }, delay);
  }

  /**
   * 更新连接状态
   */
  private updateConnectionStatus(
    status: Partial<{
      state: "idle" | "connecting" | "open" | "degraded" | "closed" | "error";
      lastMessageAt: number;
      retryCount: number;
      lastError: Error | null;
    }>
  ) {
    useConnectionStore.getState().setWsStatus(status);
  }

  /**
   * 关闭连接
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  /**
   * 完全销毁（清理所有状态）
   */
  dispose() {
    this.disconnect();
    this.refCount.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * 获取当前订阅的 symbol 列表（用于调试）
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.refCount.entries())
      .filter(([, count]) => count > 0)
      .map(([symbol]) => symbol);
  }

  /**
   * 获取订阅引用计数（用于测试）
   */
  getRefCount(symbol: string): number {
    return this.refCount.get(symbol) || 0;
  }
}

// 单例导出
export const marketClient = new MarketClient();

// 也导出类供测试使用
export { MarketClient };
```

### Step 2: 更新 realtime/index.ts

```typescript
// client/src/refactor_v2/realtime/index.ts

import { tickBuffer } from "./tickBuffer";
import { marketClient } from "./marketClient";
import { useMarketStore } from "../stores/market.store";

/**
 * 初始化实时数据层
 * 在应用启动时调用一次
 */
export function initRealtime() {
  // 连接 tickBuffer 到 Zustand store
  tickBuffer.setFlushCallback((updates) => {
    useMarketStore.getState().batchUpdateTicks(updates);
  });
}

export { tickBuffer } from "./tickBuffer";
export { marketClient } from "./marketClient";
```

### Step 3: 创建单元测试

```typescript
// client/src/refactor_v2/realtime/__tests__/marketClient.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MarketClient } from "../marketClient";

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  
  readyState = WebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { wasClean: boolean }) => void) | null = null;
  onerror: (() => void) | null = null;
  
  sentMessages: string[] = [];

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.({ wasClean: true });
  }

  // 模拟连接打开
  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    this.onopen?.();
  }

  // 模拟收到消息
  simulateMessage(data: any) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe("MarketClient", () => {
  let client: MarketClient;
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = MockWebSocket as any;
    
    // Mock stores
    vi.mock("../stores/connection.store", () => ({
      useConnectionStore: {
        getState: () => ({
          setWsStatus: vi.fn(),
        }),
      },
    }));

    client = new MarketClient();
  });

  afterEach(() => {
    client.dispose();
    globalThis.WebSocket = originalWebSocket;
  });

  describe("subscribe/unsubscribe", () => {
    it("should track reference count", () => {
      client.connect("wss://test");
      MockWebSocket.instances[0].simulateOpen();

      client.subscribe("AAPL");
      expect(client.getRefCount("AAPL")).toBe(1);

      client.subscribe("AAPL");
      expect(client.getRefCount("AAPL")).toBe(2);

      client.unsubscribe("AAPL");
      expect(client.getRefCount("AAPL")).toBe(1);

      client.unsubscribe("AAPL");
      expect(client.getRefCount("AAPL")).toBe(0);
    });

    it("should only send subscribe message on first subscription", () => {
      client.connect("wss://test");
      const ws = MockWebSocket.instances[0];
      ws.simulateOpen();

      client.subscribe("AAPL");
      client.subscribe("AAPL");
      client.subscribe("AAPL");

      const subscribeMessages = ws.sentMessages.filter((m) =>
        m.includes("subscribe")
      );
      expect(subscribeMessages).toHaveLength(1);
    });

    it("should only send unsubscribe message on last unsubscription", () => {
      client.connect("wss://test");
      const ws = MockWebSocket.instances[0];
      ws.simulateOpen();

      client.subscribe("AAPL");
      client.subscribe("AAPL");
      client.unsubscribe("AAPL");
      client.unsubscribe("AAPL");

      const unsubscribeMessages = ws.sentMessages.filter((m) =>
        m.includes("unsubscribe")
      );
      expect(unsubscribeMessages).toHaveLength(1);
    });
  });

  describe("getSubscribedSymbols", () => {
    it("should return list of subscribed symbols", () => {
      client.connect("wss://test");
      MockWebSocket.instances[0].simulateOpen();

      client.subscribe("AAPL");
      client.subscribe("GOOG");
      client.subscribe("MSFT");

      expect(client.getSubscribedSymbols()).toEqual(["AAPL", "GOOG", "MSFT"]);
    });
  });
});
```

### Step 4: 验证

```bash
pnpm check
pnpm test -- --grep "marketClient"
```

---

## 验收标准

- [ ] `marketClient.ts` 已创建
- [ ] 实现订阅引用计数
- [ ] tick 写入 tickBuffer 而非直接写 store
- [ ] 有自动重连（指数退避）
- [ ] 有心跳检测
- [ ] 单元测试通过
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/realtime/marketClient.ts`
- `client/src/refactor_v2/realtime/index.ts` (更新)
- `client/src/refactor_v2/realtime/__tests__/marketClient.test.ts`
