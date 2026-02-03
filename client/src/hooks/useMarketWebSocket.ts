/**
 * Market WebSocket Hook
 *
 * 负责人: 🟢 Codex
 * ⏱️ 开始时间: 2026-01-30 00:00
 *
 * 作用：在组件生命周期内管理对特定 symbol 的订阅，并暴露连接状态。
 */

import { useEffect, useCallback, useMemo } from "react";
import { marketClient } from "../realtime/marketClient";
import { useConnectionStore } from "../stores/connection.store";

interface UseMarketWSProps {
  symbols: string[];
  autoConnect?: boolean;
}

export function useMarketWebSocket({
  symbols,
  autoConnect = true,
}: UseMarketWSProps) {
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

  // Memoize symbols key to avoid unnecessary effect triggers
  const symbolsKey = useMemo(() => symbols.join(","), [symbols]);

  // ⚠️ 维护订阅引用计数
  useEffect(() => {
    if (symbols.length === 0) return;

    // 订阅
    symbols.forEach((symbol) => marketClient.subscribe(symbol));

    return () => {
      // 取消订阅
      symbols.forEach((symbol) => marketClient.unsubscribe(symbol));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

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
