# Phase 1.5: API Integration - Codex Overnight Guide

> **执行者**: Codex  
> **审查者**: Antigravity  
> **目标**: 将 `refactor_v2` 组件与后端 tRPC API 对接

---

## ⚠️ 重要规则

1. **优先级**: 完成任务 > 验证通过
2. **遇到环境问题** (pnpm not found): 跳过验证，记录问题，继续编码
3. **遇到类型错误**: 尝试修复，若无法修复则记录并继续下一个任务
4. **关键**: 使用 `--noEmit` 只检查类型，不实际构建

---

## 📁 目录结构

```
client/src/refactor_v2/
├── api/                    # [新建] API 层
│   ├── index.ts            # 统一导出
│   ├── client.ts           # tRPC client 配置
│   ├── stocks.ts           # 股票数据 hooks
│   ├── watchlist.ts        # 自选股 hooks
│   └── ai.ts               # AI 聊天 hooks
├── hooks/
│   └── useAIStream.ts      # [新建] AI 流式对话 hook
└── components/
    └── ...                 # 已有组件
```

---

## 📝 任务列表

### T-018: tRPC Client 配置
**文件**: `client/src/refactor_v2/api/client.ts`

创建 tRPC client，复用现有配置：

```typescript
// client/src/refactor_v2/api/client.ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@server/_core/trpc";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
    }),
  ],
});
```

### T-019: Stock Data Hooks
**文件**: `client/src/refactor_v2/api/stocks.ts`

创建股票数据 React Query hooks：

```typescript
// client/src/refactor_v2/api/stocks.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

// 获取股票实时行情
export function useStockQuote(code: string) {
  return useQuery({
    queryKey: ["stock", "quote", code],
    queryFn: () => api.stocks.getQuote.query({ code }),
    enabled: !!code,
    staleTime: 5000, // 5秒内不重新请求
    refetchInterval: 10000, // 10秒刷新一次
  });
}

// 获取K线数据
export function useKlineData(code: string, period: string = "day", limit: number = 60) {
  return useQuery({
    queryKey: ["stock", "kline", code, period, limit],
    queryFn: () => api.stocks.getKline.query({ code, period, limit }),
    enabled: !!code,
    staleTime: 60000, // 1分钟
  });
}

// 获取分时数据
export function useTimelineData(code: string) {
  return useQuery({
    queryKey: ["stock", "timeline", code],
    queryFn: () => api.stocks.getTimeline.query({ code }),
    enabled: !!code,
    staleTime: 30000, // 30秒
    refetchInterval: 30000,
  });
}

// 获取 Gauge 评分
export function useGaugeScore(code: string) {
  return useQuery({
    queryKey: ["stock", "gauge", code],
    queryFn: () => api.stocks.getGaugeScore.query({ code }),
    enabled: !!code,
    staleTime: 300000, // 5分钟
  });
}

// 搜索股票
export function useStockSearch(keyword: string) {
  return useQuery({
    queryKey: ["stock", "search", keyword],
    queryFn: () => api.stocks.search.query({ keyword }),
    enabled: keyword.length >= 1,
    staleTime: 60000,
  });
}
```

### T-020: Watchlist Hooks
**文件**: `client/src/refactor_v2/api/watchlist.ts`

```typescript
// client/src/refactor_v2/api/watchlist.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

// 获取自选股列表
export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: () => api.watchlist.list.query(),
    staleTime: 60000,
  });
}

// 添加自选股
export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { stockCode: string; note?: string }) =>
      api.watchlist.add.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

// 删除自选股
export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.watchlist.remove.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}
```

### T-021: AI Chat Hooks
**文件**: `client/src/refactor_v2/api/ai.ts`

```typescript
// client/src/refactor_v2/api/ai.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

// 获取会话列表
export function useAISessions(stockCode?: string) {
  return useQuery({
    queryKey: ["ai", "sessions", stockCode],
    queryFn: () => api.ai.getSessions.query(stockCode ? { stockCode } : undefined),
    staleTime: 30000,
  });
}

// 获取聊天历史
export function useAIHistory(sessionId?: string) {
  return useQuery({
    queryKey: ["ai", "history", sessionId],
    queryFn: () => api.ai.getHistory.query(sessionId ? { sessionId } : undefined),
    enabled: !!sessionId,
  });
}

// 创建新会话
export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stockCode?: string) =>
      api.ai.createSession.mutate({ stockCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "sessions"] });
    },
  });
}

// 发送消息
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      messages: Message[];
      sessionId?: string;
      stockCode?: string;
      useThinking?: boolean;
    }) => api.ai.chat.mutate(input),
    onSuccess: (_, variables) => {
      if (variables.sessionId) {
        queryClient.invalidateQueries({
          queryKey: ["ai", "history", variables.sessionId],
        });
      }
    },
  });
}
```

### T-022: API Index Export
**文件**: `client/src/refactor_v2/api/index.ts`

```typescript
// client/src/refactor_v2/api/index.ts
export { api } from "./client";
export * from "./stocks";
export * from "./watchlist";
export * from "./ai";
```

### T-023: AI Streaming Hook
**文件**: `client/src/refactor_v2/hooks/useAIStream.ts`

参考现有实现创建流式对话 hook：

```typescript
// client/src/refactor_v2/hooks/useAIStream.ts
import { useState, useCallback, useRef } from "react";
import { useAIChatStore } from "@/refactor_v2/stores/aiChat.store";

interface StreamOptions {
  sessionId?: string;
  stockCode?: string;
  thinkHard?: boolean;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export function useAIStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (prompt: string, options: StreamOptions = {}) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsStreaming(true);
    setStreamedContent("");

    let fullContent = "";

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          sessionId: options.sessionId,
          stockCode: options.stockCode,
          thinkHard: options.thinkHard,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setStreamedContent(fullContent);
        options.onChunk?.(chunk);
      }

      options.onComplete?.(fullContent);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        options.onError?.(error as Error);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }

    return fullContent;
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    stream,
    cancel,
    isStreaming,
    streamedContent,
  };
}
```

### T-024: 集成到 CenterTop 组件
**文件**: `client/src/refactor_v2/components/CenterTop/index.tsx`

更新 CenterTop 使用真实 API 数据：

1. 导入 API hooks
2. 替换 MOCK_QUOTES 为 `useStockQuote` 
3. 替换 `generateChartData` 为 `useKlineData` 或 `useTimelineData`
4. 处理 loading 和 error 状态

```typescript
// 导入
import { useStockQuote, useKlineData } from "@/refactor_v2/api";

// 数据获取
const { data: quote, isLoading: quoteLoading } = useStockQuote(currentSymbol);
const { data: klineData, isLoading: klineLoading } = useKlineData(currentSymbol, "day", 60);

// 映射数据格式给 StockChart
const chartData = useMemo(() => {
  if (!klineData) return [];
  return klineData.map(k => ({
    time: new Date(k.time).getTime() / 1000,
    value: k.close,
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volume,
  }));
}, [klineData]);
```

### T-025: 集成到 LeftPane 组件
**文件**: `client/src/refactor_v2/components/LeftPane.tsx`

更新 LeftPane 使用真实自选股数据：

1. 导入 `useWatchlist` hook
2. 替换静态列表为动态数据
3. 添加搜索功能使用 `useStockSearch`

---

## ✅ 验证命令

```bash
# 仅类型检查 refactor_v2 目录
npx tsc --noEmit client/src/refactor_v2/**/*.ts client/src/refactor_v2/**/*.tsx

# 如果上面报错，用这个：
pnpm check
```

---

## 📋 问题记录模板

在 `client/src/refactor_v2/REFACTOR-STATUS.md` 记录：

```markdown
## Phase 1.5 API Integration

### T-018: tRPC Client 配置
- [x] 完成 / [ ] 阻塞
- 问题: (如有)

### T-019: Stock Data Hooks
- [ ] 完成 / [ ] 阻塞
- 问题: (如有)

...
```

---

## 🔑 关键提示

1. **tRPC 类型**: 后端使用 tRPC，类型会从 `@server/_core/trpc` 的 `AppRouter` 推断
2. **React Query**: 已安装 `@tanstack/react-query`，直接使用即可
3. **A股颜色**: 红涨绿跌，已在 tokens.css 配置好
4. **不要修改** `client/src/components/` 下的原有组件，只改 `refactor_v2/`

---

## 📌 执行顺序

1. T-018 → T-019 → T-020 → T-021 → T-022 (API 层)
2. T-023 (AI Stream Hook)  
3. T-024 → T-025 (组件集成)

每完成一个任务后运行 `pnpm check`，记录结果后继续下一个。
