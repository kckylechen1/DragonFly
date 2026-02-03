/**
 * Realtime Module - 实时数据层入口
 *
 * 负责人: 🟢 Codex
 */

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
export { ConnectionStateMachine } from "./connectionStateMachine";
export { realtimeDebug } from "./realtimeDebug";
