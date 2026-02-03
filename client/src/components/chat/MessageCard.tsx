/**
 * MessageCard - Kimi 风格消息卡片
 *
 * 设计特点:
 * - 用户消息：右对齐，深色圆角气泡，无头像
 * - AI 消息：左对齐，无背景，有小 logo
 * - 极简主义，大量留白
 */

import { useState } from "react";
import { memo, type FC } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, RefreshCw } from "lucide-react";
import type { Message } from "../../types/chat";
import { ToolCard } from "./ToolCard";
import { ThinkingCard } from "./ThinkingCard";

interface MessageCardProps {
  message: Message;
}

// DragonFly Logo 小图标
const AILogo = () => (
  <div className="w-5 h-5 rounded bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] text-[10px] font-medium">
    AI
  </div>
);

export const MessageCard: FC<MessageCardProps> = memo(({ message }) => {
  const isAI = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 用户消息 - 右对齐，深色气泡
  if (!isAI) {
    return (
      <div className="flex justify-end py-4">
        <div className="max-w-[85%] px-5 py-3 rounded-[12px] rounded-tr-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-base leading-normal font-medium border border-[var(--panel-border)]">
          {message.content}
        </div>
      </div>
    );
  }

  // AI 消息 - 左对齐，无背景
  return (
    <div className="py-4">
      {/* AI 头像行 */}
      <div className="flex items-center gap-2 mb-2">
        <AILogo />
        <span className="text-sm text-[var(--text-secondary)] font-semibold">
          DragonFly
        </span>
      </div>

      {/* 思考过程 */}
      {message.thinking && message.thinking.length > 0 && (
        <div className="ml-8 mb-3">
          <ThinkingCard steps={message.thinking} />
        </div>
      )}

      {/* 消息正文 */}
      <div className="ml-8 text-[var(--text-primary)]">
        <div
          className="prose prose-base max-w-none dark:prose-invert
          prose-headings:text-[var(--text-primary)] prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
          prose-p:text-[var(--text-primary)] prose-p:leading-normal prose-p:text-[15px] prose-p:my-2
          prose-strong:text-[var(--text-primary)] prose-strong:font-semibold
          prose-code:text-rose-500 prose-code:bg-rose-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-mono
          prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-[var(--panel-border)] prose-pre:rounded-lg prose-pre:my-3 prose-pre:text-sm prose-pre:font-mono
          prose-a:text-rose-500 prose-a:no-underline hover:prose-a:underline
          prose-li:text-[var(--text-primary)] prose-li:my-0.5
          prose-ul:my-2 prose-ol:my-2
          prose-blockquote:text-[var(--text-secondary)] prose-blockquote:border-l-2 prose-blockquote:border-rose-500 prose-blockquote:pl-4 prose-blockquote:not-italic
        "
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* 工具调用 */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="ml-8 flex flex-wrap gap-2 mt-3">
          {message.toolCalls.map(tc => (
            <ToolCard key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}

      {/* 操作栏 */}
      <div className="ml-8 flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
        >
          {copied ? (
            <Check size={12} className="text-emerald-500" />
          ) : (
            <Copy size={12} />
          )}
          <span>复制</span>
        </button>
        <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
          <RefreshCw size={12} />
          <span>重试</span>
        </button>
      </div>
    </div>
  );
});

MessageCard.displayName = "MessageCard";

export default MessageCard;
