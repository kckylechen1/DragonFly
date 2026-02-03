import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Wrench,
} from "lucide-react";
import type { ToolCallEvent } from "@/types/ai";

interface ToolCallsPanelProps {
  toolCalls: ToolCallEvent[];
  thinkingMessage: string | null;
  isLoading: boolean;
}

const TOOL_DISPLAY_NAMES: Record<string, { icon: string; name: string }> = {
  search_stock: { icon: "🔍", name: "搜索股票" },
  get_stock_quote: { icon: "📊", name: "获取实时行情" },
  comprehensive_analysis: { icon: "🏥", name: "综合诊断" },
  get_fund_flow: { icon: "💰", name: "资金流向" },
  get_fund_flow_history: { icon: "💹", name: "资金历史" },
  get_kline_data: { icon: "📈", name: "K线数据" },
  analyze_minute_patterns: { icon: "⏱️", name: "分时形态" },
  get_guba_hot_rank: { icon: "🔥", name: "股吧热度" },
  get_market_status: { icon: "🌍", name: "大盘状态" },
  get_market_news: { icon: "📰", name: "市场资讯" },
  get_longhu_bang: { icon: "🐲", name: "龙虎榜" },
  analyze_stock_technical: { icon: "📉", name: "技术分析" },
  delegate_to_glm: { icon: "🤖", name: "调用助手" },
};

function getToolDisplay(name: string): { icon: string; name: string } {
  return TOOL_DISPLAY_NAMES[name] || { icon: "🔧", name: name };
}

export function ToolCallsPanel({
  toolCalls,
  thinkingMessage,
  isLoading,
}: ToolCallsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 当正在加载时，即使没有工具调用也显示思考状态
  if (!isLoading && toolCalls.length === 0 && !thinkingMessage) {
    return null;
  }

  const runningCount = toolCalls.filter(t => t.status === "running").length;
  const completedCount = toolCalls.filter(t => t.status === "success").length;
  const totalCount = toolCalls.length;

  // 获取显示的状态消息
  const getStatusMessage = () => {
    if (thinkingMessage) {
      return thinkingMessage;
    }
    if (runningCount > 0) {
      return "正在获取数据...";
    }
    if (isLoading && totalCount === 0) {
      return "正在思考...";
    }
    if (totalCount > 0 && completedCount === totalCount) {
      return "数据获取完成，正在分析...";
    }
    return "处理中...";
  };

  return (
    <div className="px-3 pt-2">
      <div
        className={`rounded-lg border transition-all duration-300 ${
          runningCount > 0 || isLoading
            ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5"
            : "border-[var(--panel-border)] bg-[var(--bg-secondary)]/60"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center gap-2 text-xs hover:bg-[var(--bg-tertiary)]/40 rounded-lg transition-colors"
        >
          <span className="shrink-0 text-[var(--text-muted)]">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>

          {runningCount > 0 || isLoading ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]" />
            </span>
          ) : (
            <Wrench className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
          )}

          <span className="flex-1 text-left truncate">
            {thinkingMessage ? (
              <span className="text-[var(--text-primary)] font-medium">
                {thinkingMessage}
              </span>
            ) : runningCount > 0 ? (
              <span className="text-[var(--text-primary)] font-medium">
                正在获取数据...
              </span>
            ) : (
              <span className="text-[var(--text-muted)]">工具调用完成</span>
            )}
          </span>

          {totalCount > 0 && (
            <>
              <span className="shrink-0 text-[var(--text-muted)] font-mono text-[10px]">
                {completedCount}/{totalCount}
              </span>

              <div className="w-12 h-1 bg-[var(--panel-border)] rounded-full overflow-hidden shrink-0">
                <div
                  className={`h-full transition-all duration-500 ${
                    runningCount > 0
                      ? "bg-[var(--accent-primary)]"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </>
          )}
        </button>

        {isExpanded && toolCalls.length > 0 && (
          <div className="px-3 pb-2 pt-1 border-t border-[var(--panel-border)]/60">
            <div className="space-y-1 pl-5">
              {toolCalls.map((tool, index) => {
                const display = getToolDisplay(tool.name);
                return (
                  <div
                    key={`${tool.name}-${index}`}
                    className={`flex items-center gap-2 py-0.5 transition-all duration-300 ${
                      tool.status === "running" ? "translate-x-1" : ""
                    }`}
                  >
                    <div className="shrink-0 w-4 flex justify-center">
                      {tool.status === "running" ? (
                        <Loader2 className="h-3.5 w-3.5 text-[var(--accent-primary)] animate-spin" />
                      ) : tool.status === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </div>
                    <span
                      className={`truncate text-[11px] ${
                        tool.status === "running"
                          ? "text-[var(--accent-primary)] font-medium"
                          : tool.status === "success"
                            ? "text-[var(--text-muted)]"
                            : "text-red-500"
                      }`}
                    >
                      {display.icon} {display.name}
                      {tool.duration && (
                        <span className="ml-1 text-[var(--text-muted)]/60">
                          ({tool.duration}ms)
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
