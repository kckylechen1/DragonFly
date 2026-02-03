# C-003: SSE 流式对话 Hook

## 负责人: 🟢 Codex
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- C-002 (Market Client)

## ⚠️ CRITICAL - SSE 必须实现 seq 去重和滑动窗口去重

## 目标
- [ ] 创建 `hooks/useStreamingChat.ts`
- [ ] 实现 `SSEDeduplicator` 进行滑动窗口去重 (Oracle 护栏)
- [ ] 实现 `useStreamingChat` Hook，支持 seq 去重、自动重连和 50ms 缓冲刷新

---

## 步骤

### Step 1: 实现 useStreamingChat.ts

```typescript
// client/src/refactor_v2/hooks/useStreamingChat.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "../stores/chat.store";
import { useConnectionStore } from "../stores/connection.store";
import type { Message, SSEEvent, ChatMode } from "../types/chat";

/**
 * SSE 事件去重器 (带滑动窗口)
 * 作用：防止重连导致的重复内容，并限制内存占用。
 */
class SSEDeduplicator {
  private seen = new Set<string>();
  private maxWindow = 2000;

  isDuplicate(eventId: string): boolean {
    if (!eventId) return false;
    if (this.seen.has(eventId)) return true;
    
    if (this.seen.size >= this.maxWindow) {
      const arr = Array.from(this.seen);
      const keep = arr.slice(arr.length / 2);
      this.seen = new Set(keep);
    }
    
    this.seen.add(eventId);
    return false;
  }
}

const dedup = new SSEDeduplicator();

interface UseStreamingChatOptions {
  conversationId?: string;
  mode?: ChatMode;
  onError?: (error: Error) => void;
}

export function useStreamingChat(options: UseStreamingChatOptions = {}) {
  const { conversationId: initialConvId, mode = "analyze", onError } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const lastSeqRef = useRef(0);
  const contentBufferRef = useRef("");
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(initialConvId);

  const {
    appendContent,
    addMessage,
    updateMessage,
    setStreaming,
    setConversationId,
  } = useChatStore();

  const scheduleFlush = useCallback((messageId: string) => {
    if (flushTimeoutRef.current) return;
    flushTimeoutRef.current = setTimeout(() => {
      if (contentBufferRef.current) {
        appendContent(messageId, contentBufferRef.current);
        contentBufferRef.current = "";
      }
      flushTimeoutRef.current = null;
    }, 50);
  }, [appendContent]);

  const connect = useCallback((convId: string) => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    setIsConnecting(true);
    const url = `/api/chat/stream?conversationId=${convId}&mode=${mode}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);

        // ⚠️ Oracle 护栏：eventId 去重
        if (event.id && dedup.isDuplicate(event.id)) return;

        // ⚠️ seq 去重
        if (event.seq <= lastSeqRef.current) return;
        lastSeqRef.current = event.seq;

        handleSSEEvent(event);
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    es.onerror = () => {
      setIsConnecting(false);
      // 指数退避重连逻辑在此省略，实际执行请参考核心逻辑
    };
  }, [mode]);

  const handleSSEEvent = (event: SSEEvent) => {
    switch (event.type) {
      case "message_start":
        addMessage({ id: event.messageId, role: "assistant", content: "", timestamp: Date.now() });
        setStreaming(true);
        break;
      case "content_delta":
        contentBufferRef.current += event.data as string;
        scheduleFlush(event.messageId);
        break;
      case "message_complete":
        setStreaming(false);
        break;
    }
  };

  return { sendMessage: (content: string) => { /* 发送逻辑 */ } };
}
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `useStreamingChat.ts` 无语法错误
- [ ] `SSEDeduplicator` 位于顶层
- [ ] 实现 eventId 滑动窗口去重
- [ ] 实现 seq 去重
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/hooks/useStreamingChat.ts`
