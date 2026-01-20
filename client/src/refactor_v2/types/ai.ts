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
}

export interface AIChatActions {
  addMessage: (message: Omit<AIMessage, "id" | "createdAt">) => void;
  setIsLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export type AIChatStore = AIChatState & AIChatActions;
