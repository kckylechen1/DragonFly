# Codex 任务：修复剩余 P0/P1 问题

> **优先级**: 高  
> **预计时间**: 2-3 小时  
> **分支**: 在当前分支继续

---

## 背景

Amp 审阅了 agent-optimization 代码，发现了一些 bug。我已经修复了 5 个问题，还剩 3 个需要你来完成：

### 已完成 ✅
- P0-1: BaseAgent 多轮状态 bug → `beginTurn()` 已添加
- P0-2: JSON.parse 崩溃 → try/catch 保护已添加
- P1-4: 消息无限增长 → `trimMessages()` 已添加
- P1-5: Router 异步竞态 → 改用同步 require
- EXTRA-1: MACD/KDJ 数值 → report 模板已修复

### 你的任务 📋

---

## TASK-A: P0-3 模型选择不生效（核心问题）

**文件**: `server/_core/agent/orchestrator.ts`, `server/_core/agent/base-agent.ts`

**问题**: `createAgent()` 调用了 `selectModel()` 但返回的 config 没传给子 Agent，导致所有模型选择逻辑形同虚设。

**修复步骤**:

1. 在 `AgentConfig` (types.ts) 添加 llm 配置字段：
```typescript
interface AgentConfig {
  // ... 现有字段
  llm?: { url: string; key: string; model: string };
}
```

2. 修改 `BaseAgent.callLLM()` 使用注入的配置：
```typescript
private async callLLM(): Promise<LLMResponse> {
  const llmConfig = this.config.llm ?? {
    url: ENV.grokApiUrl,
    key: ENV.grokApiKey,
    model: ENV.grokModel,
  };
  
  const response = await fetch(`${llmConfig.url}/chat/completions`, {
    // ... 使用 llmConfig.key 和 llmConfig.model
  });
}
```

3. 修改 `orchestrator.ts` 的 `createAgent()` 传入配置：
```typescript
private createAgent(type: string): BaseAgent {
  const modelConfig = selectModel(this.getModelPreferenceForAgent(type));
  
  const llmConfig = {
    url: modelConfig.url,
    key: modelConfig.key,
    model: modelConfig.model,
  };

  switch (type) {
    case "research":
      return new ResearchAgent({ llm: llmConfig });
    // ... 其他 agent 类型
  }
}
```

---

## TASK-B: P1-6 模型枚举不一致

**问题**: 不同模块使用的模型 ID 不统一：
- LearnableRouter: `"grok" | "glm" | "qwen"`
- ConsensusAnalysis: `"grok" | "glm" | "deepseek"`

**修复**:

1. 在 `server/_core/agent/types.ts` 定义统一类型：
```typescript
export type ModelId = "grok" | "glm" | "deepseek";
export type QueryComplexity = "simple" | "medium" | "complex";
```

2. 更新 `learnable-router.ts` 使用 `deepseek` 替代 `qwen`

3. 更新所有引用这些类型的地方

---

## TASK-C: P1-7 错误参与投票

**文件**: `server/_core/agent/consensus-analysis.ts`

**问题**: API 调用失败时返回错误字符串，会被 `extractConclusion()` 返回 "无明确结论"，这个错误结果参与投票可能导致误判。

**修复**:

```typescript
// 1. 定义结果类型
type ModelCallResult = 
  | { ok: true; content: string }
  | { ok: false; error: string };

// 2. 修改 callModel 返回类型
async function callModel(...): Promise<ModelCallResult> {
  try {
    const response = await fetch(...);
    if (!response.ok) {
      return { ok: false, error: `${response.status}` };
    }
    const data = await response.json();
    return { ok: true, content: data.choices?.[0]?.message?.content || "" };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

// 3. 投票时过滤失败的模型
const validResults = [grokResult, glmResult, deepseekResult].filter(r => r.ok);
if (validResults.length < 2) {
  return { 
    recommendation: "数据不足", 
    confidence: 0, 
    method: "insufficient" as const,
    models: { grok: {...}, glm: {...}, deepseek: {...} }
  };
}
```

---

## Done Definition

- [ ] TypeScript 编译通过 (`pnpm check`)
- [ ] 所有 Agent 使用 Orchestrator 时能正确切换模型
- [ ] LearnableRouter 和 ConsensusAnalysis 使用统一的 ModelId
- [ ] ConsensusAnalysis 不会让失败的 API 调用影响投票结果

---

## 验证命令

```bash
# 类型检查
cd server && npx tsc --noEmit

# 运行测试
npx tsx server/scripts/test-agent-improvements.ts
```

完成后 push 到 `feature/agent-optimization` 分支。
