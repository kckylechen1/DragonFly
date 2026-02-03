/**
 * Anthropic API 适配器
 * 
 * 支持 Claude 原生格式的 Tool Call
 * 与 OpenAI 格式的主要区别：
 * - 使用 content blocks (text, tool_use, tool_result)
 * - 原生支持 thinking 模式
 * - 流式更友好
 */

import type {
    ToolDefinition,
    LLMResponse,
    ToolCall,
    AgentMessage,
} from "./types";

// ==================== Anthropic 类型定义 ====================

export type AnthropicRole = "user" | "assistant";

export interface AnthropicTextBlock {
    type: "text";
    text: string;
}

export interface AnthropicToolUseBlock {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, any>;
}

export interface AnthropicToolResultBlock {
    type: "tool_result";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export interface AnthropicThinkingBlock {
    type: "thinking";
    thinking: string;
}

export type AnthropicContentBlock =
    | AnthropicTextBlock
    | AnthropicToolUseBlock
    | AnthropicToolResultBlock
    | AnthropicThinkingBlock;

export interface AnthropicMessage {
    role: AnthropicRole;
    content: string | AnthropicContentBlock[];
}

export interface AnthropicToolDefinition {
    name: string;
    description: string;
    input_schema: {
        type: "object";
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface AnthropicResponse {
    id: string;
    type: "message";
    role: "assistant";
    content: AnthropicContentBlock[];
    model: string;
    stop_reason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
    stop_sequence?: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

// ==================== 格式转换器 ====================

function safeJsonParse<T>(input: unknown, fallback: T): T {
    if (typeof input !== "string") {
        return fallback;
    }

    try {
        return JSON.parse(input) as T;
    } catch {
        return fallback;
    }
}

/**
 * OpenAI Tool 定义 → Anthropic Tool 定义
 */
export function convertToolToAnthropic(
    tool: ToolDefinition
): AnthropicToolDefinition {
    return {
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters,
    };
}

/**
 * OpenAI 消息 → Anthropic 消息
 */
export function convertMessagesToAnthropic(
    messages: AgentMessage[]
): { system: string; messages: AnthropicMessage[] } {
    let system = "";
    const anthropicMessages: AnthropicMessage[] = [];

    for (const msg of messages) {
        switch (msg.role) {
            case "system":
                system = msg.content;
                break;

            case "user":
                anthropicMessages.push({
                    role: "user",
                    content: msg.content,
                });
                break;

            case "assistant":
                if (msg.tool_calls && msg.tool_calls.length > 0) {
                    // Assistant with tool calls
                    const blocks: AnthropicContentBlock[] = [];
                    if (msg.content) {
                        blocks.push({ type: "text", text: msg.content });
                    }
                    for (const tc of msg.tool_calls) {
                        blocks.push({
                            type: "tool_use",
                            id: tc.id,
                            name: tc.function.name,
                            input: safeJsonParse(tc.function.arguments, {}),
                        });
                    }
                    anthropicMessages.push({ role: "assistant", content: blocks });
                } else {
                    anthropicMessages.push({
                        role: "assistant",
                        content: msg.content,
                    });
                }
                break;

            case "tool":
                // Tool results need to be added to the last user message
                // or create a new user message with tool_result
                const toolResultBlock: AnthropicToolResultBlock = {
                    type: "tool_result",
                    tool_use_id: msg.tool_call_id!,
                    content: msg.content,
                };

                // Check if last message is user with tool results
                const lastMsg = anthropicMessages[anthropicMessages.length - 1];
                if (lastMsg?.role === "user" && Array.isArray(lastMsg.content)) {
                    (lastMsg.content as AnthropicContentBlock[]).push(toolResultBlock);
                } else {
                    anthropicMessages.push({
                        role: "user",
                        content: [toolResultBlock],
                    });
                }
                break;
        }
    }

    return { system, messages: anthropicMessages };
}

/**
 * Anthropic 响应 → OpenAI 格式 LLMResponse
 */
export function convertAnthropicResponse(
    response: AnthropicResponse
): LLMResponse {
    let content = "";
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
        switch (block.type) {
            case "text":
                content += block.text;
                break;

            case "tool_use":
                toolCalls.push({
                    id: block.id,
                    type: "function",
                    function: {
                        name: block.name,
                        arguments: JSON.stringify(block.input ?? {}),
                    },
                });
                break;

            case "thinking":
                // 可选：记录思考过程
                console.log(`[Claude Thinking] ${block.thinking.slice(0, 100)}...`);
                break;
        }
    }

    const finishReason =
        response.stop_reason === "tool_use"
            ? "tool_calls"
            : response.stop_reason === "end_turn"
                ? "stop"
                : response.stop_reason;

    return {
        content,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        finish_reason: finishReason,
        usage: {
            prompt_tokens: response.usage.input_tokens,
            completion_tokens: response.usage.output_tokens,
            total_tokens:
                response.usage.input_tokens + response.usage.output_tokens,
        },
    };
}

// ==================== Anthropic API 客户端 ====================

export interface AnthropicClientConfig {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    enableThinking?: boolean; // Claude 3.5+ thinking 模式
}

export class AnthropicClient {
    private config: Required<AnthropicClientConfig>;

    constructor(config: AnthropicClientConfig) {
        this.config = {
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || "https://api.anthropic.com",
            model: config.model || "claude-3-5-sonnet-20241022",
            maxTokens: config.maxTokens || 8192,
            temperature: config.temperature || 0.7,
            enableThinking: config.enableThinking || false,
        };
    }

    /**
     * 调用 Anthropic API
     */
    async chat(
        messages: AgentMessage[],
        tools: ToolDefinition[] = [],
        options: Partial<AnthropicClientConfig> = {}
    ): Promise<LLMResponse> {
        const { system, messages: anthropicMessages } =
            convertMessagesToAnthropic(messages);

        const anthropicTools = tools.map(convertToolToAnthropic);

        const payload: any = {
            model: options.model || this.config.model,
            max_tokens: options.maxTokens || this.config.maxTokens,
            temperature: options.temperature || this.config.temperature,
            messages: anthropicMessages,
        };

        if (system) {
            payload.system = system;
        }

        if (anthropicTools.length > 0) {
            payload.tools = anthropicTools;
        }

        // Claude 3.5+ Thinking 模式
        if (this.config.enableThinking) {
            payload.metadata = {
                thinking: { enabled: true },
            };
        }

        const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.config.apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API Error: ${response.status} - ${error}`);
        }

        const data: AnthropicResponse = await response.json();
        return convertAnthropicResponse(data);
    }

    /**
     * 流式调用 (返回 AsyncGenerator)
     */
    async *streamChat(
        messages: AgentMessage[],
        tools: ToolDefinition[] = [],
        options: Partial<AnthropicClientConfig> = {}
    ): AsyncGenerator<{
        type: "text" | "tool_use" | "thinking" | "done";
        data: any;
    }> {
        const { system, messages: anthropicMessages } =
            convertMessagesToAnthropic(messages);

        const anthropicTools = tools.map(convertToolToAnthropic);

        const payload: any = {
            model: options.model || this.config.model,
            max_tokens: options.maxTokens || this.config.maxTokens,
            temperature: options.temperature || this.config.temperature,
            messages: anthropicMessages,
            stream: true,
        };

        if (system) {
            payload.system = system;
        }

        if (anthropicTools.length > 0) {
            payload.tools = anthropicTools;
        }

        const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.config.apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API Error: ${response.status} - ${error}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentToolUse: any = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6);
                if (data === "[DONE]") {
                    yield { type: "done", data: null };
                    return;
                }

                try {
                    const event = JSON.parse(data);

                    if (event.type === "content_block_start") {
                        if (event.content_block.type === "tool_use") {
                            currentToolUse = {
                                id: event.content_block.id,
                                name: event.content_block.name,
                                input: "",
                            };
                        }
                    } else if (event.type === "content_block_delta") {
                        if (event.delta.type === "text_delta") {
                            yield { type: "text", data: event.delta.text };
                        } else if (event.delta.type === "input_json_delta") {
                            if (currentToolUse) {
                                currentToolUse.input += event.delta.partial_json;
                            }
                        } else if (event.delta.type === "thinking_delta") {
                            yield { type: "thinking", data: event.delta.thinking };
                        }
                    } else if (event.type === "content_block_stop") {
                        if (currentToolUse) {
                            yield {
                                type: "tool_use",
                                data: {
                                    id: currentToolUse.id,
                                    name: currentToolUse.name,
                                    input: safeJsonParse(currentToolUse.input, {}),
                                },
                            };
                            currentToolUse = null;
                        }
                    } else if (event.type === "message_stop") {
                        yield { type: "done", data: null };
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        }
    }
}

// ==================== 工厂函数 ====================

/**
 * 创建 Anthropic 客户端
 * 优先使用环境变量配置
 */
export function createAnthropicClient(
    config: Partial<AnthropicClientConfig> = {}
): AnthropicClient {
    // 可以添加 ANTHROPIC_API_KEY 到 env.ts
    const apiKey =
        config.apiKey || process.env.ANTHROPIC_API_KEY || "";

    if (!apiKey) {
        throw new Error(
            "Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env"
        );
    }

    return new AnthropicClient({
        apiKey,
        ...config,
    });
}

// ==================== LLM 提供商类型 ====================

export type LLMProvider = "openai" | "anthropic";

/**
 * 根据提供商类型选择 API 调用方式
 */
export async function callLLMWithProvider(
    provider: LLMProvider,
    messages: AgentMessage[],
    tools: ToolDefinition[],
    options: {
        apiKey: string;
        baseUrl: string;
        model: string;
        maxTokens?: number;
        temperature?: number;
    }
): Promise<LLMResponse> {
    if (provider === "anthropic") {
        const client = new AnthropicClient({
            apiKey: options.apiKey,
            baseUrl: options.baseUrl,
            model: options.model,
            maxTokens: options.maxTokens,
            temperature: options.temperature,
        });
        return client.chat(messages, tools);
    }

    // OpenAI 兼容格式
    const normalizedUrl = options.baseUrl.replace(/\/$/, "");
    const endpoint = normalizedUrl.endsWith("/chat/completions")
        ? normalizedUrl
        : `${normalizedUrl}/chat/completions`;

    const payload: any = {
        model: options.model,
        messages: messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
    };

    if (tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = "auto";
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    return {
        content: message?.content || "",
        tool_calls: message?.tool_calls,
        finish_reason: data.choices?.[0]?.finish_reason,
        usage: data.usage,
    };
}
