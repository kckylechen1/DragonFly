/**
 * Connection Store - 连接状态管理
 *
 * 负责人: GLM
 * 参考: FRONTEND_REFACTOR_REVIEW.md 第 828-850 行
 */

import { create } from "zustand";
import type { ConnectionStatus } from "../types/connection";

interface ConnectionStore {
  wsStatus: ConnectionStatus;
  sseStatus: ConnectionStatus;
  setWsStatus: (status: Partial<ConnectionStatus>) => void;
  setSseStatus: (status: Partial<ConnectionStatus>) => void;
}

const initialStatus: ConnectionStatus = {
  state: "idle",
  lastMessageAt: null,
  retryCount: 0,
  lastError: null,
};

export const useConnectionStore = create<ConnectionStore>()((set) => ({
  wsStatus: { ...initialStatus },
  sseStatus: { ...initialStatus },

  setWsStatus: (status) =>
    set((state) => ({ wsStatus: { ...state.wsStatus, ...status } })),

  setSseStatus: (status) =>
    set((state) => ({ sseStatus: { ...state.sseStatus, ...status } })),
}));
