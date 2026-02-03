/**
 * ChatInput - 聊天输入组件 (Perplexity Style)
 *
 * 设计原则:
 * - 简洁单行输入，可自动扩展
 * - 模式选择器更紧凑
 * - 使用主题变量确保对比度
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Brain, Landmark, ArrowUp } from "lucide-react";
import { useAIChatStore } from "@/stores/aiChat.store";
import type { ChatMode } from "../../types/chat";

interface ChatInputProps {
  onSend?: (message: string, mode: ChatMode) => void;
}

/**
 * 聊天输入组件 - Perplexity 风格
 */
export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("analyze");
  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = useAIChatStore(s => s.isLoading);

  // 使用 CSS field-sizing 替代 JavaScript 动态调整
  // 浏览器原生支持，性能更好

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend?.(input.trim(), mode);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // 忽略输入法组合过程中的 Enter
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full">
      {/* 输入框容器 */}
      <div
        className={`
          relative rounded-[24px] border transition-all duration-200
          ${
            isFocused
              ? "border-[var(--color-primary)]/30 shadow-lg"
              : "border-[var(--panel-border)]"
          }
          bg-[var(--bg-primary)]
        `}
      >
        {/* 模式选择器 - 内嵌在输入框上方 */}
        <div className="flex items-center gap-1 px-3 pt-3 pb-1">
          <ModeButton
            active={mode === "analyze"}
            onClick={() => setMode("analyze")}
            icon={<Brain size={12} />}
            label="分析"
          />
          <ModeButton
            active={mode === "trade"}
            onClick={() => setMode("trade")}
            icon={<Landmark size={12} />}
            label="策略"
          />
          <ModeButton
            active={mode === "learn"}
            onClick={() => setMode("learn")}
            icon={<Sparkles size={12} />}
            label="学习"
          />
        </div>

        {/* 输入框 */}
        <div className="relative flex items-end gap-2 px-3 pb-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="输入问题，Enter 发送，Shift+Enter 换行"
            className="flex-1 bg-transparent text-base leading-normal text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none min-h-[24px] max-h-[160px] py-1 field-sizing-content"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`
              flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all
              ${
                input.trim() && !isLoading
                  ? "bg-[var(--color-primary)] text-white hover:opacity-90 shadow-md shadow-[var(--color-primary)]/30"
                  : "bg-[var(--panel-border)] text-[var(--text-muted)] cursor-not-allowed"
              }
            `}
            aria-label="发送"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 免责声明 */}
      <p className="text-[10px] text-[var(--text-muted)] text-center mt-2">
        AI 生成内容仅供参考，不构成投资建议
      </p>
    </div>
  );
};

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const ModeButton: React.FC<ModeButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all
      ${
        active
          ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      }
    `}
  >
    {icon}
    {label}
  </button>
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
