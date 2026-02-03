# L-011: Chat Input 输入框

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 2026-01-30 10:05
- ✅ 结束时间: 2026-01-30 10:10 

## 前置依赖
- L-008 (Chat Workspace)

## 目标
- [ ] 创建多行输入框 `ChatInput.tsx`
- [ ] 支持模式选择 (分析/交易/学习)
- [ ] 实现 Ctrl+Enter 发送逻辑

---

## 步骤

### Step 1: 创建 ChatInput.tsx

```typescript
// client/src/refactor_v2/components/chat/ChatInput.tsx

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Brain, Landmark } from "lucide-react";
import { useChatStore } from "../../stores/chat.store";
import type { ChatMode } from "../../types/chat";

/**
 * 聊天输入组件
 */
export const ChatInput: React.FC = () => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("analyze");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);

  // ⚠️ 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    // 实际发送逻辑由 useStreamingChat 处理，这里只设置 UI 状态
    console.log("Sending:", input, "in mode:", mode);
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-gray-950 border-t border-gray-900 shadow-2xl relative z-20">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* 模式选择器 */}
        <div className="flex gap-2">
          <ModeButton 
            active={mode === "analyze"} 
            onClick={() => setMode("analyze")}
            icon={<Brain size={14} />} 
            label="深度分析" 
          />
          <ModeButton 
            active={mode === "trade"} 
            onClick={() => setMode("trade")}
            icon={<Landmark size={14} />} 
            label="交易策略" 
          />
          <ModeButton 
            active={mode === "learn"} 
            onClick={() => setMode("learn")}
            icon={<Sparkles size={14} />} 
            label="投资学习" 
          />
        </div>

        {/* 输入框 */}
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="问问 AI 交易助手，例如：'分析 AAPL 现在的估值是否合理？'"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 pr-12 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none min-h-[50px] max-h-[200px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={`absolute right-3 bottom-3 p-1.5 rounded-lg transition-all ${
              input.trim() && !isStreaming 
                ? "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20" 
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Send size={16} />
          </button>
        </div>
        
        <div className="flex justify-between items-center px-1">
          <p className="text-[10px] text-gray-600">
            按下 <kbd className="px-1 py-0.5 rounded bg-gray-800 border border-gray-700">Ctrl + Enter</kbd> 发送
          </p>
          <p className="text-[10px] text-gray-600 italic">
            AI 生成内容仅供参考，不构成投资建议
          </p>
        </div>
      </div>
    </div>
  );
};

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const ModeButton: React.FC<ModeButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-all border ${
      active 
        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" 
        : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default ChatInput;
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `ChatInput.tsx` 已创建
- [ ] 支持模式切换
- [ ] 输入框随内容自动伸缩高度
- [ ] 实现 Ctrl+Enter 发送
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/chat/ChatInput.tsx`
