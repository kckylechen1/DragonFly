/**
 * SmartAgent - 智能 Agent 入口
 *
 * 整合：
 * - SubAgent 系统
 * - Session 管理
 * - Memory 系统
 * - Skill 系统
 * - 意图识别与响应控制
 * - Provider 自动选择
 */

import { AgentOrchestrator, buildOrchestratorPrompt } from "./orchestrator";
import { AnalysisAgent } from "./agents/analysis-agent";
import {
  getSessionStore,
  type Session,
  type TodoItem,
  type TodoRunStatus,
} from "../session";
import { getMemoryStore } from "../memory";
import { getSkillRegistry, type Skill } from "../skills";
import type { StreamEvent, AgentMessage } from "./types";

// 新增：意图识别和 Provider 系统
import {
  checkResponseLimits,
  detectIntent,
  type IntentType,
  INTENT_CONFIGS,
} from "./intent";
import { buildPromptForIntent } from "./system-prompt";
import { getBestProvider } from "./providers";

export interface SmartAgentConfig {
  sessionId?: string;
  stockCode?: string;
  useOrchestrator?: boolean;
  verbose?: boolean;
  thinkHard?: boolean;
  preloadedContext?: string;
}

export type MarketType = "A" | "US" | "HK" | "unknown";

export class SmartAgent {
  private config: SmartAgentConfig;
  private session: Session;
  private orchestrator: AgentOrchestrator | null;
  private analysisAgent: AnalysisAgent | null;
  private currentIntent: IntentType = "quick";
  private currentMarket: MarketType = "unknown";

  constructor(config: SmartAgentConfig = {}) {
    this.config = {
      useOrchestrator: true,
      verbose: true,
      ...config,
    };

    // 检测并记录可用的 Provider
    const bestProvider = getBestProvider();
    if (bestProvider) {
      console.log(
        `[SmartAgent] Using provider: ${bestProvider.name} (${bestProvider.provider})`
      );
    } else {
      console.warn("[SmartAgent] No LLM provider configured!");
    }

    const sessionStore = getSessionStore();
    this.session = sessionStore.getOrCreateSession(
      config.sessionId,
      config.stockCode
    );

    if (typeof config.thinkHard === "boolean") {
      sessionStore.updateMetadata(this.session.id, {
        detailMode: config.thinkHard,
      });
    }

    this.orchestrator = config.useOrchestrator ? new AgentOrchestrator() : null;
    this.analysisAgent = config.useOrchestrator
      ? null
      : new AnalysisAgent(this.session.metadata.detailMode || false);
  }

  /**
   * 检测市场类型
   */
  private detectMarketType(message: string, stockCode?: string): MarketType {
    // 1. 优先检测明确的股票代码
    if (stockCode) {
      if (/^[036]\d{5}$/.test(stockCode)) return "A";
      if (/^\d{4,5}\.HK$/i.test(stockCode)) return "HK";
      if (/^[A-Z]{1,5}$/.test(stockCode)) return "US";
    }

    // 2. 从消息中检测
    // 美股
    if (
      /\b(AAPL|NVDA|TSLA|GOOGL|MSFT|AMZN|META|NFLX|AMD|INTC)\b/i.test(message)
    )
      return "US";
    if (/纳斯达克|纳指|标普|道琼斯|美股|nasdaq|nyse/i.test(message))
      return "US";

    // 港股
    if (/\d{4,5}\.HK/i.test(message)) return "HK";
    if (/港股|恒生|恒指/i.test(message)) return "HK";

    // A股
    if (/\b[036]\d{5}\b/.test(message)) return "A";
    if (/沪深|上证|深证|A股|创业板|科创板/i.test(message)) return "A";

    return "unknown";
  }

  /**
   * 获取市场类型对应的数据源标签
   */
  private getMarketLabel(): string {
    switch (this.currentMarket) {
      case "A":
        return "A股";
      case "US":
        return "美股";
      case "HK":
        return "港股";
      default:
        return "";
    }
  }

  /**
   * 同步执行
   */
  async chat(userMessage: string): Promise<{
    response: string;
    toolCalls: string[];
    iterations: number;
    intent: IntentType;
  }> {
    const sessionStore = getSessionStore();
    const memoryStore = getMemoryStore();
    const skillRegistry = getSkillRegistry();

    // 🆕 意图识别
    this.currentIntent = detectIntent(userMessage);
    const intentConfig = INTENT_CONFIGS[this.currentIntent];

    // 🆕 市场类型检测
    this.currentMarket = this.detectMarketType(
      userMessage,
      this.config.stockCode
    );
    if (this.currentMarket !== "unknown") {
      console.log(`[SmartAgent] Detected market: ${this.currentMarket}`);
    }
    console.log(
      `[SmartAgent] Detected intent: ${this.currentIntent} (max ${intentConfig.maxTools} tools, ${intentConfig.maxChars} chars)`
    );

    sessionStore.addMessage(this.session.id, {
      role: "user",
      content: userMessage,
    });

    // 🆕 Greeting 模式：直接返回，不查询数据
    if (this.currentIntent === "greeting") {
      const greetingResponse = this.generateGreetingResponse(userMessage);
      sessionStore.addMessage(this.session.id, {
        role: "assistant",
        content: greetingResponse,
      });
      return {
        response: greetingResponse,
        toolCalls: [],
        iterations: 0,
        intent: this.currentIntent,
      };
    }

    const memoryContext = memoryStore.generateContextInjection(
      userMessage,
      this.config.stockCode
    );

    const matchedSkill = skillRegistry.getBestMatch(userMessage);
    const skillContext = matchedSkill
      ? skillRegistry.generateSkillPrompt(matchedSkill.name)
      : "";

    const todoRun = sessionStore.startTodoRun(this.session.id, {
      userMessage,
      stockCode: this.config.stockCode,
      thinkHard: this.session.metadata.detailMode,
      initialTodos: this.buildInitialTodos(matchedSkill),
    });

    const enhancedMessage = this.buildEnhancedMessage(
      userMessage,
      memoryContext,
      skillContext,
      matchedSkill
    );

    const agent = this.orchestrator || this.analysisAgent!;

    this.applyIntentPrompt();
    this.applyIntentBudgets(intentConfig.maxTools);

    // 20秒超时控制，超时后降级到基础工具
    let response = await this.runWithTimeout(agent, enhancedMessage);
    response = this.applyResponseShaping(response, this.currentIntent);

    sessionStore.addMessage(this.session.id, {
      role: "assistant",
      content: response,
    });

    this.extractAndSaveMemories(userMessage, response);

    const toolCalls =
      typeof agent.getToolStats === "function"
        ? agent.getToolStats().map((t: any) => t.name)
        : [];
    const iterations =
      typeof agent.getThinking === "function" ? agent.getThinking().length : 1;

    // chat() 模式没有逐步事件：只把最终状态落盘
    sessionStore.finishTodoRun(this.session.id, todoRun.id, "completed");

    return {
      response,
      toolCalls,
      iterations,
      intent: this.currentIntent,
    };
  }

  /**
   * 🆕 生成问候回复（不调用工具）
   */
  private generateGreetingResponse(userMessage: string): string {
    const greetings = [
      "你好！有什么股票想聊？",
      "嗨！今天想分析什么？",
      "你好！随时准备帮你看股票。",
    ];

    // 如果上次讨论过某只股票，可以提及
    if (this.config.stockCode) {
      return `你好！还想继续聊 ${this.config.stockCode} 吗？或者换一只？`;
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * 流式执行
   */
  async *stream(userMessage: string): AsyncGenerator<StreamEvent> {
    const sessionStore = getSessionStore();
    const memoryStore = getMemoryStore();
    const skillRegistry = getSkillRegistry();

    // 🆕 意图识别
    this.currentIntent = detectIntent(userMessage);
    const intentConfig = INTENT_CONFIGS[this.currentIntent];
    console.log(
      `[SmartAgent] Detected intent: ${this.currentIntent} (max ${intentConfig.maxTools} tools, ${intentConfig.maxChars} chars)`
    );

    // 🆕 市场类型检测
    this.currentMarket = this.detectMarketType(
      userMessage,
      this.config.stockCode
    );
    if (this.currentMarket !== "unknown") {
      console.log(`[SmartAgent] Detected market: ${this.currentMarket}`);
    }

    sessionStore.addMessage(this.session.id, {
      role: "user",
      content: userMessage,
    });

    if (this.currentIntent === "greeting") {
      const greetingResponse = this.generateGreetingResponse(userMessage);
      sessionStore.addMessage(this.session.id, {
        role: "assistant",
        content: greetingResponse,
      });
      yield { type: "content", data: greetingResponse };
      yield { type: "done", data: { iterations: 0 } };
      return;
    }

    const memoryContext = memoryStore.generateContextInjection(
      userMessage,
      this.config.stockCode
    );

    const matchedSkill = skillRegistry.getBestMatch(userMessage);
    const skillContext = matchedSkill
      ? skillRegistry.generateSkillPrompt(matchedSkill.name)
      : "";

    const todoRun = sessionStore.startTodoRun(this.session.id, {
      userMessage,
      stockCode: this.config.stockCode,
      thinkHard: this.session.metadata.detailMode,
      initialTodos: this.buildInitialTodos(matchedSkill),
    });
    const finalTodoId = todoRun.todos.find(t => !t.toolName)?.id;

    if (matchedSkill) {
      yield {
        type: "thinking",
        data: `匹配技能: ${matchedSkill.name}`,
      };
    }

    if (memoryContext) {
      yield {
        type: "thinking",
        data: "注入相关记忆...",
      };
    }

    const enhancedMessage = this.buildEnhancedMessage(
      userMessage,
      memoryContext,
      skillContext,
      matchedSkill
    );

    const agent = this.orchestrator || this.analysisAgent!;
    this.applyIntentPrompt();
    this.applyIntentBudgets(intentConfig.maxTools);
    let fullResponse = "";
    let runStatus: TodoRunStatus = "completed";

    // 简化实现：暂时不实现流式超时，后续优化
    for await (const event of agent.stream(enhancedMessage)) {
      if (event.type === "tool_call") {
        const toolCallId = event.data?.toolCallId || event.data?.id;
        const toolName = event.data?.name;
        const toolArgs = this.safeParseArgs(event.data?.args);

        if (toolCallId && toolName) {
          sessionStore.upsertTodoForToolCall(this.session.id, todoRun.id, {
            toolCallId,
            toolName,
            toolArgs,
            status: "in_progress",
            title: `调用工具: ${toolName}`,
          });
        }
      }

      if (event.type === "tool_result") {
        const toolCallId = event.data?.toolCallId || event.data?.id;
        const toolName = event.data?.name;
        const ok = Boolean(event.data?.ok);
        const skipped = Boolean(event.data?.skipped);
        const result =
          typeof event.data?.result === "string" ? event.data.result : "";
        const error =
          typeof event.data?.error === "string" ? event.data.error : undefined;

        if (toolCallId && toolName) {
          const todo = sessionStore.upsertTodoForToolCall(
            this.session.id,
            todoRun.id,
            {
              toolCallId,
              toolName,
              status: skipped ? "skipped" : ok ? "completed" : "failed",
              title: `调用工具: ${toolName}`,
            }
          );
          sessionStore.updateTodo(this.session.id, todoRun.id, todo.id, {
            resultPreview: result.slice(0, 200),
            error: ok || skipped ? undefined : error || "Tool failed",
          });
        }
      }

      if (event.type === "content") {
        fullResponse = this.applyResponseShaping(
          event.data,
          this.currentIntent
        );
        if (finalTodoId) {
          sessionStore.updateTodo(this.session.id, todoRun.id, finalTodoId, {
            status: "in_progress",
          });
        }
        yield { ...event, data: fullResponse };
        continue;
      }

      if (event.type === "error") {
        runStatus = "failed";
      }

      yield event;
    }

    sessionStore.addMessage(this.session.id, {
      role: "assistant",
      content: fullResponse,
    });

    if (finalTodoId) {
      sessionStore.updateTodo(this.session.id, todoRun.id, finalTodoId, {
        status: runStatus === "completed" ? "completed" : "failed",
      });
    }
    sessionStore.finishTodoRun(this.session.id, todoRun.id, runStatus);

    this.extractAndSaveMemories(userMessage, fullResponse);
  }

  /**
   * 带超时的执行，20秒超时后降级到基础工具
   */
  private async runWithTimeout(
    agent: any,
    enhancedMessage: string
  ): Promise<string> {
    const TIMEOUT_MS = this.session.metadata.detailMode ? 45000 : 20000; // 详细模式允许更久

    try {
      // 创建超时 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS);
      });

      // 执行 agent 的 Promise
      const agentPromise = agent.run(enhancedMessage);

      // 竞态执行，哪个先完成用哪个
      const response = await Promise.race([agentPromise, timeoutPromise]);

      return response;
    } catch (error) {
      if (error instanceof Error && error.message === "TIMEOUT") {
        console.warn(
          "Agent execution timed out after 20 seconds, falling back to basic tools"
        );

        // 降级到基础工具分析
        return await this.fallbackToBasicTools(enhancedMessage);
      }

      // 其他错误直接抛出
      throw error;
    }
  }

  /**
   * 基础工具降级策略
   */
  private async fallbackToBasicTools(userMessage: string): Promise<string> {
    try {
      // 导入工具执行器
      const { executeStockTool } = await import("../stockTools");

      let response = "⚠️ 响应超时，已降级到基础工具分析：\n\n";

      // 提取股票代码（简单正则匹配）
      const stockCodeMatch = userMessage.match(/(\d{6}|\w{2,}\.\w{2,})/);
      if (!stockCodeMatch) {
        return response + "未检测到有效的股票代码，请重新提问。";
      }

      const stockCode = stockCodeMatch[1];

      // 获取基本报价
      const quoteResult = await executeStockTool("get_stock_quote", {
        code: stockCode,
      });
      if (quoteResult && !quoteResult.includes("无法获取")) {
        response += quoteResult + "\n\n";
      }

      // 简单的技术分析
      const technicalResult = await executeStockTool(
        "analyze_stock_technical",
        {
          code: stockCode,
          period: "day",
        }
      );
      if (technicalResult && !technicalResult.includes("失败")) {
        response += technicalResult + "\n\n";
      }

      response += `💡 建议：如需更详细分析，请稍后重试或简化问题。`;

      return response;
    } catch (fallbackError) {
      console.error("Fallback analysis failed:", fallbackError);
      return "❌ 分析服务暂时不可用，请稍后重试。";
    }
  }

  /**
   * 构建增强消息
   */
  private buildEnhancedMessage(
    userMessage: string,
    memoryContext: string,
    skillContext: string,
    matchedSkill: Skill | null
  ): string {
    const parts: string[] = [];

    if (this.config.stockCode) {
      parts.push(`【当前股票】${this.config.stockCode}`);
    }

    if (this.config.preloadedContext) {
      parts.push(this.config.preloadedContext);
    }

    if (memoryContext) {
      parts.push(memoryContext);
    }

    if (skillContext && matchedSkill) {
      parts.push(`【激活技能】${matchedSkill.name}`);
      parts.push(skillContext);
    }

    parts.push(`【用户问题】${userMessage}`);

    return parts.join("\n\n");
  }

  private applyIntentPrompt(): void {
    const intentPrompt = buildPromptForIntent(this.currentIntent);

    if (this.analysisAgent) {
      this.analysisAgent.updateSystemPrompt(intentPrompt);
      return;
    }

    if (this.orchestrator) {
      this.orchestrator.updateSystemPrompt(
        buildOrchestratorPrompt(intentPrompt)
      );
    }
  }

  private applyIntentBudgets(maxTools: number): void {
    if (this.analysisAgent) {
      this.analysisAgent.setToolBudgetLimit(maxTools);
      return;
    }

    if (this.orchestrator) {
      this.orchestrator.setToolBudgetLimit(maxTools);
    }
  }

  private applyResponseShaping(content: string, intent: IntentType): string {
    const maxChars = INTENT_CONFIGS[intent].maxChars;
    let trimmed = content;

    if (trimmed.length > maxChars) {
      trimmed = trimmed.slice(0, maxChars - 1).trimEnd() + "…";
    }

    const toolCount =
      this.analysisAgent?.getToolUsageCount() ??
      this.orchestrator?.getToolUsageCount() ??
      0;
    const { withinLimits, issues } = checkResponseLimits({
      intent,
      content: trimmed,
      hasToolCalls: toolCount > 0,
      toolCount,
    });

    if (!withinLimits) {
      console.warn(`[SmartAgent] Response limits: ${issues.join("; ")}`);
    }

    return trimmed;
  }

  /**
   * 提取并保存记忆
   */
  private extractAndSaveMemories(userMessage: string, response: string): void {
    const memoryStore = getMemoryStore();

    const lessonPatterns = [
      /教训[：:]\s*(.+)/,
      /记住[：:]\s*(.+)/,
      /以后[：:]\s*(.+)/,
      /下次[：:]\s*(.+)/,
    ];

    for (const pattern of lessonPatterns) {
      const match = userMessage.match(pattern) || response.match(pattern);
      if (match) {
        memoryStore.addLesson(
          match[1],
          this.extractKeywords(match[1]),
          this.config.stockCode
        );
      }
    }

    if (
      this.config.stockCode &&
      (response.includes("买入") || response.includes("卖出"))
    ) {
      memoryStore.setShortTerm(
        this.session.id,
        "last_advice",
        response.slice(0, 200)
      );
    }
  }

  private buildInitialTodos(
    matchedSkill: Skill | null
  ): Array<
    Pick<TodoItem, "title"> &
      Partial<Omit<TodoItem, "id" | "createdAt" | "updatedAt">>
  > {
    const stockCode = this.config.stockCode;
    const detailMode = Boolean(this.session.metadata.detailMode);

    if (!stockCode) {
      return [{ title: "理解问题并给出回答" }];
    }

    // 🆕 根据市场类型选择不同的工具集
    const getMarketTools = (
      market: MarketType,
      isDetailMode: boolean
    ): string[] => {
      switch (market) {
        case "US":
          // 美股工具集
          return isDetailMode
            ? ["get_us_stock_quote", "get_us_kline", "get_us_market_status"]
            : ["get_us_stock_quote", "get_us_market_status"];
        case "HK":
          // 港股工具集
          return isDetailMode
            ? ["get_hk_stock_quote", "get_hk_kline", "get_hk_market_status"]
            : ["get_hk_stock_quote", "get_hk_market_status"];
        case "A":
        default:
          // A股工具集（原有的）
          return isDetailMode
            ? [
                "comprehensive_analysis",
                "get_guba_hot_rank",
                "get_trading_memory",
              ]
            : [
                "get_stock_quote",
                "analyze_stock_technical",
                "get_fund_flow",
                "get_market_status",
              ];
      }
    };

    const toolPlan =
      matchedSkill?.tools && matchedSkill.tools.length > 0
        ? matchedSkill.tools
        : getMarketTools(this.currentMarket, detailMode);

    const todos: Array<
      Pick<TodoItem, "title"> &
        Partial<Omit<TodoItem, "id" | "createdAt" | "updatedAt">>
    > = toolPlan.map(toolName => {
      // 🆕 根据工具类型设置正确的参数名
      let toolArgs: Record<string, any> = {};
      if (
        toolName === "get_market_status" ||
        toolName === "get_us_market_status" ||
        toolName === "get_hk_market_status"
      ) {
        toolArgs = {};
      } else if (toolName === "search_stock") {
        toolArgs = { keyword: stockCode };
      } else if (
        toolName.startsWith("get_us_") ||
        toolName.startsWith("get_hk_")
      ) {
        // 美股/港股工具使用 symbol 参数
        toolArgs = { symbol: stockCode };
      } else {
        // A股工具使用 code 参数
        toolArgs = { code: stockCode };
      }

      return {
        title: `计划工具: ${toolName}`,
        toolName,
        toolArgs,
      };
    });

    todos.push({ title: "生成结论与操作建议" });
    return todos;
  }

  private safeParseArgs(args: unknown): Record<string, any> | undefined {
    if (!args) return undefined;
    if (typeof args === "object") return args as Record<string, any>;
    if (typeof args !== "string") return undefined;
    try {
      return JSON.parse(args) as Record<string, any>;
    } catch {
      return undefined;
    }
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    const words = text
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 1);

    return Array.from(new Set(words)).slice(0, 10);
  }

  /**
   * 获取会话 ID
   */
  getSessionId(): string {
    return this.session.id;
  }

  /**
   * 获取会话历史
   */
  getHistory(): AgentMessage[] {
    return getSessionStore().getMessages(this.session.id);
  }

  /**
   * 导出会话
   */
  exportSession(): string {
    return getSessionStore().exportToMarkdown(this.session.id);
  }

  /**
   * 添加记忆
   */
  addMemory(type: "fact" | "lesson" | "insight", content: string): void {
    const memoryStore = getMemoryStore();
    const keywords = this.extractKeywords(content);

    switch (type) {
      case "fact":
        memoryStore.addFact(content, keywords, this.config.stockCode);
        break;
      case "lesson":
        memoryStore.addLesson(content, keywords, this.config.stockCode);
        break;
      case "insight":
        memoryStore.addInsight(content, keywords);
        break;
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.orchestrator) {
      this.orchestrator.reset();
    }
    if (this.analysisAgent) {
      this.analysisAgent.reset();
    }
  }
}

/**
 * 快速创建 SmartAgent
 */
export function createSmartAgent(config: SmartAgentConfig = {}): SmartAgent {
  return new SmartAgent(config);
}
