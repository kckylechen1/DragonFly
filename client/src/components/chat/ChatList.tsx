/**
 * ChatList - 消息列表组件
 *
 * 设计原则:
 * - 智能滚动：用户在底部时自动滚动，向上查看时保持位置
 * - 新消息按钮：有新消息时显示浮动按钮
 * - 流式输出节流：150ms 节流避免过度滚动
 * - 性能优化：content-visibility
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useChatStoreV2 } from "../../stores/chat.store";
import { MessageCard } from "./MessageCard";

const BOTTOM_THRESHOLD = 100;
const SCROLL_THROTTLE_MS = 150;

interface ScrollState {
  isNearBottom: boolean;
  newMessageCount: number;
  lastScrollTime: number;
}

/**
 * 智能滚动 Hook
 */
function useSmartScroll(
  containerRef: React.RefObject<HTMLDivElement | null>,
  messagesLength: number,
  isStreaming: boolean
) {
  const [state, setState] = useState<ScrollState>({
    isNearBottom: true,
    newMessageCount: 0,
    lastScrollTime: 0,
  });

  const prevMessagesLengthRef = useRef(messagesLength);
  const userSentMessageRef = useRef(false);

  const checkIsNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD;
  }, [containerRef]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      if (!container) return;
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
      setState(s => ({ ...s, isNearBottom: true, newMessageCount: 0 }));
    },
    [containerRef]
  );

  const handleScroll = useCallback(() => {
    const now = Date.now();
    setState(prev => {
      if (now - prev.lastScrollTime < SCROLL_THROTTLE_MS) return prev;
      const isNearBottom = checkIsNearBottom();
      return {
        ...prev,
        isNearBottom,
        newMessageCount: isNearBottom ? 0 : prev.newMessageCount,
        lastScrollTime: now,
      };
    });
  }, [checkIsNearBottom]);

  const markUserSentMessage = useCallback(() => {
    userSentMessageRef.current = true;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef, handleScroll]);

  useEffect(() => {
    if (userSentMessageRef.current) {
      userSentMessageRef.current = false;
      scrollToBottom("auto");
      prevMessagesLengthRef.current = messagesLength;
      return;
    }

    const newCount = messagesLength - prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messagesLength;

    if (newCount <= 0) return;

    if (state.isNearBottom) {
      scrollToBottom("smooth");
    } else {
      setState(s => ({
        ...s,
        newMessageCount: s.newMessageCount + newCount,
      }));
    }
  }, [messagesLength, state.isNearBottom, scrollToBottom]);

  useEffect(() => {
    if (!isStreaming || !state.isNearBottom) return;

    const throttledScroll = () => {
      const now = Date.now();
      if (now - state.lastScrollTime >= SCROLL_THROTTLE_MS) {
        scrollToBottom("auto");
      }
    };

    const interval = setInterval(throttledScroll, SCROLL_THROTTLE_MS);
    return () => clearInterval(interval);
  }, [isStreaming, state.isNearBottom, state.lastScrollTime, scrollToBottom]);

  return {
    isNearBottom: state.isNearBottom,
    newMessageCount: state.newMessageCount,
    scrollToBottom,
    markUserSentMessage,
  };
}

/**
 * 新消息浮动按钮
 */
const NewMessageButton: React.FC<{
  count: number;
  onClick: () => void;
}> = ({ count, onClick }) => (
  <motion.button
    initial={{ opacity: 0, y: 10, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.9 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-primary)] text-white text-xs font-medium shadow-lg hover:bg-[var(--accent-primary-hover)] transition-colors"
  >
    <ChevronDown className="w-3.5 h-3.5" />
    <span>新消息 ({count})</span>
  </motion.button>
);

export interface ChatListHandle {
  markUserSentMessage: () => void;
}

/**
 * 消息列表组件
 */
export const ChatList = React.memo(
  React.forwardRef<ChatListHandle, object>((_, ref) => {
    const messages = useChatStoreV2(s => s.messages);
    const isStreaming = useChatStoreV2(s => s.isStreaming);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { isNearBottom, newMessageCount, scrollToBottom, markUserSentMessage } =
      useSmartScroll(scrollRef, messages.length, isStreaming);

    React.useImperativeHandle(
      ref,
      () => ({
        markUserSentMessage,
      }),
      [markUserSentMessage]
    );

    const showNewMessageButton = !isNearBottom && newMessageCount > 0;

    return (
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto py-6 space-y-6 scroll-smooth chat-list-scroll"
        >
          {messages.map(message => (
            <div
              key={message.id}
              className="group"
              style={{ contentVisibility: "auto" } as React.CSSProperties}
            >
              <MessageCard message={message} />
            </div>
          ))}
          <div className="h-4" />
        </div>

        <AnimatePresence>
          {showNewMessageButton && (
            <NewMessageButton
              count={newMessageCount}
              onClick={() => scrollToBottom("smooth")}
            />
          )}
        </AnimatePresence>
      </div>
    );
  })
);

ChatList.displayName = "ChatList";

export default ChatList;
