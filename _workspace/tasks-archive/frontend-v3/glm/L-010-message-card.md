# L-010: Message Card 消息卡片

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 2026-01-30 10:00
- ✅ 结束时间: 2026-01-30 10:05 

## 前置依赖
- L-009 (Chat List)

## 目标
- [ ] 创建功能完备的 `MessageCard.tsx`
- [ ] 支持用户和 AI 消息区分
- [ ] 集成 `react-markdown` 渲染 AI 回复
- [ ] 集成 `ToolCard` 和 `ThinkingCard` (Codex 负责实现卡片)

---

## 参考文档

- `frontend-architecture-guide.md` 第 46-348 行

---

## 步骤

### Step 1: 创建 MessageCard.tsx

```typescript
// client/src/refactor_v2/components/chat/MessageCard.tsx

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot, Copy, RotateCcw } from "lucide-react";
import type { Message } from "../../types/chat";
import { ToolCard } from "./ToolCard";
import { ThinkingCard } from "./ThinkingCard";

interface MessageCardProps {
  message: Message;
}

/**
 * 消息卡片组件
 * 
 * 作用：渲染单条聊天消息，包含角色头像、内容、工具调用和思考过程
 */
export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  const isAI = message.role === "assistant";

  return (
    <div className={`flex w-full gap-4 ${isAI ? "justify-start" : "justify-end flex-row-reverse"}`}>
      {/* 头像 */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
        isAI ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-gray-800 border-gray-700 text-gray-400"
      }`}>
        {isAI ? <Bot size={18} /> : <User size={18} />}
      </div>

      {/* 内容区 */}
      <div className={`flex flex-col max-w-[85%] gap-2 ${isAI ? "items-start" : "items-end"}`}>
        {/* 思考过程 - 只在 AI 消息且有数据时显示 */}
        {isAI && message.thinking && message.thinking.length > 0 && (
          <ThinkingCard steps={message.thinking} />
        )}

        {/* 消息正文 */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
          isAI 
            ? "bg-gray-900 border border-gray-800 text-gray-200" 
            : "bg-cyan-600 text-white"
        }`}>
          {isAI ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* 工具调用 - 只在 AI 消息中显示 */}
        {isAI && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.toolCalls.map(tc => (
              <ToolCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* 操作栏 - 只在 AI 消息中显示 */}
        {isAI && (
          <div className="flex items-center gap-3 mt-1 px-1">
            <button className="text-gray-500 hover:text-cyan-400 p-1 transition-colors" title="复制内容">
              <Copy size={14} />
            </button>
            <button className="text-gray-500 hover:text-cyan-400 p-1 transition-colors" title="重新生成">
              <RotateCcw size={14} />
            </button>
            <span className="text-[10px] text-gray-600 ml-2">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCard;
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `MessageCard.tsx` 已创建
- [ ] 支持渲染 Markdown 内容
- [ ] 文档样式正确（代码块、列表、加粗等）
- [ ] 显示时间戳
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/chat/MessageCard.tsx` (更新)
