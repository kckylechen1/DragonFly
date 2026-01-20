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

      addMessage: message =>
        set(state => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              createdAt: Date.now(),
            } satisfies AIMessage,
          ],
        })),

      setIsLoading: loading => set({ isLoading: loading }),

      setError: error => set({ error }),

      clearMessages: () => set({ messages: [] }),
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
