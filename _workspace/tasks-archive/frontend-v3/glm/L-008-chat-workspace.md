# L-008: Chat Workspace 容器

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 2026-01-30 09:55
- ✅ 结束时间: 2026-01-30 09:58 

## 前置依赖
- L-004 (Stores)

## 目标
- [ ] 创建 `components/chat/ChatWorkspace.tsx`
- [ ] 实现聊天区基础布局
- [ ] 集成 Suspense 边界

---

## 步骤

### Step 1: 创建目录

```bash
mkdir -p client/src/refactor_v2/components/chat
```

### Step 2: 创建 ChatWorkspace.tsx

```typescript
// client/src/refactor_v2/components/chat/ChatWorkspace.tsx

import React, { Suspense, lazy } from "react";
import { ChatList } from "./ChatList";
import { ChatInput } from "./ChatInput";

const PanelSkeleton = () => (
  <div className="flex-1 flex flex-col animate-pulse">
    <div className="flex-1 bg-gray-900/50" />
    <div className="h-24 bg-gray-800" />
  </div>
);

/**
 * 聊天工作区容器
 */
export const ChatWorkspace: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 relative overflow-hidden">
      {/* 消息渲染列表 */}
      <Suspense fallback={<PanelSkeleton />}>
        <ChatList />
      </Suspense>

      {/* 底部输入框区域 */}
      <ChatInput />
      
      {/* 装饰物：背景渐变 */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
    </div>
  );
};

export default ChatWorkspace;
```

### Step 3: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `ChatWorkspace.tsx` 已创建
- [ ] 包含 `ChatList` 和 `ChatInput`（即使目前是占位）
- [ ] 使用 `Suspense` 包裹消息列表
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/chat/ChatWorkspace.tsx`
