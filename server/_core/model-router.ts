/**
 * Multi-model routing based on preferences and capabilities.
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
  costTier: number;
  speedTier: number;
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

const withPath = (base: string, path: string) =>
  `${base.replace(/\/$/, "")}${path}`;

export function getModelRegistry(): ModelConfig[] {
  const models: ModelConfig[] = [];

  if (ENV.glmApiKey) {
    models.push({
      name: "GLM-4.7",
      provider: "glm",
      apiKey: ENV.glmApiKey,
      endpoint: withPath(ENV.glmApiUrl, "/chat/completions"),
      model: ENV.glmModel || "glm-4.7",
      capabilities: ["chinese", "code", "agent", "fast"],
      costTier: 2,
      speedTier: 1,
      maxTokens: 4096,
    });
  }

  if (ENV.grokApiKey) {
    models.push({
      name: "Grok",
      provider: "grok",
      apiKey: ENV.grokApiKey,
      endpoint: withPath(ENV.grokApiUrl, "/chat/completions"),
      model: ENV.grokModel || "grok-4-1-fast-reasoning",
      capabilities: ["realtime_search", "research", "english"],
      costTier: 3,
      speedTier: 2,
      maxTokens: 4096,
    });
  }

  if (ENV.forgeApiKey) {
    const forgeEndpoint = withPath(ENV.forgeApiUrl, "/v1/chat/completions");

    models.push({
      name: "Qwen-72B",
      provider: "qwen",
      apiKey: ENV.forgeApiKey,
      endpoint: forgeEndpoint,
      model: "Qwen/Qwen2.5-72B-Instruct",
      capabilities: ["chinese", "code", "general", "cheap"],
      costTier: 1,
      speedTier: 2,
      maxTokens: 4096,
    });

    models.push({
      name: "DeepSeek-V3",
      provider: "deepseek",
      apiKey: ENV.forgeApiKey,
      endpoint: forgeEndpoint,
      model: "deepseek-ai/DeepSeek-V3",
      capabilities: ["reasoning", "code", "math", "cheap", "fast"],
      costTier: 1,
      speedTier: 1,
      maxTokens: 4096,
    });
  }

  console.log(
    `[ModelRouter] Available models: ${
      models.map(m => m.name).join(", ") || "none"
    }`
  );
  return models;
}

export function selectModel(preference?: ModelPreference): ModelConfig {
  const registry = getModelRegistry();

  if (registry.length === 0) {
    throw new Error("No available models. Check API key configuration.");
  }

  if (preference?.provider) {
    const model = registry.find(m => m.provider === preference.provider);
    if (model) {
      console.log(
        `[ModelRouter] Selected ${model.name} (provider: ${preference.provider})`
      );
      return model;
    }
  }

  if (preference?.capabilities && preference.capabilities.length > 0) {
    const scored = registry.map(model => {
      const matchCount = preference.capabilities!.filter(cap =>
        model.capabilities.includes(cap)
      ).length;
      return { model, score: matchCount };
    });

    scored.sort((a, b) => b.score - a.score);
    if (scored[0].score > 0) {
      console.log(
        `[ModelRouter] Selected ${scored[0].model.name} (capabilities: ${preference.capabilities.join(", ")})`
      );
      return scored[0].model;
    }
  }

  const sorted = [...registry];
  if (preference?.preferCheap) {
    sorted.sort((a, b) => a.costTier - b.costTier);
  } else if (preference?.preferFast) {
    sorted.sort((a, b) => a.speedTier - b.speedTier);
  } else {
    sorted.sort((a, b) => a.costTier - b.costTier);
  }

  console.log(`[ModelRouter] Selected ${sorted[0].name} (default)`);
  return sorted[0];
}

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

export function getAvailableModels(): string[] {
  return getModelRegistry().map(m => m.name);
}

export function getModel(provider: ModelProvider): ModelConfig | null {
  return getModelRegistry().find(m => m.provider === provider) || null;
}

export const selectModelForTask = selectModel;
