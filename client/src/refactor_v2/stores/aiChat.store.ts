import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIChatStore, AIMessage } from "@/refactor_v2/types/ai";
import { useLayoutStore } from "@/refactor_v2/stores/layout.store";

export const useAIChatStore = create<AIChatStore>()(
  persist(
    set => ({
      messages: [],
      isLoading: false,
      error: null,
      sessionId: null,
      thinkHard: false,
      followUpSuggestions: [],

      addMessage: message => {
        const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set(state => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id,
              createdAt: Date.now(),
            } satisfies AIMessage,
          ],
        }));
        return id;
      },

      setMessages: messages => set({ messages }),

      updateMessage: (id, updates) =>
        set(state => ({
          messages: state.messages.map(message =>
            message.id === id ? { ...message, ...updates } : message
          ),
        })),

      setIsLoading: loading => set({ isLoading: loading }),

      setError: error => set({ error }),

      setSessionId: sessionId => set({ sessionId }),

      setThinkHard: thinkHard => set({ thinkHard }),

      setFollowUpSuggestions: suggestions =>
        set({ followUpSuggestions: suggestions }),

      clearMessages: () => set({ messages: [], followUpSuggestions: [] }),
    }),
    { name: "ai-chat-store" }
  )
);

export const useAIPanelControl = () => {
  const { rightPanelOpen, openRightPanel, closeRightPanel, toggleRightPanel } =
    useLayoutStore();

  return {
    isOpen: rightPanelOpen,
    open: openRightPanel,
    close: closeRightPanel,
    toggle: toggleRightPanel,
  };
};
