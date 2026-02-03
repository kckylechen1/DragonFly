/**
 * Market Client - WebSocket 连接管理器
 *
 * 负责人: 🟢 Codex
 * ⏱️ 开始时间: 2026-01-30 00:00
 *
 * 功能：
 * 1. 管理 WebSocket 连接生命周期 (幂等性控制)
 * 2. 使用引用计数管理 symbol 订阅
 * 3. 自动重连（指数退避）
 * 4. 心跳检测
 */

import { tickBuffer } from "./tickBuffer";
import { ConnectionStateMachine } from "./connectionStateMachine";
import { realtimeDebug } from "./realtimeDebug";
import { useConnectionStore } from "../stores/connection.store";
import { useMarketStore } from "../stores/market.store";
import type { MarketTick, OrderBook } from "../types/market";

class MarketClient {
  private ws: WebSocket | null = null;
  private url: string = "";

  // ⚠️ Oracle P0: 状态机管理连接生命周期
  private fsm = new ConnectionStateMachine("IDLE");
  private connectGen = 0; // 代数 token 防止 stale callback

  // 订阅引用计数
  private refCount = new Map<string, number>();

  // 重连状态
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // 心跳
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatIntervalMs = 30000; // 30 秒

  /**
   * 连接 WebSocket
   * ⚠️ Oracle P0: 幂等性保证 - OPEN 或 CONNECTING 状态下不重复连接
   */
  connect(url: string = "ws://localhost:6888/ws") {
    this.url = url;

    // ⚠️ 幂等检查: OPEN 或 CONNECTING 都直接返回
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const gen = ++this.connectGen; // 递增代数，使旧回调失效
    this.fsm.transition("CONNECTING");
    this.updateConnectionStatus({ state: "connecting" });

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers(gen);
    } catch (error) {
      this.fsm.transition("ERROR");
      realtimeDebug.setError((error as Error).message);
      this.updateConnectionStatus({
        state: "error",
        lastError: error as Error,
      });
      this.scheduleReconnect();
    }
  }

  /**
   * 设置 WebSocket 事件处理
   * @param gen 代数 token，用于检测 stale 回调
   */
  private setupEventHandlers(gen: number) {
    if (!this.ws) return;

    this.ws.onopen = () => {
      // ⚠️ Stale 检查: 如果代数不匹配，说明这是旧连接的回调
      if (gen !== this.connectGen) return;

      this.reconnectAttempts = 0;
      this.fsm.transition("OPEN");
      realtimeDebug.setWsState("OPEN");
      this.updateConnectionStatus({
        state: "open",
        lastError: null,
        retryCount: 0,
      });
      this.startHeartbeat();
      this.resubscribeAll();
    };

    this.ws.onmessage = event => {
      if (gen !== this.connectGen) return;

      this.updateConnectionStatus({ lastMessageAt: Date.now() });

      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        realtimeDebug.setError("Parse error: " + (error as Error).message);
      }
    };

    this.ws.onclose = event => {
      if (gen !== this.connectGen) return;

      this.fsm.transition(event.wasClean ? "CLOSED" : "RECONNECTING");
      realtimeDebug.setWsState(event.wasClean ? "CLOSED" : "RECONNECTING");
      this.updateConnectionStatus({ state: "closed" });
      this.stopHeartbeat();

      // 非正常关闭时尝试重连
      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      if (gen !== this.connectGen) return;

      this.fsm.transition("ERROR");
      realtimeDebug.setWsState("ERROR");
      realtimeDebug.setError("WebSocket connection error");
      this.updateConnectionStatus({
        state: "error",
        lastError: new Error("WebSocket connection error"),
      });
    };
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(data: {
    type: string;
    symbol?: string;
    tick?: MarketTick;
    orderbook?: OrderBook;
  }) {
    switch (data.type) {
      case "tick":
        // ⚠️ CRITICAL: 写入缓冲而非直接更新 store
        if (data.symbol && data.tick) {
          tickBuffer.add(data.symbol, data.tick);
        }
        break;

      case "orderbook":
        // orderbook 更新频率较低，可以直接写入
        if (data.symbol && data.orderbook) {
          useMarketStore.getState().setOrderbook(data.symbol, data.orderbook);
        }
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
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.updateConnectionStatus({
      state: "connecting",
      retryCount: this.reconnectAttempts,
    });

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
    this.connectGen++; // 使所有旧回调失效
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
    this.fsm.transition("CLOSED");
    realtimeDebug.setWsState("CLOSED");
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
