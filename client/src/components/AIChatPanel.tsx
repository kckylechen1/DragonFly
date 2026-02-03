import React, { useEffect, useMemo, useState } from "react";
import { Brain, History, Square, SquarePen, X } from "lucide-react";
import {
  useActiveTodoRun,
  useAIHistory,
  useCreateSession,
  useLatestTodoRun,
  useStockExtras,
  useStockQuote,
} from "@/api";
import {
  useAIPanelControl,
  useAIChatStore,
} from "@/stores/aiChat.store";
import { useWatchlistStore } from "@/stores/watchlist.store";
import { useAIChatActions } from "@/hooks/useAIChatActions";
import { ChatHistoryList } from "@/components/ai/ChatHistoryList";
import { TaskExecutionPanel } from "@/components/ai/TaskExecutionPanel";
import { ToolCallsPanel } from "@/components/ai/ToolCallsPanel";
import { PresetPrompts } from "@/components/ai/PresetPrompts";

const LoadingDots = () => (
  <div className="flex items-center gap-1">
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
);

export const AIChatPanel: React.FC = () => {
  const { currentSymbol } = useWatchlistStore();
  const { data: quote } = useStockQuote(currentSymbol);
  const { data: extras } = useStockExtras(currentSymbol);
  const { close } = useAIPanelControl();
  const createSessionMutation = useCreateSession();
  const { sendMessage, stopStreaming } = useAIChatActions();

  const {
    messages,
    isLoading,
    error,
    sessionId,
    thinkHard,
    followUpSuggestions,
    activeToolCalls,
    thinkingMessage,
    setMessages,
    clearMessages,
    setThinkHard,
    setSessionId,
    setFollowUpSuggestions,
  } = useAIChatStore();

  const [showHistory, setShowHistory] = useState(false);
  const [autoLoadHistory, setAutoLoadHistory] = useState(true);

  const { data: historyData } = useAIHistory({
    sessionId: sessionId || undefined,
    stockCode: autoLoadHistory ? currentSymbol || undefined : undefined,
  });

  const { data: activeTodoRun } = useActiveTodoRun(
    sessionId || undefined,
    isLoading
  );
  const { data: latestTodoRun } = useLatestTodoRun(sessionId || undefined);
  const todoRun = activeTodoRun ?? latestTodoRun;

  useEffect(() => {
    if (!currentSymbol) {
      setSessionId(null);
      setMessages([]);
      setFollowUpSuggestions([]);
      return;
    }
    setSessionId(null);
    setMessages([]);
    setFollowUpSuggestions([]);
    setAutoLoadHistory(true);
  }, [currentSymbol, setMessages, setSessionId, setFollowUpSuggestions]);

  useEffect(() => {
    if (!historyData) return;

    const normalized = historyData.messages
      .filter(message => message.role !== "system")
      .map((message, index) => ({
        id: `history-${historyData.sessionId || "new"}-${index}`,
        role: message.role,
        content: message.content,
        createdAt: Date.now() - (historyData.messages.length - index) * 1000,
        status: "done" as const,
      }));

    setMessages(normalized);
    setFollowUpSuggestions([]);

    if (historyData.sessionId && historyData.sessionId !== sessionId) {
      setSessionId(historyData.sessionId);
    } else if (!historyData.sessionId && sessionId) {
      setSessionId(null);
    }
  }, [
    historyData,
    setMessages,
    setSessionId,
    setFollowUpSuggestions,
    sessionId,
  ]);

  const stockContext = useMemo(() => {
    if (!quote) return null;
    return {
      quote: {
        name: quote.name,
        code: currentSymbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        preClose: quote.preClose,
        volume: quote.volume,
        amount: quote.amount,
        turnoverRate: quote.turnoverRate,
        pe: quote.pe,
        pb: quote.pb,
        marketCap: quote.marketCap,
        circulationMarketCap: quote.circulationMarketCap,
        volumeRatio: quote.volumeRatio,
      },
      capitalFlow: extras?.capitalFlow
        ? {
            mainNetInflow: extras.capitalFlow.mainNetInflow,
            superLargeNetInflow: extras.capitalFlow.superLargeNetInflow,
            largeNetInflow: extras.capitalFlow.largeNetInflow,
            mediumNetInflow: extras.capitalFlow.mediumNetInflow,
            smallNetInflow: extras.capitalFlow.smallNetInflow,
          }
        : null,
    };
  }, [quote, extras, currentSymbol]);

  const handleSend = (message: string) => {
    sendMessage(message, {
      stockCode: currentSymbol || undefined,
      stockContext,
    });
  };

  const handleNewSession = async () => {
    clearMessages();
    setFollowUpSuggestions([]);
    setAutoLoadHistory(false);
    try {
      const result = await createSessionMutation.mutateAsync(
        currentSymbol || undefined
      );
      setSessionId(result.sessionId);
    } catch {
      setSessionId(null);
    }
  };

  if (showHistory) {
    return (
      <ChatHistoryList
        stockCode={currentSymbol || null}
        onSelectSession={selectedSessionId => {
          setSessionId(selectedSessionId);
          setMessages([]);
          setAutoLoadHistory(false);
          setShowHistory(false);
        }}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--panel-border)]">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)]">AI 分析</h3>
          {currentSymbol && (
            <span className="text-xs text-[var(--text-muted)] truncate max-w-[120px]">
              {quote?.name || currentSymbol}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setThinkHard(!thinkHard)}
            className={`h-7 px-2 rounded text-xs border transition-colors ${
              thinkHard
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                : "border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title="深度模式"
          >
            <Brain className="h-3.5 w-3.5 inline-block mr-1" />
            深度
          </button>
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)] transition-colors"
            title="历史对话"
          >
            <History className="h-4 w-4 text-[var(--text-primary)]" />
          </button>
          <button
            type="button"
            onClick={handleNewSession}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)] transition-colors"
            title="新建对话"
          >
            <SquarePen className="h-4 w-4 text-[var(--text-primary)]" />
          </button>
          {isLoading && (
            <button
              type="button"
              onClick={stopStreaming}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)] transition-colors"
              title="停止生成"
            >
              <Square className="h-4 w-4 text-[var(--text-primary)]" />
            </button>
          )}
          <button
            type="button"
            onClick={close}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)] transition-colors"
            title="关闭"
          >
            <X className="h-4 w-4 text-[var(--text-primary)]" />
          </button>
        </div>
      </div>

      {!hasMessages && !isLoading && <PresetPrompts onSend={handleSend} />}

      {todoRun && <TaskExecutionPanel todoRun={todoRun} />}

      {/* Show real-time tool calls when loading */}
      {isLoading && (
        <ToolCallsPanel
          toolCalls={activeToolCalls}
          thinkingMessage={thinkingMessage}
          isLoading={isLoading}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasMessages && !isLoading && (
          <p className="text-center text-[var(--text-muted)] py-8">
            开始提问以获取 AI 分析...
          </p>
        )}
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              }`}
            >
              {message.role === "assistant" &&
              message.status === "streaming" &&
              !message.content ? (
                <LoadingDots />
              ) : (
                <span className="whitespace-pre-wrap">{message.content}</span>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-lg max-w-[80%]">
              <LoadingDots />
            </div>
          </div>
        )}

        {followUpSuggestions.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 pt-2">
            {followUpSuggestions.slice(0, 3).map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
                className="px-3 py-1.5 text-xs rounded-full border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-2">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
      </div>

      {hasMessages && (
        <div className="border-t border-[var(--panel-border)] p-4">
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setSessionId(null);
              setFollowUpSuggestions([]);
              setAutoLoadHistory(false);
            }}
            className="w-full px-3 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors text-sm"
          >
            清空对话
          </button>
        </div>
      )}
    </div>
  );
};
