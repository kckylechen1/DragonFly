# 🟢 Codex 任务指南: 流式响应 + 多模型路由

> **负责 Agent**: Codex (GPT-5.2)  
> **预计时间**: 4-5 小时  
> **并行组**: B (Phase 2-3 在 GLM Phase 1 之后)

---

## ⚠️ 重要提醒

```
按 AI-COLLAB-PLAYBOOK 工作
遇到问题立即停下，不要猜测
每完成一个任务运行 pnpm check 验证
```

---

## ⚠️ 文件所有权声明

### ✅ 本任务拥有 (可修改)
- `client/src/refactor_v2/api/useAIStream.ts` (新建)
- `client/src/refactor_v2/api/index.ts` (添加导出)
- `server/routers/ai.ts`
- `server/_core/model-router.ts` (新建)
- `server/_core/llm.ts`

### 🔒 只读参考 (不要修改)
- `server/_core/agent/smart-agent.ts`
- `server/_core/agent/orchestrator.ts` (GLM 负责)
- `server/_core/agent/types.ts`

### 🚫 禁止触碰 (GLM 负责)
- `client/src/refactor_v2/components/FloatingAIChatInput.tsx`
- `client/src/refactor_v2/components/AIChatPanel.tsx`
- `client/src/refactor_v2/stores/aiChat.store.ts`

---

## 📋 任务清单

### CDX-001: useAIStream Hook 实现 [Phase 2]

**目标**: 创建基于 SSE 的流式响应 hook

**Step 1: 创建新文件**

创建 `client/src/refactor_v2/api/useAIStream.ts`:

```typescript
import { useState, useCallback, useRef } from "react";

export interface StreamProgress {
  type: "thinking" | "tool_call" | "tool_result" | "content" | "done" | "error";
  data: any;
}

export interface TodoStep {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  toolName?: string;
  resultPreview?: string;
}

export function useAIStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [progress, setProgress] = useState<TodoStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback(
    async (message: string, options?: { stockCode?: string; sessionId?: string }) => {
      // 清理之前的连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsStreaming(true);
      setStreamContent("");
      setProgress([]);
      setError(null);

      try {
        // 构建 SSE URL
        const params = new URLSearchParams({
          message,
          ...(options?.stockCode && { stockCode: options.stockCode }),
          ...(options?.sessionId && { sessionId: options.sessionId }),
        });

        const url = `/api/ai/stream?${params.toString()}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data: StreamProgress = JSON.parse(event.data);

            switch (data.type) {
              case "thinking":
                // 更新思考状态
                break;

              case "tool_call":
                // 添加新的工具调用步骤
                setProgress((prev) => [
                  ...prev,
                  {
                    id: data.data.toolCallId || `step_${Date.now()}`,
                    title: `调用 ${data.data.name}`,
                    status: "in_progress",
                    toolName: data.data.name,
                  },
                ]);
                break;

              case "tool_result":
                // 更新工具结果
                setProgress((prev) =>
                  prev.map((step) =>
                    step.toolName === data.data.name
                      ? {
                          ...step,
                          status: data.data.ok ? "completed" : "failed",
                          resultPreview: data.data.result?.slice(0, 100),
                        }
                      : step
                  )
                );
                break;

              case "content":
                // 设置最终内容
                setStreamContent(data.data);
                break;

              case "done":
                eventSource.close();
                setIsStreaming(false);
                break;

              case "error":
                setError(data.data);
                eventSource.close();
                setIsStreaming(false);
                break;
            }
          } catch (parseError) {
            console.error("Failed to parse SSE event:", parseError);
          }
        };

        eventSource.onerror = (err) => {
          console.error("SSE error:", err);
          setError("连接中断，请重试");
          eventSource.close();
          setIsStreaming(false);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
        setIsStreaming(false);
      }
    },
    []
  );

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamContent,
    progress,
    error,
    startStream,
    stopStream,
  };
}
```

**Step 2: 更新导出**

修改 `client/src/refactor_v2/api/index.ts`:

```typescript
export { api } from "./client";
export * from "./stocks";
export * from "./watchlist";
export * from "./ai";
export * from "./useAIStream"; // 新增
```

**Step 3: 验证**
```bash
pnpm check
```

---

### CDX-002: 后端 SSE 流式端点 [Phase 2]

**目标**: 添加 SSE 端点连接 SmartAgent.stream()

**Step 1: 修改 server/routers/ai.ts**

在现有路由基础上添加流式端点:

```typescript
import { createSmartAgent } from "../_core/agent";

// 在 aiRouter 中添加
streamChat: publicProcedure
  .input(
    z.object({
      message: z.string(),
      sessionId: z.string().optional(),
      stockCode: z.string().optional(),
      useThinking: z.boolean().optional(),
    })
  )
  .mutation(async function* ({ input }) {
    const agent = createSmartAgent({
      sessionId: input.sessionId,
      stockCode: input.stockCode,
      thinkHard: input.useThinking,
    });

    for await (const event of agent.stream(input.message)) {
      yield event;
    }
  }),
```

**注意**: tRPC 可能不直接支持 AsyncGenerator。如果遇到问题，使用原生 Express 路由:

**备选方案: 原生 Express SSE**

在 `server/_core/index.ts` 或创建新文件 `server/_core/sse-handler.ts`:

```typescript
import { createSmartAgent } from "./agent";
import type { Request, Response } from "express";

export async function handleAIStream(req: Request, res: Response) {
  const { message, stockCode, sessionId } = req.query as {
    message: string;
    stockCode?: string;
    sessionId?: string;
  };

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  // 设置 SSE 头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const agent = createSmartAgent({
    sessionId,
    stockCode,
  });

  try {
    for await (const event of agent.stream(message)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  } catch (error) {
    res.write(
      `data: ${JSON.stringify({ type: "error", data: (error as Error).message })}\n\n`
    );
  } finally {
    res.end();
  }
}
```

然后在 Express 应用中注册:
```typescript
app.get("/api/ai/stream", handleAIStream);
```

**Step 2: 验证**
```bash
pnpm check
```

---

### CDX-003: 多模型路由系统 [Phase 3]

**目标**: 创建支持 GLM/Grok/Qwen/DeepSeek 的模型路由

**Step 1: 创建 model-router.ts**

创建 `server/_core/model-router.ts`:

```typescript
/**
 * 多模型路由系统
 *
 * 支持的模型:
 * - GLM-4.7 (智谱) - 中文能力强，成本低
 * - Grok-4.1 (xAI) - 实时搜索能力
 * - Qwen (硅基流动) - 通用能力，成本低
 * - DeepSeek (硅基流动) - 推理能力强
 */

import { getEnvConfig } from "./env";

export type ModelProvider = "glm" | "grok" | "qwen" | "deepseek";

export interface ModelConfig {
  name: string;
  provider: ModelProvider;
  apiKey: string;
  endpoint: string;
  model: string;
  capabilities: string[];
  costTier: 1 | 2 | 3; // 1 = 便宜, 3 = 贵
  speedTier: 1 | 2 | 3; // 1 = 快, 3 = 慢
  maxTokens: number;
}

export interface ModelPreference {
  provider?: ModelProvider;
  reason?: string;
  capabilities?: string[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string | null;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 模型注册表
function getModelRegistry(): ModelConfig[] {
  const env = getEnvConfig();

  return [
    {
      name: "GLM-4.7",
      provider: "glm",
      apiKey: env.GLM_API_KEY || "",
      endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      model: "glm-4-plus",
      capabilities: ["chinese", "code", "fast", "cheap", "general"],
      costTier: 1,
      speedTier: 1,
      maxTokens: 4096,
    },
    {
      name: "Grok-4.1",
      provider: "grok",
      apiKey: env.GROK_API_KEY || "",
      endpoint: "https://api.x.ai/v1/chat/completions",
      model: "grok-beta",
      capabilities: ["realtime_search", "research", "english"],
      costTier: 2,
      speedTier: 2,
      maxTokens: 4096,
    },
    {
      name: "Qwen",
      provider: "qwen",
      apiKey: env.SILICONFLOW_API_KEY || "",
      endpoint: "https://api.siliconflow.cn/v1/chat/completions",
      model: "Qwen/Qwen2.5-72B-Instruct",
      capabilities: ["chinese", "code", "general", "cheap"],
      costTier: 1,
      speedTier: 2,
      maxTokens: 4096,
    },
    {
      name: "DeepSeek",
      provider: "deepseek",
      apiKey: env.SILICONFLOW_API_KEY || "",
      endpoint: "https://api.siliconflow.cn/v1/chat/completions",
      model: "deepseek-ai/DeepSeek-V3",
      capabilities: ["reasoning", "code", "math", "cheap"],
      costTier: 1,
      speedTier: 1,
      maxTokens: 4096,
    },
  ].filter((m) => m.apiKey); // 只保留有 API Key 的模型
}

/**
 * 根据任务选择最佳模型
 */
export function selectModel(preference?: ModelPreference): ModelConfig {
  const registry = getModelRegistry();

  if (registry.length === 0) {
    throw new Error("没有可用的模型，请检查 API Key 配置");
  }

  // 如果指定了 provider，直接选择
  if (preference?.provider) {
    const model = registry.find((m) => m.provider === preference.provider);
    if (model) return model;
  }

  // 如果指定了 capabilities，匹配最佳
  if (preference?.capabilities && preference.capabilities.length > 0) {
    const scored = registry.map((model) => {
      const matchCount = preference.capabilities!.filter((cap) =>
        model.capabilities.includes(cap)
      ).length;
      return { model, score: matchCount };
    });

    scored.sort((a, b) => b.score - a.score);
    if (scored[0].score > 0) {
      return scored[0].model;
    }
  }

  // 默认选择成本最低的
  return registry.sort((a, b) => a.costTier - b.costTier)[0];
}

/**
 * 调用 LLM
 */
export async function invokeModel(
  model: ModelConfig,
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<LLMResponse> {
  const response = await fetch(model.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.model,
      messages,
      max_tokens: options?.maxTokens || model.maxTokens,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${model.name} API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    content: data.choices?.[0]?.message?.content || null,
    model: model.name,
    usage: data.usage,
  };
}

/**
 * 获取可用模型列表
 */
export function getAvailableModels(): string[] {
  return getModelRegistry().map((m) => m.name);
}

/**
 * 获取指定 provider 的模型配置
 */
export function getModel(provider: ModelProvider): ModelConfig | null {
  return getModelRegistry().find((m) => m.provider === provider) || null;
}
```

**Step 2: 验证**
```bash
pnpm check
```

---

### CDX-004: 集成多模型到 llm.ts [Phase 3]

**目标**: 让现有的 `invokeLLM` 使用多模型路由

**Step 1: 修改 server/_core/llm.ts**

```typescript
import {
  selectModel,
  invokeModel,
  type ModelPreference,
  type ChatMessage,
} from "./model-router";

export interface LLMOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  useThinking?: boolean;
  preferredModel?: ModelPreference;
}

export async function invokeLLM(options: LLMOptions): Promise<{
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}> {
  const model = selectModel(options.preferredModel);

  console.log(`[LLM] 使用模型: ${model.name}`);

  const response = await invokeModel(model, options.messages, {
    maxTokens: options.maxTokens,
    temperature: options.temperature,
  });

  // 转换为现有格式以保持兼容性
  return {
    choices: [
      {
        message: {
          content: response.content,
        },
      },
    ],
  };
}
```

**Step 2: 验证**
```bash
pnpm check
```

---

## ✅ 完成检查清单

```
[ ] CDX-001: useAIStream Hook
    [ ] 创建 useAIStream.ts
    [ ] 实现 SSE 连接逻辑
    [ ] 更新 api/index.ts 导出
    [ ] pnpm check 通过

[ ] CDX-002: 后端 SSE 端点
    [ ] 添加流式端点到 ai.ts 或 Express
    [ ] 连接 SmartAgent.stream()
    [ ] pnpm check 通过

[ ] CDX-003: model-router.ts
    [ ] 创建模型注册表
    [ ] 实现 selectModel()
    [ ] 实现 invokeModel()
    [ ] pnpm check 通过

[ ] CDX-004: llm.ts 集成
    [ ] 导入 model-router
    [ ] 修改 invokeLLM 使用多模型
    [ ] pnpm check 通过
```

---

## 🛑 阻塞处理

如果遇到以下情况，**立即停下并记录**:

1. **tRPC subscription 不支持**: 使用原生 Express SSE
2. **环境变量缺失**: 检查 `.env` 文件
3. **类型不匹配**: 查看 `server/_core/agent/types.ts`

记录格式:
```
### 🔴 阻塞: [任务ID]

**时间**: YYYY-MM-DD HH:MM
**问题描述**: ...
**尝试的解决方案**: ...
**需要的帮助**: ...
```

---

## 📤 完成后

1. 确保所有任务 `pnpm check` 通过
2. 在 README.md 更新任务状态
3. 提交代码:
```bash
git add -A
git commit -m "feat(ai): Codex 完成流式响应和多模型路由"
```

---

**任务版本**: v1.0  
**创建时间**: 2026-01-20 21:36
