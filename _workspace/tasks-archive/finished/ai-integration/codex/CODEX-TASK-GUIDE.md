# 🟢 Codex 过夜任务指南: 流式响应 + 多模型路由 + SimpleMem骨架

> **负责 Agent**: Codex (GPT-5.2)  
> **预计时间**: 5-6 小时  
> **执行模式**: 无人值守过夜执行

---

## ⚠️ 最重要的规则

```
1. 按 AI-COLLAB-PLAYBOOK 工作
2. 遇到问题立即停下，记录在本文件末尾，不要猜测
3. 每完成一个任务运行 pnpm check 验证
4. 使用 context7 MCP 查询库文档（如 Express SSE、tRPC 等）
5. 不要修改 GLM 负责的文件
```

---

## 📁 文件所有权声明

### ✅ 本任务拥有 (可修改)
- `client/src/refactor_v2/api/useAIStream.ts` (新建)
- `client/src/refactor_v2/api/index.ts` (添加导出)
- `server/routers/ai.ts` (添加 SSE 端点)
- `server/_core/model-router.ts` (新建)
- `server/_core/llm.ts` (修改支持多模型)
- `server/_core/memory/simplemem.types.ts` (新建)
- `server/_core/memory/analysis-memory-manager.ts` (新建)
- `server/_core/memory/index.ts` (添加导出)
- `server/_core/profile/user-profile.types.ts` (新建)
- `server/_core/profile/profile-manager.ts` (新建)
- `server/_core/profile/index.ts` (新建)

### 🚫 禁止触碰 (GLM 负责)
- `client/src/refactor_v2/components/FloatingAIChatInput.tsx`
- `client/src/refactor_v2/components/AIChatPanel.tsx`
- `client/src/refactor_v2/stores/aiChat.store.ts`
- `server/_core/agent/orchestrator.ts`
- `server/_core/analysis/stock-analysis-framework.ts`

---

## 📋 任务清单 (按顺序执行)

### CDX-000: SSE 契约定义 [Phase 0] ⏱️ 30min

**目标**: 定义统一的 SSE 端点和事件类型，让 GLM 可以基于契约开发 UI

**Step 1: 创建共享类型文件**

创建 `shared/stream.ts` (注意：不是 types/ 子目录，因为 shared/types.ts 已存在):

```typescript
/**
 * SSE 流式响应事件类型
 * 前后端共享，保持一致
 */

export type StreamEventType = 
  | "thinking"      // AI 正在思考
  | "tool_call"     // 开始调用工具
  | "tool_result"   // 工具返回结果
  | "content"       // 最终内容（可能多次发送，增量）
  | "done"          // 完成
  | "error";        // 错误

export interface StreamEvent {
  type: StreamEventType;
  data: unknown;
}

export interface ThinkingEvent {
  type: "thinking";
  data: string; // 思考内容
}

export interface ToolCallEvent {
  type: "tool_call";
  data: {
    toolCallId: string;
    name: string;
    args?: Record<string, unknown>;
  };
}

export interface ToolResultEvent {
  type: "tool_result";
  data: {
    toolCallId: string;
    name: string;
    ok: boolean;
    result?: string;
    error?: string;
    skipped?: boolean;
  };
}

export interface ContentEvent {
  type: "content";
  data: string; // 内容文本
}

export interface DoneEvent {
  type: "done";
  data: {
    sessionId: string;
    totalTokens?: number;
  };
}

export interface ErrorEvent {
  type: "error";
  data: string; // 错误信息
}

/**
 * SSE 请求参数
 * GET /api/ai/stream?message=...&sessionId=...&stockCode=...
 */
export interface StreamRequestParams {
  message: string;
  sessionId?: string;
  stockCode?: string;
  useThinking?: boolean;
}
```

**Step 2: 更新 shared/types.ts 添加导出**

在 `shared/types.ts` 末尾添加:
```typescript
export * from "./stream";
```

**Step 3: 验证**
```bash
pnpm check
```

**检查点**: `shared/stream.ts` 存在且类型检查通过

---

### CDX-001: useAIStream Hook [Phase 1] ⏱️ 1h

**目标**: 创建基于 SSE 的流式响应 hook

**Step 1: 创建 hook 文件**

创建 `client/src/refactor_v2/api/useAIStream.ts`:

```typescript
import { useState, useCallback, useRef, useEffect } from "react";
import type {
  StreamEvent,
  StreamRequestParams,
  ToolCallEvent,
  ToolResultEvent,
} from "@shared/stream";

export interface TodoStep {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  toolName?: string;
  resultPreview?: string;
}

export interface UseAIStreamReturn {
  isStreaming: boolean;
  streamContent: string;
  progress: TodoStep[];
  error: string | null;
  startStream: (message: string, options?: Omit<StreamRequestParams, "message">) => void;
  stopStream: () => void;
}

export function useAIStream(): UseAIStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [progress, setProgress] = useState<TodoStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // 清理函数
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startStream = useCallback(
    (message: string, options?: Omit<StreamRequestParams, "message">) => {
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
        const params = new URLSearchParams({ message });
        if (options?.sessionId) params.set("sessionId", options.sessionId);
        if (options?.stockCode) params.set("stockCode", options.stockCode);
        if (options?.useThinking) params.set("useThinking", "true");

        const url = `/api/ai/stream?${params.toString()}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as StreamEvent;

            switch (data.type) {
              case "thinking":
                // 可以显示思考状态
                break;

              case "tool_call": {
                const toolData = data.data as ToolCallEvent["data"];
                setProgress((prev) => [
                  ...prev,
                  {
                    id: toolData.toolCallId,
                    title: `调用 ${toolData.name}`,
                    status: "in_progress",
                    toolName: toolData.name,
                  },
                ]);
                break;
              }

              case "tool_result": {
                const resultData = data.data as ToolResultEvent["data"];
                setProgress((prev) =>
                  prev.map((step) =>
                    step.id === resultData.toolCallId
                      ? {
                          ...step,
                          status: resultData.skipped
                            ? "skipped"
                            : resultData.ok
                              ? "completed"
                              : "failed",
                          resultPreview: resultData.result?.slice(0, 100),
                        }
                      : step
                  )
                );
                break;
              }

              case "content":
                setStreamContent(data.data as string);
                break;

              case "done":
                eventSource.close();
                setIsStreaming(false);
                break;

              case "error":
                setError(data.data as string);
                eventSource.close();
                setIsStreaming(false);
                break;
            }
          } catch (parseError) {
            console.error("Failed to parse SSE event:", parseError);
          }
        };

        eventSource.onerror = () => {
          console.error("SSE connection error");
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

**Step 2: 更新 API 导出**

修改 `client/src/refactor_v2/api/index.ts`，添加:
```typescript
export * from "./useAIStream";
```

**Step 3: 验证**
```bash
pnpm check
```

**检查点**: useAIStream hook 导出成功，无类型错误

---

### CDX-002: 后端 SSE 端点 [Phase 1] ⏱️ 1.5h

**目标**: 添加原生 Express SSE 端点，连接 SmartAgent.stream()

**重要**: tRPC 不直接支持 SSE，使用原生 Express 路由

**Step 1: 找到 Express app 入口**

查看 `server/_core/index.ts` 或 `server/_core/vite.ts`，找到 Express app 实例。

**Step 2: 添加 SSE 路由**

在 Express app 配置中添加（可能在 `server/_core/index.ts`）:

```typescript
import { createSmartAgent } from "./agent";
import type { StreamRequestParams } from "@shared/stream";

// SSE 流式 AI 对话端点
app.get("/api/ai/stream", async (req, res) => {
  // 设置 SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // 禁用 nginx 缓冲
  res.flushHeaders();

  // 解析参数
  const message = req.query.message as string;
  const sessionId = req.query.sessionId as string | undefined;
  const stockCode = req.query.stockCode as string | undefined;
  const useThinking = req.query.useThinking === "true";

  if (!message) {
    res.write(`data: ${JSON.stringify({ type: "error", data: "缺少 message 参数" })}\n\n`);
    res.end();
    return;
  }

  // 发送事件的辅助函数
  const sendEvent = (event: { type: string; data: unknown }) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Keep-alive ping
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 15000);

  try {
    const agent = createSmartAgent({
      sessionId,
      stockCode,
      thinkHard: useThinking,
    });

    for await (const event of agent.stream(message)) {
      sendEvent(event);
    }

    // 发送完成事件
    sendEvent({
      type: "done",
      data: { sessionId: agent.getSessionId() },
    });
  } catch (error) {
    console.error("SSE stream error:", error);
    sendEvent({
      type: "error",
      data: error instanceof Error ? error.message : "流式响应失败",
    });
  } finally {
    clearInterval(keepAlive);
    res.end();
  }
});
```

**Step 3: 验证 SSE 端点**

启动服务器后测试:
```bash
curl -N "http://localhost:6888/api/ai/stream?message=你好"
```

应该看到 `data: {...}` 格式的输出。

**Step 4: pnpm check**
```bash
pnpm check
```

**检查点**: curl 能收到 SSE 事件

---

### CDX-003: model-router.ts [Phase 2] ⏱️ 1h

**目标**: 创建多模型路由系统

**Step 1: 读取现有环境变量**

查看 `server/_core/env.ts` 了解已有的 API Key 配置。

**Step 2: 创建 model-router.ts**

创建 `server/_core/model-router.ts`:

```typescript
/**
 * 多模型路由系统
 * 根据任务类型选择最佳模型
 */

import { ENV } from "./env";

export type ModelProvider = "glm" | "grok" | "qwen" | "deepseek";

export interface ModelConfig {
  name: string;
  provider: ModelProvider;
  apiKey: string;
  endpoint: string;
  model: string;
  capabilities: string[];
  costTier: number; // 1=便宜 2=中等 3=贵
  speedTier: number; // 1=快 2=中 3=慢
  maxTokens: number;
}

export interface ModelPreference {
  provider?: ModelProvider;
  capabilities?: string[];
  preferCheap?: boolean;
  preferFast?: boolean;
  reason?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
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

/**
 * 获取所有可用模型
 */
export function getModelRegistry(): ModelConfig[] {
  const models: ModelConfig[] = [];

  // GLM-4.7
  if (ENV.glmApiKey) {
    models.push({
      name: "GLM-4.7",
      provider: "glm",
      apiKey: ENV.glmApiKey,
      endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      model: "glm-4-plus",
      capabilities: ["chinese", "code", "agent", "cheap", "fast"],
      costTier: 1,
      speedTier: 1,
      maxTokens: 4096,
    });
  }

  // Grok-4.1
  if (ENV.grokApiKey) {
    models.push({
      name: "Grok-4.1",
      provider: "grok",
      apiKey: ENV.grokApiKey,
      endpoint: "https://api.x.ai/v1/chat/completions",
      model: "grok-beta",
      capabilities: ["realtime_search", "research", "english"],
      costTier: 2,
      speedTier: 2,
      maxTokens: 4096,
    });
  }

  // Qwen (via SiliconFlow)
  if (ENV.siliconflowApiKey) {
    models.push({
      name: "Qwen-72B",
      provider: "qwen",
      apiKey: ENV.siliconflowApiKey,
      endpoint: "https://api.siliconflow.cn/v1/chat/completions",
      model: "Qwen/Qwen2.5-72B-Instruct",
      capabilities: ["chinese", "code", "general", "cheap"],
      costTier: 1,
      speedTier: 2,
      maxTokens: 4096,
    });

    // DeepSeek (via SiliconFlow)
    models.push({
      name: "DeepSeek-V3",
      provider: "deepseek",
      apiKey: ENV.siliconflowApiKey,
      endpoint: "https://api.siliconflow.cn/v1/chat/completions",
      model: "deepseek-ai/DeepSeek-V3",
      capabilities: ["reasoning", "code", "math", "cheap"],
      costTier: 1,
      speedTier: 1,
      maxTokens: 4096,
    });
  }

  console.log(`[ModelRouter] 可用模型: ${models.map(m => m.name).join(", ") || "无"}`);
  return models;
}

/**
 * 根据偏好选择最佳模型
 */
export function selectModel(preference?: ModelPreference): ModelConfig {
  const registry = getModelRegistry();

  if (registry.length === 0) {
    throw new Error("没有可用的模型，请检查 API Key 配置");
  }

  // 如果指定了 provider，直接选择
  if (preference?.provider) {
    const model = registry.find((m) => m.provider === preference.provider);
    if (model) {
      console.log(`[ModelRouter] 选择 ${model.name} (指定 provider: ${preference.provider})`);
      return model;
    }
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
      console.log(`[ModelRouter] 选择 ${scored[0].model.name} (匹配能力: ${preference.capabilities.join(", ")})`);
      return scored[0].model;
    }
  }

  // 根据偏好排序
  let sorted = [...registry];
  if (preference?.preferCheap) {
    sorted.sort((a, b) => a.costTier - b.costTier);
  } else if (preference?.preferFast) {
    sorted.sort((a, b) => a.speedTier - b.speedTier);
  } else {
    // 默认选择成本最低的
    sorted.sort((a, b) => a.costTier - b.costTier);
  }

  console.log(`[ModelRouter] 选择 ${sorted[0].name} (默认)`);
  return sorted[0];
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

// 为了兼容 GLM 的导入，添加别名
export const selectModelForTask = selectModel;
```

**Step 3: 验证**
```bash
pnpm check
```

---

### CDX-004: llm.ts 集成多模型 [Phase 2] ⏱️ 30min

**目标**: 让现有的 `invokeLLM` 支持多模型选择

**Step 1: 修改 llm.ts**

在 `server/_core/llm.ts` 中添加多模型支持。

找到 `invokeLLM` 函数，添加可选的 `preferredModel` 参数:

```typescript
import {
  selectModel,
  invokeModel as invokeModelFromRouter,
  type ModelPreference,
} from "./model-router";

// 在 InvokeParams 接口中添加
export interface InvokeParams {
  // ... 现有字段
  preferredModel?: ModelPreference;
}

// 在 invokeLLM 函数开头添加模型选择逻辑
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  // 如果指定了 preferredModel，使用多模型路由
  if (params.preferredModel) {
    const model = selectModel(params.preferredModel);
    console.log(`[LLM] 使用多模型路由: ${model.name}`);
    
    const messages = params.messages.map(m => ({
      role: m.role as "system" | "user" | "assistant" | "tool",
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      name: m.name,
      tool_call_id: m.tool_call_id,
    }));

    const response = await invokeModelFromRouter(model, messages, {
      maxTokens: params.maxTokens || params.max_tokens,
    });

    // 转换为现有格式
    return {
      id: `mr-${Date.now()}`,
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: response.content || "",
        },
        finish_reason: "stop",
      }],
      usage: response.usage,
    };
  }

  // 原有逻辑保持不变
  assertApiKey();
  // ... 后续原有代码
}
```

**Step 2: 验证**
```bash
pnpm check
```

---

### CDX-005: SimpleMem 类型定义 [Phase 4] ⏱️ 1h

**目标**: 定义 SimpleMem 接口和类型（仅骨架，不改变现有行为）

**Step 1: 创建类型文件**

创建 `server/_core/memory/simplemem.types.ts`:

```typescript
/**
 * SimpleMem - 智能记忆系统类型定义
 * 用于证券分析的压缩记忆管理
 */

// ============ Portfolio Memory ============

export interface CompressedPortfolio {
  holdings: {
    code: string;
    symbol: string;
    quantity: number;
    avgCost: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    holdDays: number;
    timeframe: "short" | "medium" | "long";
  }[];

  stats: {
    totalValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    concentrationRatio: number;
    diversificationScore: number;
  };

  patterns: {
    avgHoldDays: number;
    winRate: number;
    profitFactor: number;
    maxConsecutiveLosses: number;
    chaseHighTendency: number;
    panicSellTendency: number;
  };
}

// ============ Operation Memory ============

export interface CompressedOperations {
  recentOps: {
    stock: string;
    action: "buy" | "sell";
    price: number;
    date: string;
    outcome: "profit" | "loss" | "pending";
    pnl: number;
  }[];

  weeklyPattern: {
    preferredBuyDay: string;
    preferredSellDay: string;
    bestTimeOfDay: string;
  };

  emotionalPattern: {
    hasLossAversion: boolean;
    chasingHighFrequency: number;
    overtradingRisk: boolean;
    lastLossDate: string | null;
    consecutiveLossCount: number;
  };
}

// ============ User Mindset ============

export interface UserMindset {
  confidence: number;
  riskTolerance: number;
  timeHorizon: "day" | "week" | "month" | "quarter" | "year";

  psychologicalState: {
    hasRecentLoss: boolean;
    isGreedyPhase: boolean;
    isFearPhase: boolean;
    overfitToRecentTrend: boolean;
  };

  decisionQuality: {
    analysisDepth: "quick" | "medium" | "deep";
    timeSpentAnalyzing: number;
    consultedSources: number;
  };
}

// ============ User Profile ============

export interface UserProfile {
  tradingExperience: "beginner" | "intermediate" | "advanced";
  preferredStrategy: "technical" | "fundamental" | "sentiment" | "mixed";

  learningHistory: {
    frequentMistakes: string[];
    improvementAreas: string[];
    successfulPatterns: string[];
  };

  preferences: {
    analysisDetailLevel: "brief" | "standard" | "detailed";
    questionStyle: "direct" | "socratic";
    dataVisualization: "text" | "table" | "chart";
    frequencyOfQuestions: "none" | "few" | "many";
  };

  marketView: {
    currentOutlook: "bullish" | "neutral" | "bearish";
    favoredSectors: string[];
    avoidedSectors: string[];
    lastUpdated: string;
  };
}

// ============ Context Memory ============

export interface ConversationContext {
  currentSession: {
    startTime: string;
    focusStocks: string[];
    mainQueries: string[];
    decisionsMade: {
      decision: string;
      reasoning: string;
      timestamp: string;
    }[];
  };

  knownFacts: Record<string, string>;

  questioningState: {
    questionsAsked: string[];
    questionsNeedFollow: string[];
    informationGaps: string[];
  };
}

// ============ Holding Memory ============

export interface HoldingMemory {
  code: string;
  symbol: string;

  costBasis: {
    totalShares: number;
    avgPrice: number;
    totalCost: number;
    firstBuyDate: string;
    lastBuyDate: string;
  };

  transactionHistory: {
    date: string;
    action: "buy" | "sell" | "partial_sell";
    shares: number;
    price: number;
    reason: string;
  }[];

  psychologicalExpectation: {
    targetPrice: number;
    stopLossPrice: number;
    holdingDaysExpected: number;
    worstCaseLossAcceptable: number;
  };

  reviewResult?: {
    date: string;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    outcome: "achieved_target" | "hit_stoploss" | "pending" | "exited_early";
    lessonsLearned: string;
  };
}

// ============ Operation Pattern ============

export interface OperationPattern {
  operationType: "chaseHigh" | "cuttingLoss" | "longTermHold" | "swingTrade" | "dayTrade";

  successMetrics: {
    totalAttempts: number;
    successCount: number;
    failureCount: number;
    avgReturnSuccess: number;
    avgReturnFailure: number;
    profitFactor: number;
  };

  triggerConditions: {
    marketCondition: "strong_bull" | "bull" | "neutral" | "bear" | "strong_bear";
    volumePattern: "volume_breakout" | "volume_accumulation" | "volume_decline";
    sentiment: "extreme_greed" | "greed" | "neutral" | "fear" | "extreme_fear";
  };

  riskProfile: {
    maxDrawdown: number;
    volatility: number;
    recoveryTime: number;
    blackSwanRisk: string[];
  };

  personalReview: {
    whenUserSucceeds: string[];
    whenUserFails: string[];
    recommendation: string;
  };
}

// ============ SimpleMem Interface ============

export interface SimpleMemEntry {
  domain: string;
  key: string;
  content: string;
  timestamp: number;
  ttl?: number;
  importance: number;
}

export interface SimpleMemQuery {
  domain: string;
  query: string;
  limit?: number;
}

export interface ISimpleMem {
  remember(entry: SimpleMemEntry): Promise<void>;
  retrieve(query: SimpleMemQuery): Promise<SimpleMemEntry[]>;
  forget(domain: string, key: string): Promise<boolean>;
}
```

**Step 2: 更新 memory/index.ts 导出**

```typescript
export * from "./memory-store";
export * from "./simplemem.types";
```

**Step 3: 验证**
```bash
pnpm check
```

---

### CDX-006: AnalysisMemoryManager 骨架 [Phase 4] ⏱️ 30min

**目标**: 创建 AnalysisMemoryManager 空实现骨架

创建 `server/_core/memory/analysis-memory-manager.ts`:

---

### CDX-007: 用户画像系统类型定义 [Phase 4] ⏱️ 1h

**目标**: 定义完整的用户画像 (User Profile) 数据模型

**Step 1: 创建用户画像类型文件**

创建 `server/_core/profile/user-profile.types.ts`:

```typescript
/**
 * AnalysisMemoryManager - 分析记忆管理器
 * 
 * 骨架实现，后续填充具体逻辑
 * 当前版本：仅定义接口，不改变现有行为
 */

import { getMemoryStore } from "./memory-store";
import type {
  ISimpleMem,
  SimpleMemEntry,
  SimpleMemQuery,
  HoldingMemory,
  OperationPattern,
  ConversationContext,
  UserProfile,
} from "./simplemem.types";

export class AnalysisMemoryManager implements ISimpleMem {
  private userId: string;
  private memoryStore = getMemoryStore();

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 存储记忆
   */
  async remember(entry: SimpleMemEntry): Promise<void> {
    // TODO: 实现压缩存储逻辑
    console.log(`[AnalysisMemory] Remember: ${entry.domain}/${entry.key}`);
  }

  /**
   * 检索记忆
   */
  async retrieve(query: SimpleMemQuery): Promise<SimpleMemEntry[]> {
    // TODO: 实现检索逻辑
    console.log(`[AnalysisMemory] Retrieve: ${query.domain}/${query.query}`);
    return [];
  }

  /**
   * 遗忘记忆
   */
  async forget(domain: string, key: string): Promise<boolean> {
    // TODO: 实现删除逻辑
    console.log(`[AnalysisMemory] Forget: ${domain}/${key}`);
    return true;
  }

  /**
   * 记录持仓变化
   */
  async recordPortfolioChange(holding: HoldingMemory): Promise<void> {
    // TODO: 实现
  }

  /**
   * 记录操作结果
   */
  async recordOperationResult(params: {
    stock: string;
    action: "buy" | "sell";
    entryPrice: number;
    exitPrice?: number;
    outcome: "profit" | "loss" | "pending";
    reasoning: string;
    lessonsLearned: string;
  }): Promise<void> {
    // TODO: 实现
  }

  /**
   * 获取操作模式
   */
  async getOperationPatterns(experienceLevel: string): Promise<OperationPattern[]> {
    // TODO: 实现
    return [];
  }

  /**
   * 获取用户上下文
   */
  async getUserContext(): Promise<ConversationContext> {
    return {
      currentSession: {
        startTime: new Date().toISOString(),
        focusStocks: [],
        mainQueries: [],
        decisionsMade: [],
      },
      knownFacts: {},
      questioningState: {
        questionsAsked: [],
        questionsNeedFollow: [],
        informationGaps: [],
      },
    };
  }

  /**
   * 获取用户画像
   */
  async getUserProfile(): Promise<UserProfile> {
    // TODO: 从存储加载
    return {
      tradingExperience: "intermediate",
      preferredStrategy: "mixed",
      learningHistory: {
        frequentMistakes: [],
        improvementAreas: [],
        successfulPatterns: [],
      },
      preferences: {
        analysisDetailLevel: "standard",
        questionStyle: "direct",
        dataVisualization: "text",
        frequencyOfQuestions: "few",
      },
      marketView: {
        currentOutlook: "neutral",
        favoredSectors: [],
        avoidedSectors: [],
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}

// 工厂函数
export function createAnalysisMemoryManager(userId: string): AnalysisMemoryManager {
  return new AnalysisMemoryManager(userId);
}
```

**更新 memory/index.ts**:
```typescript
export * from "./memory-store";
export * from "./simplemem.types";
export * from "./analysis-memory-manager";
```

**验证**:
```bash
pnpm check
```

---

### CDX-007: 用户画像系统类型定义 [Phase 4] ⏱️ 1h

**目标**: 定义完整的用户画像 (User Profile) 数据模型，用于 AI 交易顾问的个性化服务

**Step 1: 创建目录和类型文件**

创建 `server/_core/profile/` 目录。

创建 `server/_core/profile/user-profile.types.ts`:

```typescript
/**
 * 用户画像系统 - 完整类型定义
 * 用于 AI 交易顾问的个性化服务
 */

// ============ 基础信息 ============

export interface BasicInfo {
  name?: string;
  nickname: string; // 用于称呼
  ageRange: "18-30" | "30-45" | "45-60" | "60+";
  profession?: string;
  yearsTradingExperience: number;
  tradingStartDate?: string;
}

// ============ 财务信息 ============

export interface FinancialProfile {
  totalTradingCapital: number; // 总交易资金
  monthlyAvailableAmount: number; // 每月可投入金额
  dailyTradingTimeHours: number; // 每天可投入时间
  tradingFrequency: "daily" | "3-5x_week" | "weekly" | "occasional";
  primaryMarkets: ("stocks" | "crypto" | "futures" | "forex")[];
}

// ============ 风险偏好 ============

export interface RiskProfile {
  riskTolerance: "conservative" | "moderate" | "aggressive";
  singleTradeMaxLossPct: number; // 单笔最大亏损比例
  singleTradeMaxLossUsd?: number;
  dailyMaxLossPct: number;
  dailyMaxLossUsd?: number;
  monthlyMaxLossPct: number;
  annualRiskBudgetUsd?: number;
  maxPositionSizePct: number; // 单股最大仓位比例
  portfolioConcentrationTolerance: "low" | "moderate" | "high";
}

// ============ 交易目标 ============

export interface TradingGoals {
  primaryObjective: 
    | "wealth_growth" 
    | "income_generation" 
    | "retirement_savings" 
    | "risk_hedge" 
    | "learning";
  secondaryObjectives: string[];
  expectedHoldingPeriod: 
    | "intraday" 
    | "1-7days" 
    | "1-4weeks" 
    | "1-3months" 
    | "6months+";
  profitTakingTimeframe: 
    | "quick_scalp" 
    | "fast_return" 
    | "patient_investor" 
    | "very_long_term";
  yearlyReturnTargetPct?: number;
}

// ============ 心理特征 ============

export interface PastMistake {
  type: 
    | "holding_too_long" 
    | "selling_too_early" 
    | "fomo_chasing" 
    | "revenge_trading" 
    | "over_leveraging";
  frequency: "rarely" | "sometimes" | "frequently" | "very_frequently";
  impact: "minor" | "moderate" | "significant";
  description?: string;
}

export interface PsychologicalProfile {
  decisionMakingStyle: "analytical" | "intuitive" | "mixed";
  executionStyle: "systematic" | "flexible" | "mixed";
  emotionalStability: "low" | "moderate" | "high";
  holdingTendency: "holds_too_long" | "sells_too_early" | "balanced";
  trendFollowingTendency: "strong_fomo" | "moderate_fomo" | "minimal_fomo";
  lossAversionScore: number; // 1-10, 10=最强
  patienceScore: number; // 1-10, 10=最有耐心
  overthinkingScore: number; // 1-10, 10=最容易过度思考
  impulsivityScore: number; // 1-10, 10=最冲动
  pastMajorMistakes: PastMistake[];
}

// ============ 技术知识 ============

export type KnowledgeLevel = 
  | "not_familiar" 
  | "beginner" 
  | "intermediate" 
  | "advanced" 
  | "expert";

export interface TechnicalKnowledge {
  familiarityWithChanlun: KnowledgeLevel; // 缠论
  familiarityWithFibonacci: KnowledgeLevel;
  familiarityWithMaSystem: KnowledgeLevel; // 均线系统
  familiarityWithMacd: KnowledgeLevel;
  familiarityWithRsi: KnowledgeLevel;
  preferredTechnicalFramework: 
    | "chanlun" 
    | "fibonacci" 
    | "moving_average" 
    | "combined" 
    | "chart_reading";
  technicalAnalysisConfidence: number; // 1-10
  fundamentalAnalysisUsage: "never" | "sometimes" | "often" | "primary_method";
}

// ============ 交易约束 ============

export interface TradingHours {
  start: string; // HH:MM
  end: string;
  timezone: string;
}

export interface TradingConstraints {
  geographicRestrictions: string[];
  regulatoryConstraints: string[];
  timeZone: string;
  tradingHoursAvailable: {
    mondayToFriday: TradingHours;
    weekend: { available: boolean };
  };
  minimumHoldingPeriodHours: number;
  maximumConcurrentPositions: number;
}

// ============ 完整用户画像 ============

export interface UserProfileFull {
  userId: string;
  createdAt: string;
  updatedAt: string;
  profileVersion: number;
  
  basicInfo: BasicInfo;
  financialProfile: FinancialProfile;
  riskProfile: RiskProfile;
  tradingGoals: TradingGoals;
  psychologicalProfile: PsychologicalProfile;
  technicalKnowledge: TechnicalKnowledge;
  tradingConstraints: TradingConstraints;
}

// ============ 行为历史 ============

export interface TradingDecision {
  ticker: string;
  decision: "hold" | "sell_partial" | "sell_all" | "buy" | "add_position";
  reasonStated: string;
  confidenceLevel: number; // 1-10
  emotionalStateDetected: "fearful" | "greedy" | "anxious" | "confident" | "calm";
}

export interface AIRecommendation {
  recommendation: string;
  adopted: boolean;
  result?: "positive" | "neutral" | "negative";
}

export interface BehaviorHistoryEntry {
  behaviorHistoryId: string;
  userId: string;
  timestamp: string;
  sessionType: 
    | "questionnaire" 
    | "trading_analysis" 
    | "decision_query" 
    | "report_review" 
    | "feedback";
  sessionData: {
    aiQuestionsAsked: string[];
    userResponses: string[];
    decisionsMade: TradingDecision[];
    aiRecommendations: AIRecommendation[];
  };
}

// ============ 持仓管理规则 ============

export interface ProfitTakingStage {
  profitPct: number;
  sellPctOfPosition: number;
  action: string;
}

export interface PositionManagementRules {
  positionRuleId: string;
  userId: string;
  ticker: string; // 或 "default" 表示所有股票
  ruleType: "profit_taking" | "stop_loss" | "scaling";
  rules: {
    profitTaking: {
      enabled: boolean;
      stages: ProfitTakingStage[];
      trailingStop: {
        enabled: boolean;
        triggerProfitPct: number;
        trailingDistancePct: number;
      };
    };
    stopLoss: {
      enabled: boolean;
      fixedLossPct: number;
      technicalStopPrice?: number;
      enforceStrictly: boolean;
      exceptions: string[];
    };
    scaling: {
      allowed: boolean;
      maxAdditionalPositions: number;
      scalingPercentage: number;
      conditions: string[];
    };
  };
  createdAt: string;
  lastModified: string;
}

// ============ AI 使用的精简版 Profile ============

export interface ProfileForAI {
  userId: string;
  nickname: string;
  
  // 关键风险参数
  riskTolerance: RiskProfile["riskTolerance"];
  singleTradeMaxLossPct: number;
  maxPositionSizePct: number;
  
  // 心理特征
  emotionalStability: PsychologicalProfile["emotionalStability"];
  holdingTendency: PsychologicalProfile["holdingTendency"];
  lossAversionScore: number;
  impulsivityScore: number;
  knownWeaknesses: string[]; // 从 pastMajorMistakes 提取
  
  // 交易风格
  expectedHoldingPeriod: TradingGoals["expectedHoldingPeriod"];
  decisionMakingStyle: PsychologicalProfile["decisionMakingStyle"];
  
  // 技术偏好
  preferredFramework: TechnicalKnowledge["preferredTechnicalFramework"];
  technicalConfidence: number;
  
  // 约束
  maxConcurrentPositions: number;
  
  // 历史统计
  stats: {
    totalDecisions: number;
    aiAdoptionRate: number; // 采纳 AI 建议的比例
    successRate: number; // 成功交易比例
    commonMistakePatterns: string[];
  };
}
```

**Step 2: 创建 ProfileManager 骨架**

创建 `server/_core/profile/profile-manager.ts`:

```typescript
/**
 * ProfileManager - 用户画像管理器
 * 
 * 骨架实现，后续填充具体逻辑
 */

import type {
  UserProfileFull,
  ProfileForAI,
  BehaviorHistoryEntry,
  PositionManagementRules,
  TradingDecision,
} from "./user-profile.types";

export class ProfileManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 获取完整用户画像
   */
  async getFullProfile(): Promise<UserProfileFull | null> {
    // TODO: 从存储加载
    console.log(`[ProfileManager] 获取用户画像: ${this.userId}`);
    return null;
  }

  /**
   * 获取 AI 使用的精简版画像
   */
  async getProfileForAI(): Promise<ProfileForAI | null> {
    // TODO: 从完整画像提取关键信息
    console.log(`[ProfileManager] 获取 AI 画像: ${this.userId}`);
    return null;
  }

  /**
   * 更新用户画像
   */
  async updateProfile(updates: Partial<UserProfileFull>): Promise<void> {
    // TODO: 实现更新逻辑
    console.log(`[ProfileManager] 更新画像: ${this.userId}`);
  }

  /**
   * 记录交易决策
   */
  async recordDecision(decision: TradingDecision): Promise<void> {
    // TODO: 记录到行为历史
    console.log(`[ProfileManager] 记录决策: ${decision.ticker} - ${decision.decision}`);
  }

  /**
   * 获取行为历史
   */
  async getBehaviorHistory(limit?: number): Promise<BehaviorHistoryEntry[]> {
    // TODO: 从存储加载
    return [];
  }

  /**
   * 获取持仓管理规则
   */
  async getPositionRules(ticker?: string): Promise<PositionManagementRules[]> {
    // TODO: 从存储加载
    return [];
  }

  /**
   * 设置持仓管理规则
   */
  async setPositionRule(rule: PositionManagementRules): Promise<void> {
    // TODO: 保存规则
    console.log(`[ProfileManager] 设置持仓规则: ${rule.ticker}`);
  }

  /**
   * 分析用户行为模式
   */
  async analyzePatterns(): Promise<{
    commonMistakes: string[];
    successPatterns: string[];
    recommendations: string[];
  }> {
    // TODO: 分析历史数据
    return {
      commonMistakes: [],
      successPatterns: [],
      recommendations: [],
    };
  }
}

// 工厂函数
export function createProfileManager(userId: string): ProfileManager {
  return new ProfileManager(userId);
}
```

**Step 3: 创建导出文件**

创建 `server/_core/profile/index.ts`:

```typescript
export * from "./user-profile.types";
export * from "./profile-manager";
```

**Step 4: 验证**
```bash
pnpm check
```

---

## ✅ 完成检查清单

```
Phase 0:
[ ] CDX-000: 共享类型定义
    [ ] 创建 shared/stream.ts
    [ ] 更新 shared/types.ts 添加导出
    [ ] pnpm check 通过

Phase 1:
[ ] CDX-001: useAIStream Hook
    [ ] 创建 useAIStream.ts
    [ ] 更新 api/index.ts 导出
    [ ] pnpm check 通过

[ ] CDX-002: 后端 SSE 端点
    [ ] 添加 Express SSE 路由
    [ ] 连接 SmartAgent.stream()
    [ ] curl 测试通过
    [ ] pnpm check 通过

Phase 2:
[ ] CDX-003: model-router.ts
    [ ] 创建模型注册表
    [ ] 实现 selectModel()
    [ ] 实现 invokeModel()
    [ ] pnpm check 通过

[ ] CDX-004: llm.ts 集成
    [ ] 添加 preferredModel 支持
    [ ] pnpm check 通过

Phase 4:
[ ] CDX-005: SimpleMem 类型定义
    [ ] 创建 simplemem.types.ts
    [ ] pnpm check 通过

[ ] CDX-006: AnalysisMemoryManager 骨架
    [ ] 创建 analysis-memory-manager.ts
    [ ] pnpm check 通过

[ ] CDX-007: 用户画像系统
    [ ] 创建 profile/ 目录
    [ ] 创建 user-profile.types.ts
    [ ] 创建 profile-manager.ts
    [ ] 创建 index.ts 导出
    [ ] pnpm check 通过
```

---

## 🛑 阻塞处理

如果遇到以下情况，**立即停下并在下方记录**:

1. **找不到 Express app 入口** - 搜索 `express()` 或 `createServer`
2. **环境变量名称不匹配** - 检查 `server/_core/env.ts`
3. **SmartAgent.stream() 不存在** - 检查 `smart-agent.ts`
4. **shared/ 目录不存在** - 创建目录或放在 server/_core/types/

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
2. 提交代码:
```bash
git add -A
git commit -m "feat(ai): Codex 完成流式响应、多模型路由、SimpleMem 骨架和用户画像系统"
```

---

## 🔴 阻塞记录区

(Codex 在此记录遇到的阻塞问题)

### 🔴 阻塞: CDX-000

**时间**: 2026-01-20 22:44  
**问题描述**: 无法创建 `shared/types/stream.ts`，因为已有文件 `shared/types.ts` 与目录 `shared/types/` 路径冲突。  
**尝试的解决方案**: 检查 `shared/` 目录结构并确认冲突。  
**需要的帮助**: 请确认是否允许调整现有 `shared/types.ts`（改名/迁移），或改为将 stream 类型放到其他路径（如 `shared/stream.ts` 或 `server/_core/types/`）。  

### 🔴 阻塞: CDX-000 - pnpm check

**时间**: 2026-01-20 23:28  
**问题描述**: `pnpm check` 失败，报错来自 `server/experiments/*` 的语法错误（与本任务无关）。  
**尝试的解决方案**: 仅运行 `pnpm check` 复现错误，未修改实验文件。  
**需要的帮助**: 请确认是否需要修复 `server/experiments` 下的语法问题，或将其从 `tsconfig.json` 的编译范围中排除。  



---

**任务版本**: v2.0  
**创建时间**: 2026-01-20 22:00  
**预计完成**: 2026-01-21 06:00
