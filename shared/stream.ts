/**
 * StreamEvent v1 protocol shared by client and server.
 */

export type StreamEventType =
  | "run_start"
  | "run_end"
  | "text_start"
  | "text_delta"
  | "text_end"
  | "thinking_start"
  | "thinking_delta"
  | "thinking_end"
  | "tool_call_start"
  | "tool_call_args_complete"
  | "tool_result"
  | "tool_error"
  | "error";

export interface StreamEventBase {
  eventVersion: 1;
  id: string;
  runId: string;
  type: StreamEventType;
  timestamp: number;
}

export interface ToolResultMeta {
  asOf: string;
  source?: string;
  latencyMs?: number;
  truncated?: boolean;
}

export interface RunStartEvent extends StreamEventBase {
  type: "run_start";
  data: {
    messageId: string;
    message: string;
    sessionId?: string;
    stockCode?: string;
  };
}

export interface RunEndEvent extends StreamEventBase {
  type: "run_end";
  data: {
    sessionId: string;
    status: "completed" | "error" | "cancelled";
    error?: string;
  };
}

export interface TextStartEvent extends StreamEventBase {
  type: "text_start";
  data: {
    messageId: string;
    role: "assistant";
  };
}

export interface TextDeltaEvent extends StreamEventBase {
  type: "text_delta";
  data: {
    messageId: string;
    delta: string;
  };
}

export interface TextEndEvent extends StreamEventBase {
  type: "text_end";
  data: {
    messageId: string;
  };
}

export interface ThinkingStartEvent extends StreamEventBase {
  type: "thinking_start";
  data: {
    thinkingId: string;
    messageId: string;
  };
}

export interface ThinkingDeltaEvent extends StreamEventBase {
  type: "thinking_delta";
  data: {
    thinkingId: string;
    messageId: string;
    delta: string;
  };
}

export interface ThinkingEndEvent extends StreamEventBase {
  type: "thinking_end";
  data: {
    thinkingId: string;
    messageId: string;
  };
}

export interface ToolCallStartEvent extends StreamEventBase {
  type: "tool_call_start";
  data: {
    toolCallId: string;
    name: string;
    messageId: string;
  };
}

export interface ToolCallArgsCompleteEvent extends StreamEventBase {
  type: "tool_call_args_complete";
  data: {
    toolCallId: string;
    messageId: string;
    args?: Record<string, unknown>;
  };
}

export interface ToolResultEvent extends StreamEventBase {
  type: "tool_result";
  data: {
    toolCallId: string;
    messageId: string;
    name: string;
    result?: string;
    summary?: string;
    rawRef?: string;
    meta?: ToolResultMeta;
  };
}

export interface ToolErrorEvent extends StreamEventBase {
  type: "tool_error";
  data: {
    toolCallId: string;
    messageId: string;
    name: string;
    error: string;
    summary?: string;
    meta?: ToolResultMeta;
  };
}

export interface ErrorEvent extends StreamEventBase {
  type: "error";
  data: {
    message: string;
  };
}

export type StreamEvent =
  | RunStartEvent
  | RunEndEvent
  | TextStartEvent
  | TextDeltaEvent
  | TextEndEvent
  | ThinkingStartEvent
  | ThinkingDeltaEvent
  | ThinkingEndEvent
  | ToolCallStartEvent
  | ToolCallArgsCompleteEvent
  | ToolResultEvent
  | ToolErrorEvent
  | ErrorEvent;

/**
 * SSE request params for GET /api/ai/stream?message=...&sessionId=...&stockCode=...
 */
export interface StreamRequestParams {
  message: string;
  sessionId?: string;
  stockCode?: string;
  useThinking?: boolean;
}
