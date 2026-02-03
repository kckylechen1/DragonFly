/**
 * ThinkingCard - AI 思考过程卡片 (Theme-aware)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BrainCircuit, Check } from "lucide-react";
import type { ThinkingStep } from "../../types/chat";

interface ThinkingCardProps {
  steps: ThinkingStep[];
}

export const ThinkingCard: React.FC<ThinkingCardProps> = ({ steps }) => {
  const [expanded, setExpanded] = useState(false);
  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const isDone = completedSteps === totalSteps && totalSteps > 0;

  if (totalSteps === 0) return null;

  return (
    <div className="w-full max-w-md bg-[var(--bg-primary)]/50 border border-[var(--panel-border)] rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-[11px] text-[var(--text-muted)] hover:bg-[var(--panel-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit
            size={14}
            className={isDone ? "text-emerald-500" : "text-[var(--color-primary)] animate-pulse"}
          />
          <span className="font-medium tracking-tight uppercase">
            AI THOUGHT PROCESS
          </span>
          <span className="opacity-60 ml-1">
            ({completedSteps}/{totalSteps})
          </span>
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-[var(--bg-primary)]/80"
          >
            <div className="p-3 space-y-3 border-t border-[var(--panel-border)]">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 relative">
                  {idx !== steps.length - 1 && (
                    <div className="absolute left-[7px] top-4 bottom-[-12px] w-[1px] bg-[var(--panel-border)]" />
                  )}

                  <div
                    className={`
                      mt-1 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10
                      ${step.completed 
                        ? "bg-emerald-500 border-emerald-500" 
                        : "bg-[var(--bg-primary)] border-[var(--panel-border)]"
                      }
                    `}
                  >
                    {step.completed && (
                      <Check size={10} className="text-white" />
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 pb-1">
                    <div className={`text-xs font-semibold ${step.completed ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                      {step.title}
                    </div>
                    {step.summary && (
                      <div className="text-[10px] text-[var(--text-muted)] leading-relaxed italic">
                        {step.summary}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && (
        <div className="h-[2px] w-full bg-[var(--panel-border)]">
          <motion.div
            className="h-full bg-[var(--color-primary)]"
            style={{ boxShadow: '0 0 8px var(--color-primary)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
