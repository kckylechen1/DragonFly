/**
 * ToolCard - 工具调用卡片 (Theme-aware)
 */

import { motion } from "framer-motion";
import { Wrench, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { ToolCall } from "../../types/chat";

interface ToolCardProps {
  toolCall: ToolCall;
}

export const ToolCard: React.FC<ToolCardProps> = ({ toolCall }) => {
  const isRunning = toolCall.status === "running" || toolCall.status === "pending";
  const isSuccess = toolCall.status === "completed";
  const isFailed = toolCall.status === "failed";
  const latencyMs =
    toolCall.meta?.latencyMs ??
    (toolCall.endTime ? toolCall.endTime - toolCall.startTime : undefined);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors
        ${isRunning ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : ""}
        ${isSuccess ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : ""}
        ${isFailed ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : ""}
        ${!isRunning && !isSuccess && !isFailed ? "bg-[var(--panel-border)]/30 border-[var(--panel-border)] text-[var(--text-muted)]" : ""}
      `}
    >
      {isRunning && <Loader2 size={12} className="animate-spin" />}
      {isSuccess && <CheckCircle2 size={12} />}
      {isFailed && <XCircle size={12} />}
      {!isRunning && !isSuccess && !isFailed && <Wrench size={12} />}

      <span>{toolCall.name}</span>

      {toolCall.meta?.source && (
        <span className="text-[9px] opacity-60">{toolCall.meta.source}</span>
      )}

      {latencyMs !== undefined && (
        <span className="text-[9px] opacity-50">
          {(latencyMs / 1000).toFixed(1)}s
        </span>
      )}

      {toolCall.meta?.truncated && (
        <span className="text-[9px] opacity-50">截断</span>
      )}
    </motion.div>
  );
};
