/**
 * ChatWorkspace - 对话工作区容器 (Perplexity/Manus Style)
 *
 * 设计原则:
 * - 对话居中，最大宽度限制 (max-w-3xl)
 * - 输入框在底部固定，毛玻璃效果
 * - 空状态有引导性 UI
 * - 响应式：小屏幕时全宽
 */

import React, { Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ChatList, type ChatListHandle } from "./ChatList";
import { ChatInput } from "./ChatInput";
import { useStreamingChat } from "../../hooks/useStreamingChat";
import { useChatStoreV2 } from "../../stores/chat.store";
import { useUIStore } from "../../stores/ui.store";
import { toast } from "sonner";
import type { ChatMode } from "../../types/chat";

const PanelSkeleton = () => (
  <div className="flex-1 flex flex-col animate-pulse">
    <div className="flex-1 bg-[var(--bg-secondary)]/30" />
  </div>
);

/**
 * Thinking 骨架屏
 */
const ThinkingSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 px-4 py-3"
  >
    <div className="flex items-center gap-1.5">
      <div
        className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
    <span className="text-xs text-[var(--text-muted)]">AI 思考中...</span>
  </motion.div>
);

/**
 * 空状态组件 - Manus 风格
 */
const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center text-center max-w-md"
    >
      {/* Logo/Icon - Simplified */}
      <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-6">
        <Sparkles className="w-7 h-7 text-[var(--accent-primary)]" />
      </div>

      {/* Title */}
      <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">
        DragonFly AI
      </h2>

      {/* Subtitle */}
      <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
        智能股票分析助手，帮你洞察市场、解读数据、制定策略
      </p>

      {/* Quick Prompts */}
      <div className="flex flex-wrap justify-center gap-2">
        {["分析茅台最近走势", "比较腾讯和阿里", "AI概念股推荐"].map(
          (prompt, i) => (
            <button
              key={i}
              className="px-3 py-1.5 text-xs rounded-lg border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/5 transition-all"
            >
              {prompt}
            </button>
          )
        )}
      </div>
    </motion.div>
  </div>
);

/**
 * 聊天工作区容器
 */
export const ChatWorkspace: React.FC = () => {
  const messages = useChatStoreV2(s => s.messages);
  const isStreaming = useChatStoreV2(s => s.isStreaming);
  const currentSymbol = useUIStore(s => s.currentSymbol);
  const chatListRef = useRef<ChatListHandle>(null);

  const { sendMessage, isConnecting } = useStreamingChat({
    onError: error => {
      toast.error("连接失败", {
        description: error.message,
      });
    },
  });

  const handleSend = (message: string, _mode: ChatMode) => {
    chatListRef.current?.markUserSentMessage();
    sendMessage(message, currentSymbol);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* 消息渲染列表 - 居中限宽 */}
      <div className="flex-1 w-full flex flex-col overflow-hidden">
        <div className="flex-1 w-full max-w-[880px] mx-auto flex flex-col px-4 sm:px-6">
          {hasMessages ? (
            <Suspense fallback={<PanelSkeleton />}>
              <ChatList ref={chatListRef} />
            </Suspense>
          ) : (
            <EmptyState />
          )}

          {/* AI 思考中指示器 */}
          {(isStreaming || isConnecting) && <ThinkingSkeleton />}
        </div>
      </div>

      {/* 底部输入框区域 - 固定在底部，毛玻璃效果 */}
      <div className="w-full border-t border-[var(--panel-border)]/50 bg-[var(--bg-primary)]/60 backdrop-blur-lg">
        <div className="w-full max-w-[880px] mx-auto px-4 sm:px-6 py-4">
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
};

export default ChatWorkspace;
