/**
 * Connection Types - 连接状态类型定义
 *
 * 负责人: GLM
 * 参考: FRONTEND_REFACTOR_REVIEW.md 第 828-850 行
 */

/**
 * 连接状态
 */
export type ConnectionState =
  | "idle"
  | "connecting"
  | "open"
  | "degraded"
  | "closed"
  | "error";

/**
 * 连接状态详情
 */
export interface ConnectionStatus {
  state: ConnectionState;
  lastMessageAt: number | null;
  retryCount: number;
  lastError: Error | null;
}
