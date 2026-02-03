/**
 * Market Store - 行情数据状态管理
 *
 * 负责人: GLM
 * ⚠️ CRITICAL: 这是 Codex 启动 C-001 的信号文件
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { MarketTick, KLine, OrderBook, StockInfo } from "../types/market";

interface MarketState {
  data: Record<string, MarketTick>;
  klineHistory: Record<string, KLine[]>;
  orderbook: Record<string, OrderBook>;
  stockInfo: Record<string, StockInfo>;
}

interface MarketActions {
  /**
   * ⚠️ CRITICAL: 批量更新 tick，由 tickBuffer 调用
   * 不要直接对每个 tick 调用 set
   */
  batchUpdateTicks: (updates: Record<string, MarketTick>) => void;
  setKlineHistory: (symbol: string, data: KLine[]) => void;
  appendKline: (symbol: string, kline: KLine) => void;
  setOrderbook: (symbol: string, orderbook: OrderBook) => void;
  setStockInfo: (symbol: string, info: StockInfo) => void;
}

export const useMarketStore = create<MarketState & MarketActions>()(
  subscribeWithSelector((set) => ({
    // State
    data: {},
    klineHistory: {},
    orderbook: {},
    stockInfo: {},

    // Actions
    batchUpdateTicks: (updates) =>
      set((state) => ({
        data: { ...state.data, ...updates },
      })),

    setKlineHistory: (symbol, data) =>
      set((state) => ({
        klineHistory: { ...state.klineHistory, [symbol]: data },
      })),

    appendKline: (symbol, kline) =>
      set((state) => ({
        klineHistory: {
          ...state.klineHistory,
          [symbol]: [...(state.klineHistory[symbol] || []), kline],
        },
      })),

    setOrderbook: (symbol, orderbook) =>
      set((state) => ({
        orderbook: { ...state.orderbook, [symbol]: orderbook },
      })),

    setStockInfo: (symbol, info) =>
      set((state) => ({
        stockInfo: { ...state.stockInfo, [symbol]: info },
      })),
  }))
);
