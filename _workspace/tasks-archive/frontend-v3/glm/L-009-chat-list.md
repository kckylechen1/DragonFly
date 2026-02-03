# L-009: Chat List 消息列表

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 2026-01-30 09:58
- ✅ 结束时间: 2026-01-30 10:00 

## 前置依赖
- L-008 (Chat Workspace)

## 目标
- [ ] 创建 `components/chat/ChatList.tsx`
- [ ] 实现自动滚动到底部
- [ ] 使用 content-visibility 优化性能
- [ ] 渲染消息列表

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 762-770 行 (content-visibility)

---

## 步骤

### Step 1: 创建 ChatList.tsx

```typescript
// client/src/refactor_v2/components/chat/ChatList.tsx

import React, { useEffect, useRef } from "react";
import { useChatStore } from "../../stores/chat.store";
import { MessageCard } from "./MessageCard";

/**
 * 消息列表组件
 */
export const ChatList: React.FC = () => {
  const messages = useChatStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ⚠️ 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
          <div className="p-4 rounded-full bg-gray-900 border border-gray-800">
             <span className="text-4xl text-cyan-500">🧠</span>
          </div>
          <p className="text-sm">我是你的 AI 交易助手，有什么可以帮你的？</p>
        </div>
      ) : (
        messages.map((message) => (
          <div 
            key={message.id}
            style={{ contentVisibility: 'auto' } as any} // ⚠️ 性能优化
          >
            <MessageCard message={message} />
          </div>
        ))
      )}
      
      {/* 底部留白 */}
      <div className="h-8" />
    </div>
  );
};

export default ChatList;
```

### Step 2: 创建占位组件

```typescript
// client/src/refactor_v2/components/chat/MessageCard.tsx

import React from "react";
import type { Message } from "../../types/chat";

export const MessageCard: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <div className={`p-4 rounded border ${message.role === 'user' ? 'bg-gray-800' : 'bg-gray-900'}`}>
       {message.content}
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

- [ ] `ChatList.tsx` 已创建
- [ ] 实现新消息到达时自动滚动到底部
- [ ] 为消息项添加 `content-visibility: auto`
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/chat/ChatList.tsx`
- `client/src/refactor_v2/components/chat/MessageCard.tsx` (占位)
