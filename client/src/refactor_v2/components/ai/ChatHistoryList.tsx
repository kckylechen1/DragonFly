import React from "react";
import { ArrowLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useAISessions } from "@/refactor_v2/api";

interface ChatHistoryListProps {
  onSelectSession: (sessionId: string) => void;
  onBack: () => void;
  stockCode: string | null;
}

export function ChatHistoryList({
  onSelectSession,
  onBack,
  stockCode,
}: ChatHistoryListProps) {
  const { data: sessions, isLoading } = useAISessions(stockCode || undefined);

  return (
    <div className="h-full flex flex-col bg-[var(--panel-bg)]">
      <div className="p-3 border-b border-[var(--panel-border)] flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)] transition-colors"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 text-[var(--text-primary)]" />
        </button>
        <span className="font-semibold text-[var(--text-primary)]">
          历史对话
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--panel-border)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-1">
            {sessions.map(session => (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-left group"
              >
                <div className="size-9 shrink-0 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-[var(--accent-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--text-primary)] truncate">
                    {session.stockCode}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {session.lastMessage}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[var(--text-muted)] tabular-nums">
                    {session.messageCount} 条
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
            <MessageCircle className="h-12 w-12 opacity-20 mb-3" />
            <p className="text-sm">暂无历史对话</p>
            <p className="text-xs mt-1 opacity-60">开始对话后会自动保存</p>
          </div>
        )}
      </div>
    </div>
  );
}
