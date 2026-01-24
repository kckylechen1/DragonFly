import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Lightbulb, Send, Sparkles } from "lucide-react";
import {
  useAIPanelControl,
} from "@/refactor_v2/stores/aiChat.store";
import { useStockExtras, useStockQuote } from "@/refactor_v2/api";
import { useWatchlistStore } from "@/refactor_v2/stores/watchlist.store";
import { useAIChatActions } from "@/refactor_v2/hooks/useAIChatActions";

export interface FloatingAIChatInputHandle {
  focus: () => void;
}

export const FloatingAIChatInput = forwardRef<FloatingAIChatInputHandle, {}>(
  (_, ref) => {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const { open, close } = useAIPanelControl();
    const { currentSymbol } = useWatchlistStore();
    const { data: quote } = useStockQuote(currentSymbol);
    const { data: extras } = useStockExtras(currentSymbol);
    const { sendMessage } = useAIChatActions();

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const handleSend = async () => {
      if (!input.trim()) return;
      const userMessage = input.trim();
      setInput("");
      open();

      const stockContext = quote
        ? {
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
          }
        : null;

      await sendMessage(userMessage, {
        stockCode: currentSymbol || undefined,
        stockContext,
      });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        close();
        inputRef.current?.blur();
      }
    };

    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[768px] z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-2xl" />
          <div className="relative flex items-center gap-2 glass rounded-2xl px-4 py-3 shadow-[var(--shadow-glow)] focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all duration-200">
            <Sparkles className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="问 AI 关于这只股票的问题... (⌘K 聚焦)"
              className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
            <button
              onClick={() => {
                /* TODO: 示例问题下拉 */
              }}
              className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
              title="示例问题"
            >
              <Lightbulb className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <button
              onClick={handleSend}
              className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
              title="发送 (Enter)"
            >
              <Send className="w-5 h-5 text-[var(--accent-primary)]" />
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
          <span>⌘K 聚焦</span>
          <span>⌘I 切换面板</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    );
  }
);

FloatingAIChatInput.displayName = "FloatingAIChatInput";
