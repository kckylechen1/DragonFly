# C-004: Markdown 流式渲染优化

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- C-003 (Streaming Chat)

## ⚠️ CRITICAL - 避免每个 token 触发重渲染

## 目标
- [ ] 创建 `hooks/useStreamingMarkdown.ts`
- [ ] 实现 50ms 批量 commit 逻辑
- [ ] 优化 `MessageCard` 性能

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 636-653 行

---

## 问题背景

SSE 每个 token 达到都会触发 `ReactMarkdown` 的重绘。对于 500+ token 的大模型回复，会导致严重的 CPU 占用和 UI 掉帧。

**解决方案**: 使用 50ms interval 的缓冲区进行批量 commit，将渲染频率降至最多 20次/秒。

---

## 步骤

### Step 1: 创建 hooks/useStreamingMarkdown.ts

```typescript
// client/src/refactor_v2/hooks/useStreamingMarkdown.ts

import { useEffect, useRef, useState } from "react";

/**
 * Markdown 流式渲染优化 Hook
 * 
 * 作用：将高频的小片段 token 缓冲，按固定时间间隔批量更新给 UI。
 */
export function useStreamingMarkdown(rawContent: string) {
  const pendingRef = useRef(""); // 尚未提交到 UI 的新内容
  const [displayContent, setDisplayContent] = useState("");
  const lastRawLengthRef = useRef(0);

  useEffect(() => {
    // ⚠️ 核心逻辑：每 50ms 批量 commit 一次
    const interval = setInterval(() => {
      if (pendingRef.current) {
        setDisplayContent((prev) => prev + pendingRef.current);
        pendingRef.current = "";
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // 监听 rawContent 变化，存入 pending
  useEffect(() => {
    if (rawContent.length > lastRawLengthRef.current) {
      const newChunk = rawContent.slice(lastRawLengthRef.current);
      pendingRef.current += newChunk;
      lastRawLengthRef.current = rawContent.length;
    } else if (rawContent.length < lastRawLengthRef.current) {
      // 如果内容变短了（例如重新生成），重置状态
      setDisplayContent(rawContent);
      pendingRef.current = "";
      lastRawLengthRef.current = rawContent.length;
    }
  }, [rawContent]);

  return displayContent;
}
```

### Step 2: 更新 MessageCard.tsx 使用 Hook

```diff
// client/src/refactor_v2/components/chat/MessageCard.tsx

+ import { useStreamingMarkdown } from "../../hooks/useStreamingMarkdown";

export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  const isAI = message.role === "assistant";
+ const content = isAI ? useStreamingMarkdown(message.content) : message.content;

  // ... 渲染逻辑中使用 content 代替 message.content
}
```

### Step 3: 更新 hooks/index.ts

```typescript
// client/src/refactor_v2/hooks/index.ts

export * from "./useStreamingMarkdown";
```

---

## 验收标准

- [ ] `useStreamingMarkdown.ts` 已创建
- [ ] 实现 50ms 批量 commit 逻辑
- [ ] `MessageCard` 已接入该 Hook
- [ ] 模拟高频输入时，CPU 占用明显降低
- [ ] `pnpm check` 通道

---

## 产出文件

- `client/src/refactor_v2/hooks/useStreamingMarkdown.ts`
- `client/src/refactor_v2/components/chat/MessageCard.tsx` (更新)
