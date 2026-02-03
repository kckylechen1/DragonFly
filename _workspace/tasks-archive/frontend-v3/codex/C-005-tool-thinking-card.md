# C-005: ToolCard & ThinkingCard

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- L-010 (Message Card 占位已完成)

## 目标
- [ ] 创建 `components/chat/ToolCard.tsx`
- [ ] 创建 `components/chat/ThinkingCard.tsx`
- [ ] 实现优雅的状态切换和动画（framer-motion）

---

## 步骤

### Step 1: 创建 ToolCard.tsx

```typescript
// client/src/refactor_v2/components/chat/ToolCard.tsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { ToolCall } from "../../types/chat";

interface ToolCardProps {
  toolCall: ToolCall;
}

export const ToolCard: React.FC<ToolCardProps> = ({ toolCall }) => {
  const isRunning = toolCall.status === "running" || toolCall.status === "pending";
  const isSuccess = toolCall.status === "completed";
  const isFailed = toolCall.status === "failed";

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
        ${isRunning ? "bg-amber-500/5 border-amber-500/30 text-amber-400" : ""}
        ${isSuccess ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400" : ""}
        ${isFailed ? "bg-rose-500/5 border-rose-500/30 text-rose-400" : ""}
      `}
    >
      {isRunning && <Loader2 size={14} className="animate-spin" />}
      {isSuccess && <CheckCircle2 size={14} />}
      {isFailed && <XCircle size={14} />}
      {!isRunning && !isSuccess && !isFailed && <Wrench size={14} />}
      
      <span>{toolCall.name}</span>
      
      {isSuccess && toolCall.endTime && (
        <span className="text-[10px] opacity-40">
          {((toolCall.endTime - toolCall.startTime) / 1000).toFixed(1)}s
        </span>
      )}
    </motion.div>
  );
};
```

### Step 2: 创建 ThinkingCard.tsx

```typescript
// client/src/refactor_v2/components/chat/ThinkingCard.tsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BrainCircuit, Check } from "lucide-react";
import type { ThinkingStep } from "../../types/chat";

export const ThinkingCard: React.FC<{ steps: ThinkingStep[] }> = ({ steps }) => {
  const [expanded, setExpanded] = useState(false);
  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const isDone = completedSteps === totalSteps && totalSteps > 0;

  return (
    <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden mb-2">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-[11px] text-gray-500 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className={isDone ? "text-emerald-500" : "text-cyan-500 animate-pulse"} />
          <span className="font-medium tracking-tight uppercase">AI THOUGHT PROCESS</span>
          <span className="opacity-40 ml-1">({completedSteps}/{totalSteps})</span>
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-gray-900/80"
          >
            <div className="p-3 space-y-3 border-t border-gray-800">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 relative">
                  {/* 时间轴线 */}
                  {idx !== steps.length - 1 && (
                    <div className="absolute left-[7px] top-4 bottom-[-12px] w-[1px] bg-gray-800" />
                  )}
                  
                  <div className={`
                    mt-1 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10
                    ${step.completed ? "bg-emerald-500 border-emerald-500" : "bg-gray-900 border-gray-800"}
                  `}>
                    {step.completed && <Check size={10} className="text-gray-900" />}
                  </div>
                  
                  <div className="flex flex-col gap-0.5 pb-1">
                    <div className={`text-xs font-semibold ${step.completed ? "text-gray-300" : "text-gray-500"}`}>
                      {step.title}
                    </div>
                    {step.summary && (
                      <div className="text-[10px] text-gray-600 leading-relaxed italic">
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

      {/* 进度条装饰 */}
      {!expanded && (
        <div className="h-[2px] w-full bg-gray-800">
          <motion.div 
            className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
```

### Step 3: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `ToolCard.tsx` 和 `ThinkingCard.tsx` 已创建
- [ ] 两个组件均使用 `framer-motion` 实现过场动画
- [ ] `ThinkingCard` 支持进度条和折叠详情
- [ ] `pnpm check` 通道

---

## 产出文件

- `client/src/refactor_v2/components/chat/ToolCard.tsx`
- `client/src/refactor_v2/components/chat/ThinkingCard.tsx`
