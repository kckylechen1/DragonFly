# 🔵 GLM 过夜任务指南: AI 前端集成 + Orchestrator 增强 + 6步框架骨架

> **负责 Agent**: GLM-4.7  
> **预计时间**: 5-6 小时  
> **执行模式**: 无人值守过夜执行

---

## ⚠️ 最重要的规则

```
1. 按 AI-COLLAB-PLAYBOOK 工作
2. 遇到问题立即停下，记录在本文件末尾，不要猜测
3. 每完成一个任务运行 pnpm check 验证
4. 使用 context7 MCP 查询库文档（如 React、Zustand 等）
5. 不要修改 Codex 负责的文件
```

---

## 📁 文件所有权声明

### ✅ 本任务拥有 (可修改)

- `client/src/refactor_v2/components/FloatingAIChatInput.tsx`
- `client/src/refactor_v2/components/AIChatPanel.tsx`
- `client/src/refactor_v2/stores/aiChat.store.ts`
- `server/_core/agent/orchestrator.ts`
- `server/_core/analysis/stock-analysis-framework.ts` (新建)
- `server/_core/analysis/index.ts` (新建)

### 🔒 只读参考 (不要修改)

- `client/src/refactor_v2/api/ai.ts`
- `client/src/refactor_v2/api/client.ts`
- `shared/types/stream.ts` (Codex 创建)

### 🚫 禁止触碰 (Codex 负责)

- `client/src/refactor_v2/api/useAIStream.ts`
- `client/src/refactor_v2/api/index.ts`
- `server/routers/ai.ts`
- `server/_core/model-router.ts`
- `server/_core/llm.ts`
- `server/_core/memory/simplemem.types.ts`
- `server/_core/memory/analysis-memory-manager.ts`

---

## 📋 任务清单 (按顺序执行)

### GLM-001: FloatingAIChatInput 连接真实 API [Phase 1] ⏱️ 1h

**目标**: 移除 mock，支持非流式 API 调用（流式由 Codex 负责）

**Step 1: 理解现状**

读取当前文件:

```bash
cat client/src/refactor_v2/components/FloatingAIChatInput.tsx
```

找到 mock 代码（类似 setTimeout 模拟响应）并移除。

**Step 2: 导入 API Hook**

在文件顶部添加:

```typescript
import { useSendMessage } from "@/refactor_v2/api";
```

**Step 3: 在组件内使用 Hook**

```typescript
const sendMessageMutation = useSendMessage();
```

**Step 4: 修改 handleSend 函数**

```typescript
const handleSend = async () => {
  if (!input.trim()) return;
  if (sendMessageMutation.isPending) return; // 防止重复发送

  const userMessage = input;
  setInput(""); // 立即清空输入框

  // 1. 添加用户消息到 store
  addMessage({
    role: "user",
    content: userMessage,
  });

  // 2. 设置加载状态
  setLoading(true);
  setError(null);

  // 3. 打开面板
  open();

  try {
    // 4. 调用真实 API
    const result = await sendMessageMutation.mutateAsync({
      messages: [{ role: "user", content: userMessage }],
      stockCode: selectedStock?.code, // 如果有选中的股票
    });

    // 5. 添加 AI 响应
    addMessage({
      role: "assistant",
      content: result.content || "抱歉，暂时无法获取回复。",
    });
  } catch (error) {
    console.error("AI 请求失败:", error);
    setError("请求失败，请稍后重试");
    addMessage({
      role: "assistant",
      content: "❌ 请求失败，请稍后重试。",
    });
  } finally {
    setLoading(false);
  }
};
```

**Step 5: 验证**

```bash
pnpm check
```

---

### GLM-002: AIChatPanel 加载状态和错误处理 [Phase 1] ⏱️ 1h

**目标**: 在 Store 和 Panel 中添加加载/错误状态显示

**Step 1: 修改 aiChat.store.ts**

读取现有 store:

```bash
cat client/src/refactor_v2/stores/aiChat.store.ts
```

添加新状态和方法:

```typescript
interface AIChatStore {
  // 现有字段
  messages: Message[];
  isOpen: boolean;

  // 新增字段
  isLoading: boolean;
  error: string | null;

  // 现有方法
  addMessage: (msg: Omit<Message, "id">) => void;
  clearMessages: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;

  // 新增方法
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAIChatStore = create<AIChatStore>(set => ({
  // 现有状态
  messages: [],
  isOpen: false,

  // 新增状态
  isLoading: false,
  error: null,

  // 现有方法保持不变
  addMessage: msg =>
    set(state => ({
      messages: [...state.messages, { ...msg, id: `msg_${Date.now()}` }],
    })),
  clearMessages: () => set({ messages: [] }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set(state => ({ isOpen: !state.isOpen })),

  // 新增方法
  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),
}));
```

**Step 2: 修改 AIChatPanel.tsx 显示加载状态**

读取现有文件:

```bash
cat client/src/refactor_v2/components/AIChatPanel.tsx
```

添加加载和错误状态显示:

```typescript
const { messages, isLoading, error, clearMessages } = useAIChatStore();

// 在消息列表末尾添加加载指示器
return (
  <div className="...">
    {/* 消息列表 */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        // 现有的消息渲染逻辑
      ))}

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-lg max-w-[80%]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[var(--text-secondary)] text-sm">AI 正在思考...</span>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-center py-2">
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}
    </div>

    {/* 其他内容 */}
  </div>
);
```

**Step 3: 验证**

```bash
pnpm check
```

---

### GLM-003: Orchestrator 模型选择增强 [Phase 3] ⏱️ 1h

**目标**: 让 Orchestrator 为不同子 Agent 选择合适的模型

> ⚠️ 此任务依赖 Codex 完成 CDX-003 (model-router.ts)
>
> 如果 `server/_core/model-router.ts` 不存在，跳过此任务并在阻塞区记录

**Step 1: 检查依赖**

```bash
ls server/_core/model-router.ts
```

如果文件不存在，跳过此任务。

**Step 2: 导入模型选择器**

修改 `server/_core/agent/orchestrator.ts`:

```typescript
import { selectModel, type ModelPreference } from "../model-router";
```

**Step 3: 添加模型选择逻辑**

在 Orchestrator 类中添加方法:

```typescript
/**
 * 根据 Agent 类型获取模型偏好
 */
private getModelPreferenceForAgent(agentType: string): ModelPreference {
  switch (agentType) {
    case "research":
      // 调研任务用 Grok (擅长实时搜索)
      return {
        provider: "grok",
        capabilities: ["realtime_search", "research"],
        reason: "实时搜索能力"
      };

    case "analysis":
      // 分析任务用 GLM (便宜快速)
      return {
        provider: "glm",
        capabilities: ["chinese", "fast"],
        reason: "高性价比"
      };

    case "backtest":
      // 回测任务用 DeepSeek (擅长推理)
      return {
        provider: "deepseek",
        capabilities: ["reasoning", "math"],
        reason: "强推理能力"
      };

    default:
      // 默认用便宜的
      return {
        preferCheap: true,
        reason: "默认选择"
      };
  }
}
```

**Step 4: 在创建 Agent 时应用模型偏好**

找到创建子 Agent 的地方，传入模型偏好:

```typescript
// 示例：在执行任务时选择模型
async executeTask(task: Task): Promise<TaskResult> {
  const modelPreference = this.getModelPreferenceForAgent(task.type);
  const model = selectModel(modelPreference);

  console.log(`[Orchestrator] 任务 ${task.type} 使用模型: ${model.name}`);

  // 后续执行逻辑...
}
```

**Step 5: 验证**

```bash
pnpm check
```

---

### GLM-004: StockAnalysisFramework 6步骨架 [Phase 4] ⏱️ 1.5h

**目标**: 创建 6 步分析框架的骨架结构（仅结构，不实现业务逻辑）

**Step 1: 创建目录和文件**

创建 `server/_core/analysis/` 目录。

创建 `server/_core/analysis/stock-analysis-framework.ts`:

```typescript
/**
 * StockAnalysisFramework - 6步证券分析框架
 *
 * 骨架实现，定义完整的分析流程接口
 * 当前版本：仅定义接口和空方法，不改变现有行为
 */

import type {
  UserProfile,
  UserMindset,
  ConversationContext,
  HoldingMemory,
  OperationPattern,
} from "../memory/simplemem.types";

// ============ Step 1: 解析输入 ============

export interface ParsedInput {
  stocks: string[];
  queryType: "quote" | "analysis" | "advice" | "comparison" | "general";
  userSentiment: "bullish" | "bearish" | "neutral" | "anxious" | "greedy";
  isFollowUp: boolean;
  newInformation: Record<string, string>;
}

// ============ Step 2: 行情复盘 ============

export interface MarketReview {
  currentPrices: Record<string, number>;
  priceChanges: {
    code: string;
    change1d: number;
    change5d: number;
    change20d: number;
  }[];
  technicalLevels: {
    code: string;
    support: number[];
    resistance: number[];
    trend: "up" | "down" | "sideways";
  }[];
  userCostBasis: {
    code: string;
    costPrice: number;
    currentPrice: number;
    profitLevel: number;
  }[];
}

// ============ Step 3: 多维度分析 ============

export interface AnalysisResult {
  technical: {
    code: string;
    macdSignal: "buy" | "sell" | "hold";
    rsiLevel: number;
    volumeTrend: "increasing" | "decreasing" | "stable";
    summary: string;
  }[];
  funding: {
    code: string;
    mainForceFlow: "inflow" | "outflow" | "neutral";
    retailFlow: "inflow" | "outflow" | "neutral";
    summary: string;
  }[];
  fundamental: {
    code: string;
    peRatio: number;
    pbRatio: number;
    revenueGrowth: number;
    summary: string;
  }[];
  sentiment: {
    code: string;
    newsScore: number;
    socialScore: number;
    analystRating: string;
    summary: string;
  }[];
  relevantPatterns: OperationPattern[];
}

// ============ Step 4: 风险评估 ============

export interface RiskAssessment {
  stockRisks: {
    code: string;
    riskLevel: "low" | "medium" | "high" | "extreme";
    riskFactors: string[];
    potentialDownside: number;
    stopLossRecommendation: number;
  }[];
  portfolioRisk: {
    concentrationRisk: "low" | "medium" | "high";
    sectorExposure: Record<string, number>;
    correlationRisk: number;
  };
  userSpecificRisk: {
    matchesRiskTolerance: boolean;
    emotionalRiskFlag: boolean;
    warningMessages: string[];
  };
}

// ============ Step 5: 操作建议 ============

export interface OperationalAdvice {
  [stockCode: string]: {
    shortTerm: {
      action: "buy" | "sell" | "hold" | "reduce" | "add";
      confidence: number;
      reasoning: string;
      targetPrice?: number;
      stopLoss?: number;
    };
    mediumTerm: {
      action: "buy" | "sell" | "hold" | "reduce" | "add";
      confidence: number;
      reasoning: string;
      targetPrice?: number;
    };
    longTerm: {
      outlook: "bullish" | "bearish" | "neutral";
      reasoning: string;
    };
  };
}

// ============ Step 6: 个性化调整 ============

export interface PersonalizedOutput {
  baseAdvice: OperationalAdvice;
  personalizedEvaluation: {
    currentMindsetAssessment: string;
    historicalPatternMatch: string[];
    adjustedRecommendation: string;
  };
  questionsForClarification: string[];
  warningFlags: {
    type: "emotional" | "pattern" | "risk";
    description: string;
    suggestion: string;
  }[];
}

// ============ Framework Class ============

export class StockAnalysisFramework {
  /**
   * 第一步: 读懂输入
   * 提取: 股票代码、问题类型、隐含心态
   */
  async step1_parseUserInput(
    userMessage: string,
    context: ConversationContext
  ): Promise<ParsedInput> {
    // TODO: 实现解析逻辑
    console.log("[Framework] Step 1: 解析用户输入");

    return {
      stocks: this.extractStockCodes(userMessage),
      queryType: "analysis",
      userSentiment: "neutral",
      isFollowUp: false,
      newInformation: {},
    };
  }

  /**
   * 第二步: 实时行情复盘
   * 获取: 当前价、涨跌幅、成交量、技术位置
   */
  async step2_reviewMarketStatus(
    stocks: string[],
    portfolio: HoldingMemory[]
  ): Promise<MarketReview> {
    // TODO: 调用工具获取实时数据
    console.log("[Framework] Step 2: 行情复盘", stocks);

    return {
      currentPrices: {},
      priceChanges: [],
      technicalLevels: [],
      userCostBasis: [],
    };
  }

  /**
   * 第三步: 多维度分析
   * 技术面、资金面、基本面、情绪面
   */
  async step3_multidimensionalAnalysis(
    stocks: string[],
    review: MarketReview,
    userProfile: UserProfile
  ): Promise<AnalysisResult> {
    // TODO: 实现多维度分析
    console.log("[Framework] Step 3: 多维度分析", stocks);

    return {
      technical: [],
      funding: [],
      fundamental: [],
      sentiment: [],
      relevantPatterns: [],
    };
  }

  /**
   * 第四步: 风险收益评估
   * 结合用户持仓和心理状态
   */
  async step4_riskRewardAssessment(
    stocks: string[],
    analysis: AnalysisResult,
    portfolio: HoldingMemory[],
    mindset: UserMindset
  ): Promise<RiskAssessment> {
    // TODO: 实现风险评估
    console.log("[Framework] Step 4: 风险评估", stocks);

    return {
      stockRisks: [],
      portfolioRisk: {
        concentrationRisk: "medium",
        sectorExposure: {},
        correlationRisk: 0,
      },
      userSpecificRisk: {
        matchesRiskTolerance: true,
        emotionalRiskFlag: false,
        warningMessages: [],
      },
    };
  }

  /**
   * 第五步: 生成操作建议
   * 短中长期建议
   */
  async step5_generateOperationalAdvice(
    stocks: string[],
    risk: RiskAssessment,
    portfolio: HoldingMemory[],
    analysis: AnalysisResult,
    userProfile: UserProfile
  ): Promise<OperationalAdvice> {
    // TODO: 实现建议生成
    console.log("[Framework] Step 5: 生成建议", stocks);

    return {};
  }

  /**
   * 第六步: 个性化问答与调整
   * 根据用户历史模式调整建议
   */
  async step6_personalizedQAAndAdjustment(
    userMessage: string,
    advice: OperationalAdvice,
    portfolio: HoldingMemory[],
    mindset: UserMindset,
    userProfile: UserProfile,
    analysis: AnalysisResult,
    context: ConversationContext
  ): Promise<PersonalizedOutput> {
    // TODO: 实现个性化调整
    console.log("[Framework] Step 6: 个性化调整");

    return {
      baseAdvice: advice,
      personalizedEvaluation: {
        currentMindsetAssessment: "",
        historicalPatternMatch: [],
        adjustedRecommendation: "",
      },
      questionsForClarification: [],
      warningFlags: [],
    };
  }

  /**
   * 完整执行6步分析
   */
  async analyze(
    userMessage: string,
    context: ConversationContext,
    portfolio: HoldingMemory[],
    mindset: UserMindset,
    userProfile: UserProfile
  ): Promise<PersonalizedOutput> {
    const step1 = await this.step1_parseUserInput(userMessage, context);
    const step2 = await this.step2_reviewMarketStatus(step1.stocks, portfolio);
    const step3 = await this.step3_multidimensionalAnalysis(
      step1.stocks,
      step2,
      userProfile
    );
    const step4 = await this.step4_riskRewardAssessment(
      step1.stocks,
      step3,
      portfolio,
      mindset
    );
    const step5 = await this.step5_generateOperationalAdvice(
      step1.stocks,
      step4,
      portfolio,
      step3,
      userProfile
    );
    const step6 = await this.step6_personalizedQAAndAdjustment(
      userMessage,
      step5,
      portfolio,
      mindset,
      userProfile,
      step3,
      context
    );

    return step6;
  }

  // ============ Helper Methods ============

  private extractStockCodes(text: string): string[] {
    // 简单的股票代码提取
    const patterns = [
      /\b(\d{6})\b/g, // A股代码 000001
      /\b([A-Z]{1,5})\b/g, // 美股代码 AAPL
      /\b(\d{6}\.[A-Z]{2})\b/g, // 带后缀 000001.SZ
    ];

    const codes: string[] = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        codes.push(...matches);
      }
    }

    return [...new Set(codes)];
  }
}

// 工厂函数
export function createStockAnalysisFramework(): StockAnalysisFramework {
  return new StockAnalysisFramework();
}
```

**Step 2: 创建导出文件**

创建 `server/_core/analysis/index.ts`:

```typescript
export * from "./stock-analysis-framework";
```

**Step 3: 验证**

```bash
pnpm check
```

---

## ✅ 完成检查清单

```
Phase 1:
[x] GLM-001: FloatingAIChatInput 连接 API
    [x] 移除 mock 代码
    [x] 导入并使用 useSendMessage
    [x] 添加 loading/error 处理
    [x] pnpm check 通过

[x] GLM-002: 加载状态和错误处理
    [x] Store 添加 isLoading/error 状态
    [x] Store 添加 setLoading/setError 方法
    [x] AIChatPanel 显示加载动画
    [x] AIChatPanel 显示错误提示
    [x] pnpm check 通过

Phase 3:
[x] GLM-003: Orchestrator 模型选择
    [x] 检查 model-router.ts 是否存在
    [x] 导入 selectModel
    [x] 添加 getModelPreferenceForAgent 方法
    [x] 在执行任务时应用模型偏好
    [x] pnpm check 通过

Phase 4:
[x] GLM-004: StockAnalysisFramework 6步骨架
    [x] 创建 analysis/ 目录
    [x] 创建 stock-analysis-framework.ts
    [x] 定义所有接口类型
    [x] 实现 6 个步骤的空方法
    [x] 创建 index.ts 导出
    [x] 创建 server/_core/memory/simplemem.types.ts 占位文件
    [x] pnpm check 通过

总体完成度: 4/4 任务 (100%)
```

---

## 🛑 阻塞处理

如果遇到以下情况，**立即停下并在下方记录**:

1. **useSendMessage 不存在** - 检查 `client/src/refactor_v2/api/ai.ts`
2. **Store 结构与预期不同** - 先读取现有 store 代码
3. **model-router.ts 不存在** (GLM-003) - 跳过任务，记录阻塞
4. **simplemem.types.ts 不存在** (GLM-004) - 创建空类型或跳过相关导入

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
git commit -m "feat(ai): GLM 完成前端 AI 集成、Orchestrator 增强和 6 步分析框架骨架"
```

---

## 🔴 阻塞记录区

(GLM 在此记录遇到的阻塞问题)

### ✅ GLM-003: 已完成 (2026-01-20)

**解决时间**: 2026-01-20 23:00
**解决方式**: 等待 Codex 完成 CDX-003 (model-router.ts) 后执行
**实现内容**:

- 导入 selectModel 和 ModelPreference
- 添加 getModelPreferenceForAgent 方法
- ResearchAgent → Grok (实时搜索能力)
- AnalysisAgent → GLM (高性价比)
- BacktestAgent → DeepSeek (强推理能力)
- 在创建 Agent 时记录模型选择
- pnpm check 通过

---

**任务版本**: v2.0  
**创建时间**: 2026-01-20 22:00  
**预计完成**: 2026-01-21 06:00
