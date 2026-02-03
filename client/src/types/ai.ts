import type { MessageRole } from "./chat";

export type MessageStatus = "streaming" | "done" | "error";

// Tool execution status
export type ToolStatus = "running" | "success" | "error";

// Tool call event from SSE stream
export interface ToolCallEvent {
  id?: string;
  name: string;
  args?: Record<string, any>;
  status: ToolStatus;
  duration?: number;
  preview?: string;
  error?: string;
  timestamp: number;
}

export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status?: MessageStatus;
  toolCalls?: ToolCallEvent[]; // Tool calls associated with this message
}

export interface AIChatState {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  thinkHard: boolean;
  followUpSuggestions: string[];
  activeToolCalls: ToolCallEvent[]; // Currently running tool calls
  thinkingMessage: string | null; // Current thinking/status message
}

export interface AIChatActions {
  addMessage: (message: Omit<AIMessage, "id" | "createdAt">) => string;
  setMessages: (messages: AIMessage[]) => void;
  updateMessage: (id: string, updates: Partial<AIMessage>) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  setThinkHard: (value: boolean) => void;
  setFollowUpSuggestions: (suggestions: string[]) => void;
  clearMessages: () => void;
  // New tool-related actions
  addToolCall: (toolCall: ToolCallEvent) => void;
  updateToolCall: (idOrName: string, updates: Partial<ToolCallEvent>) => void;
  clearToolCalls: () => void;
  setThinkingMessage: (message: string | null) => void;
}

export type AIChatStore = AIChatState & AIChatActions;
