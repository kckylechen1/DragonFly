/**
 * Chat Store - 聊天状态管理
 *
 * 负责人: GLM
 */

import { create } from "zustand";
import type { Message } from "../types/chat";

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentConversationId: string | null;
}

interface ChatActions {
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendContent: (id: string, delta: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  setConversationId: (id: string | null) => void;
  clearMessages: () => void;
}

export const useChatStoreV2 = create<ChatState & ChatActions>()(set => ({
  // State
  messages: [],
  isStreaming: false,
  currentConversationId: null,

  // Actions
  addMessage: message =>
    set(state => {
      // 防止重复添加相同 ID 的消息
      if (state.messages.some(m => m.id === message.id)) {
        console.warn("[chat.store] Duplicate message ID ignored:", message.id);
        return state;
      }
      return { messages: [...state.messages, message] };
    }),

  updateMessage: (id, updates) =>
    set(state => ({
      messages: state.messages.map(m =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  appendContent: (id, delta) =>
    set(state => ({
      messages: state.messages.map(m =>
        m.id === id ? { ...m, content: m.content + delta } : m
      ),
    })),

  setStreaming: isStreaming => set({ isStreaming }),

  setConversationId: id => set({ currentConversationId: id }),

  clearMessages: () => set({ messages: [], currentConversationId: null }),
}));
