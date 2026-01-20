import React from "react";
import { Copy, RotateCcw, ThumbsUp, X } from "lucide-react";
import {
  useAIChatStore,
  useAIPanelControl,
} from "@/refactor_v2/stores/aiChat.store";

export const AIChatPanel: React.FC = () => {
  const { messages, isLoading, error, clearMessages } = useAIChatStore();
  const { close } = useAIPanelControl();

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--panel-border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">AI 分析</h3>
        <button
          onClick={close}
          className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
        >
          <X className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading ? (
          <p className="text-center text-[var(--text-muted)] py-8">
            开始提问以获取 AI 分析...
          </p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-[var(--accent-primary)] text-white"
                    : "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                }`}
              >
                {msg.content}

                {msg.role === "assistant" && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-[var(--panel-border)]">
                    <button className="p-1 hover:opacity-75">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:opacity-75">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:opacity-75">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-lg max-w-[80%]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-[var(--text-secondary)] text-sm">
                  AI 正在思考...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-center py-2">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {messages.length > 0 && (
        <div className="border-t border-[var(--panel-border)] p-4">
          <button
            onClick={clearMessages}
            className="w-full px-3 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors text-sm"
          >
            清空对话
          </button>
        </div>
      )}
    </div>
  );
};
