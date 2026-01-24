export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "streaming" | "done" | "error";

export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status?: MessageStatus;
}

export interface AIChatState {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  thinkHard: boolean;
  followUpSuggestions: string[];
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
}

export type AIChatStore = AIChatState & AIChatActions;
