/**
 * Grok + GLM 主从架构 Agent
 *
 * Grok (思考者): 分析问题、制定策略、生成报告
 * GLM (执行者): 调用工具获取数据
 *
 * 工作流程:
 * 1. 用户提问 → Grok 分析需要什么数据
 * 2. Grok 调用 delegate_to_glm → GLM 执行工具获取数据
 * 3. Grok 基于数据生成分析报告
 */

import { ENV } from "../env";
import { stockTools, executeStockTool } from "../stockTools";
import { buildGrokSystemPrompt } from "../prompts/grokPrompt";
import {
  buildGLMExecutorPrompt,
  buildGLMTaskMessage,
} from "../prompts/glmPrompt";

// ==================== 类型定义 ====================

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface StreamEvent {
  type: "thinking" | "tool_call" | "tool_result" | "content" | "done" | "error";
  data: any;
}

interface DelegateToGLMArgs {
  task: string;
  stockCode?: string;
  suggestedTools?: string[];
}

// ==================== Grok 可用的工具定义 ====================

const grokDelegateTools = [
  {
    type: "function" as const,
    function: {
      name: "delegate_to_glm",
      description: `让 GLM（你的数据助手）去执行工具调用获取股票数据。

GLM 可以调用的工具：
- search_stock: 搜索股票代码（用户提到股票名称时必须先用这个）
- comprehensive_analysis: 综合分析（技术面+资金面+大盘，推荐）
- get_stock_quote: 实时行情
- get_fund_flow: 资金流向
- get_kline_data: K线数据
- analyze_minute_patterns: 分钟级形态
- get_guba_hot_rank: 股吧热度
- get_market_status: 大盘状态

使用示例：
- 分析某只股票 → task: "获取XXX的综合分析数据"
- 查找股票代码 → task: "搜索工业富联的股票代码"`,
      parameters: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description:
              "分配给 GLM 的任务描述，例如：'获取300308的综合分析数据' 或 '搜索工业富联的股票代码'",
          },
          stockCode: {
            type: "string",
            description: "股票代码（如果已知），例如 '300308'",
          },
          suggestedTools: {
            type: "array",
            items: { type: "string" },
            description: "建议 GLM 使用的工具列表",
          },
        },
        required: ["task"],
      },
    },
  },
];

// ==================== GLM 执行任务 ====================

async function executeGLMTask(
  args: DelegateToGLMArgs,
  onEvent: (event: StreamEvent) => void
): Promise<string> {
  console.log(`\n[GLM] 收到任务: ${args.task}`);
  if (args.stockCode) {
    console.log(`[GLM] 股票代码: ${args.stockCode}`);
  }

  const systemPrompt = buildGLMExecutorPrompt();
  const userMessage = buildGLMTaskMessage(args.task, args.stockCode);

  // 调用 GLM API
  const response = await fetch(`${ENV.glmApiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.glmApiKey}`,
    },
    body: JSON.stringify({
      model: ENV.glmModel || "glm-4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      tools: stockTools,
      tool_choice: "auto",
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GLM API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;

  // 如果 GLM 调用了工具
  if (message?.tool_calls && message.tool_calls.length > 0) {
    console.log(`[GLM] 决定调用 ${message.tool_calls.length} 个工具`);

    const results: string[] = [];

    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name;
      let toolArgs: Record<string, any>;

      try {
        toolArgs = JSON.parse(toolCall.function.arguments);
      } catch {
        toolArgs = {};
      }

      console.log(`[GLM] 执行工具: ${toolName}(${JSON.stringify(toolArgs)})`);

      // 发送工具调用事件
      onEvent({
        type: "tool_call",
        data: { name: toolName, args: toolArgs, status: "running" },
      });

      const startTime = Date.now();

      try {
        const result = await executeStockTool(toolName, toolArgs);
        const duration = Date.now() - startTime;

        // 发送工具结果事件
        onEvent({
          type: "tool_result",
          data: {
            name: toolName,
            status: "success",
            duration,
            preview:
              typeof result === "string"
                ? result.slice(0, 100)
                : JSON.stringify(result).slice(0, 100),
          },
        });

        results.push(`【${toolName} 结果】\n${result}`);
      } catch (error: any) {
        const duration = Date.now() - startTime;

        onEvent({
          type: "tool_result",
          data: {
            name: toolName,
            status: "error",
            duration,
            error: error.message,
          },
        });

        results.push(`【${toolName} 错误】${error.message}`);
      }
    }

    return results.join("\n\n");
  }

  // 没有工具调用，返回 GLM 的直接回答
  return message?.content || "GLM 无返回";
}

// ==================== Grok 主循环 ====================

export async function* streamGrokGLMAgent(
  userMessage: string,
  options: {
    stockCode?: string;
    preloadedContext?: string;
    thinkHard?: boolean;
  } = {}
): AsyncGenerator<StreamEvent> {
  console.log("\n" + "=".repeat(60));
  console.log("🧠 Grok+GLM Agent 启动");
  console.log("=".repeat(60));

  yield { type: "thinking", data: "正在分析问题..." };

  const systemPrompt = buildGrokSystemPrompt({
    stockCode: options.stockCode,
    preloadedData: options.preloadedContext,
  });

  // 构建用户消息
  let enhancedUserMessage = userMessage;
  if (options.stockCode && !userMessage.includes(options.stockCode)) {
    enhancedUserMessage += ` [当前股票: ${options.stockCode}]`;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: enhancedUserMessage },
  ];

  let iteration = 0;
  const maxIterations = 5;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n[Grok] 第 ${iteration} 轮对话...`);

    // 调用 Grok API
    const response = await fetch(`${ENV.grokApiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.grokApiKey}`,
      },
      body: JSON.stringify({
        model: ENV.grokModel,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          ...(m.tool_calls && { tool_calls: m.tool_calls }),
          ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
        })),
        tools: grokDelegateTools,
        tool_choice: "auto",
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: "error", data: `Grok API Error: ${error}` };
      return;
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;

    if (!assistantMessage) {
      yield { type: "error", data: "Grok 无响应" };
      return;
    }

    // Grok 调用了工具
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`[Grok] 决定调用工具...`);

      // 添加 assistant 消息（带 tool_calls）
      messages.push({
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls,
      });

      // 执行每个工具调用
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs: DelegateToGLMArgs;

        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = { task: "获取数据" };
        }

        console.log(`[Grok] 命令: ${toolName}(${JSON.stringify(toolArgs)})`);

        let result: string;

        if (toolName === "delegate_to_glm") {
          yield {
            type: "thinking",
            data: `正在获取数据: ${toolArgs.task}`,
          };

          // 收集 GLM 执行过程中的事件
          const events: StreamEvent[] = [];
          result = await executeGLMTask(toolArgs, event => events.push(event));

          // 发送所有收集的事件
          for (const event of events) {
            yield event;
          }
        } else {
          result = `未知工具: ${toolName}`;
        }

        // 添加工具结果
        messages.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        });
      }

      // 继续循环，让 Grok 处理工具结果
      continue;
    }

    // Grok 给出了最终回答，流式输出
    console.log(`[Grok] 输出最终回答`);

    // 重新请求，开启流式
    const streamResponse = await fetch(`${ENV.grokApiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.grokApiKey}`,
      },
      body: JSON.stringify({
        model: ENV.grokModel,
        messages,
        stream: true,
        max_tokens: 4000,
      }),
    });

    const reader = streamResponse.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      yield { type: "content", data: assistantMessage.content || "" };
      yield { type: "done", data: null };
      return;
    }

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield { type: "content", data: content };
            }
          } catch {
            // Ignore
          }
        }
      }
    }

    yield { type: "done", data: null };
    return;
  }

  yield { type: "error", data: "达到最大迭代次数" };
}

// ==================== 非流式版本（用于测试）====================

export async function chatGrokGLM(
  userMessage: string,
  options: {
    stockCode?: string;
    preloadedContext?: string;
  } = {}
): Promise<string> {
  let result = "";

  for await (const event of streamGrokGLMAgent(userMessage, options)) {
    if (event.type === "content") {
      result += event.data;
    } else if (event.type === "error") {
      throw new Error(event.data);
    }
  }

  return result;
}
