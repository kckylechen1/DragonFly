/**
 * SSE stream event types shared by client and server.
 */

export type StreamEventType =
  | "thinking"
  | "tool_call"
  | "tool_result"
  | "content"
  | "done"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  data: unknown;
}

export interface ThinkingEvent {
  type: "thinking";
  data: string;
}

export interface ToolCallEvent {
  type: "tool_call";
  data: {
    toolCallId: string;
    name: string;
    args?: Record<string, unknown>;
  };
}

export interface ToolResultEvent {
  type: "tool_result";
  data: {
    toolCallId: string;
    name: string;
    ok: boolean;
    result?: string;
    error?: string;
    skipped?: boolean;
  };
}

export interface ContentEvent {
  type: "content";
  data: string;
}

export interface DoneEvent {
  type: "done";
  data: {
    sessionId: string;
    totalTokens?: number;
  };
}

export interface ErrorEvent {
  type: "error";
  data: string;
}

/**
 * SSE request params for GET /api/ai/stream?message=...&sessionId=...&stockCode=...
 */
export interface StreamRequestParams {
  message: string;
  sessionId?: string;
  stockCode?: string;
  useThinking?: boolean;
}
