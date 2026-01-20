export type MessageRole = "user" | "assistant";
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
}

export interface AIChatActions {
  addMessage: (message: Omit<AIMessage, "id" | "createdAt">) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export type AIChatStore = AIChatState & AIChatActions;
