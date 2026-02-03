import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  SkipForward,
} from "lucide-react";

interface Todo {
  id: string;
  title: string;
  status: string;
}

interface TodoRun {
  status: string;
  todos: Todo[];
}

interface TaskExecutionPanelProps {
  todoRun: TodoRun;
}

export function TaskExecutionPanel({ todoRun }: TaskExecutionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(todoRun.status === "running");

  const completedCount = todoRun.todos.filter(
    t => t.status === "completed"
  ).length;
  const totalCount = todoRun.todos.length;
  const currentTask = todoRun.todos.find(t => t.status === "in_progress");
  const isRunning = todoRun.status === "running";

  return (
    <div className="px-3 pt-2">
      <div
        className={`rounded-lg border transition-all duration-300 ${
          isRunning
            ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10"
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

          {isRunning ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]" />
            </span>
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          )}

          <span className="flex-1 text-left truncate">
            {isRunning ? (
              <span className="text-[var(--text-primary)] font-medium">
                {currentTask
                  ? formatTodoTitle(currentTask.title)
                  : "思考规划中..."}
              </span>
            ) : (
              <span className="text-[var(--text-muted)]">执行完成</span>
            )}
          </span>

          <span className="shrink-0 text-[var(--text-muted)] font-mono text-[10px]">
            {completedCount}/{totalCount}
          </span>

          <div className="w-12 h-1 bg-[var(--panel-border)] rounded-full overflow-hidden shrink-0">
            <div
              className={`h-full transition-all duration-500 ${
                isRunning ? "bg-[var(--accent-primary)]" : "bg-emerald-500"
              }`}
              style={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </button>

        {isExpanded && (
          <div className="px-3 pb-2 pt-1 border-t border-[var(--panel-border)]/60">
            <div className="space-y-1 pl-5">
              {todoRun.todos.map(todo => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-2 py-0.5 transition-all duration-300 ${
                    todo.status === "in_progress" ? "translate-x-1" : ""
                  }`}
                >
                  <div className="shrink-0 w-4 flex justify-center">
                    {formatTodoStatusIcon(todo.status)}
                  </div>
                  <span
                    className={`truncate text-[11px] ${
                      todo.status === "in_progress"
                        ? "text-[var(--accent-primary)] font-medium"
                        : todo.status === "completed"
                          ? "text-[var(--text-muted)]"
                          : todo.status === "failed"
                            ? "text-red-500 line-through opacity-80"
                            : "text-[var(--text-muted)]/60"
                    }`}
                  >
                    {formatTodoTitle(todo.title)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTodoTitle(title: string) {
  if (!title) return "执行任务";
  if (title.includes("get_stock_quote")) return "📊 获取实时行情";
  if (title.includes("analyze_stock_technical")) return "📈 技术面深度扫描";
  if (title.includes("get_fund_flow_history")) return "💰 追踪资金历史趋势";
  if (title.includes("get_fund_flow")) return "💰 追踪主力资金";
  if (title.includes("get_market_status")) return "🌍 研判大盘环境";
  if (title.includes("comprehensive_analysis")) return "🏥 全方位诊断中...";
  if (title.includes("get_trading_memory")) return "🧠 回顾交易记忆";
  if (title.includes("get_guba_hot_rank")) return "🔥 监测市场热度";
  if (title.includes("get_market_news")) return "📰 收集市场资讯";
  if (title.includes("analyze_minute_patterns")) return "⏱️ 分时形态识别";
  if (title.includes("get_longhu_bang")) return "🐲 龙虎榜分析";
  if (title.includes("check_aktools_status")) return "🔌 检查服务状态";
  if (title.includes("call_akshare")) return "📡 调用数据接口";
  if (title.includes("get_akshare_endpoint_info")) return "📋 查询接口信息";

  if (title.includes("生成")) return "✍️ " + title;
  if (title.includes("调用工具"))
    return "🛠️ " + title.replace("调用工具: ", "");
  if (title.includes("计划工具")) return "📋 " + title.replace("计划工具:", "");

  return title;
}

function formatTodoStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    case "in_progress":
      return (
        <Loader2 className="h-3.5 w-3.5 text-[var(--accent-primary)] animate-spin" />
      );
    case "skipped":
      return (
        <SkipForward className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      );
    default:
      return (
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]/40" />
      );
  }
}
