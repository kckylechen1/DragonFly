/**
 * LLM 提供商配置
 *
 * 自动检测和选择最佳 LLM 提供商
 * 参考 OpenClaw 的 model refs 设计
 */

import { ENV } from "../env";

// ==================== Provider 类型 ====================

export type LLMProvider = "openai" | "anthropic";

export interface ProviderConfig {
  id: string;
  name: string;
  provider: LLMProvider;
  apiUrl: string;
  apiKey: string;
  model: string;
  priority: number; // 优先级，数值越小优先级越高
  capabilities: {
    toolCalling: boolean;
    streaming: boolean;
    thinking: boolean;
    maxTokens: number;
  };
}

// ==================== 已配置的 Providers ====================

export function getAvailableProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  // Grok (xAI) - 主力模型，速度快，用于指挥和决策
  if (ENV.grokApiKey) {
    providers.push({
      id: "grok",
      name: "Grok 4.1",
      provider: "openai",
      apiUrl: ENV.grokApiUrl,
      apiKey: ENV.grokApiKey,
      model: ENV.grokModel,
      priority: 1, // 最高优先级
      capabilities: {
        toolCalling: true,
        streaming: true,
        thinking: false,
        maxTokens: 4096,
      },
    });
  }

  // GLM (智谱) - 备用模型，量大管饱，中文优化
  if (ENV.glmApiKey) {
    providers.push({
      id: "glm",
      name: "GLM-4.7",
      provider: "openai",
      apiUrl: ENV.glmApiUrl,
      apiKey: ENV.glmApiKey,
      model: ENV.glmModel,
      priority: 2, // 第二优先级
      capabilities: {
        toolCalling: true,
        streaming: true,
        thinking: false,
        maxTokens: 4096,
      },
    });
  }

  // TODO: Anthropic adapter 工具调用格式问题待修复，暂时禁用
  // Claude (Anthropic) - 需要专用适配器
  // if (ENV.anthropicApiKey) {
  //   providers.push({
  //     id: "claude",
  //     name: "Claude 3.5 Sonnet",
  //     provider: "anthropic",
  //     apiUrl: ENV.anthropicApiUrl,
  //     apiKey: ENV.anthropicApiKey,
  //     model: ENV.anthropicModel,
  //     priority: 3,
  //     capabilities: {
  //       toolCalling: true,
  //       streaming: true,
  //       thinking: true,
  //       maxTokens: 8192,
  //     },
  //   });
  // }

  return providers.sort((a, b) => a.priority - b.priority);
}

/**
 * 获取最佳可用 Provider
 */
export function getBestProvider(): ProviderConfig | null {
  const providers = getAvailableProviders();
  return providers[0] || null;
}

/**
 * 根据 ID 获取 Provider
 */
export function getProviderById(id: string): ProviderConfig | null {
  const providers = getAvailableProviders();
  return providers.find(p => p.id === id) || null;
}

/**
 * 打印 Provider 状态
 */
export function logProviderStatus(): void {
  const providers = getAvailableProviders();

  console.log("\n🤖 LLM Providers Status:");
  console.log("─".repeat(50));

  if (providers.length === 0) {
    console.log("  ❌ No providers configured");
    console.log("  Please set at least one API key in .env:");
    console.log("    - ANTHROPIC_API_KEY (Claude)");
    console.log("    - GROK_API_KEY (xAI Grok)");
    console.log("    - GLM_API_KEY (智谱 GLM)");
    return;
  }

  providers.forEach((p, i) => {
    const status = i === 0 ? "✅ Active" : "⏸️ Standby";
    const format = p.provider === "anthropic" ? "Claude 格式" : "OpenAI 格式";
    console.log(`  ${status} [${p.id}] ${p.name}`);
    console.log(`      Provider: ${format}`);
    console.log(`      Model: ${p.model}`);
  });

  console.log("─".repeat(50));
}
