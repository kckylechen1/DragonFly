/**
 * Chat Types - 聊天相关类型定义
 *
 * 负责人: GLM
 */

import type { StreamEvent, ToolResultMeta } from "@shared/stream";

export type MessageRole = "user" | "assistant" | "system";

/**
 * 工具调用状态
 */
export type ToolCallStatus = "pending" | "running" | "completed" | "failed";

/**
 * 工具调用
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: ToolCallStatus;
  result?: string;
  summary?: string;
  rawRef?: string;
  error?: string;
  meta?: ToolResultMeta;
  startTime: number;
  endTime?: number;
}

/**
 * 思考步骤
 */
export interface ThinkingStep {
  title: string;
  summary: string;
  completed: boolean;
}

/**
 * 聊天消息
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  thinking?: ThinkingStep[];
}

export type { StreamEvent };

/**
 * 聊天输入模式
 */
export type ChatMode = "analyze" | "trade" | "learn";

/**
 * 对话会话
 */
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
