# 🎯 Epic: Agent 优化 - 数据强制 + 智能路由 + 多模型共识

> **状态**: 🆕 新建  
> **执行 Agent**: 🟢 Codex  
> **执行模式**: 过夜执行  
> **预计时长**: 8-12 小时

---

## 📝 简述

基于今日 Grok vs GLM 测试结果，优化 DragonFly AI Agent 的数据处理、路由策略和决策质量。

---

## ✅ Done Definition

- [ ] 所有模型的 system prompt 都加入"数据强制"指令
- [ ] 复杂度评估增加更多关键词，工具预算调整
- [ ] 详细版提示词可切换
- [ ] 可学习路由器基础版实现（参考 OrchestraLLM 论文）
- [ ] 关键决策共识机制实现（参考 Probabilistic Consensus 论文）
- [ ] 并行推理实现（参考 Parallel-R1 论文）
- [ ] 所有新代码有基础测试
- [ ] `pnpm check` 通过

---

## 📚 研究阶段（必读！）

> ⚠️ **在开始编码前，必须先阅读以下资料！**

### Phase 0: 论文研读

| 论文 | 核心思想 | 参考实现 |
|------|---------|---------|
| **ToolOrchestra** (2024.10) | 用 8B 小模型作为编排器，动态调度工具和大模型，GRPO 强化学习优化 | TASK-004 路由器 |
| **WorkflowLLM** (ICLR 2025) | 工作流数据集 + 微调，支持 78+ 步嵌套工作流 | 工作流标准化 |
| **MARCO** (EMNLP 2024) | 多层 Agent 系统，延迟降低 44.91%，成本降低 33.71% | 整体架构 |
| **OrchestraLLM** (2023.11) | 用小模型做路由器，基于历史相似度训练 | TASK-004 |
| **BEST-Route** (2025.04) | 简单→小模型单次，中等→多采样投票，复杂→大模型 | TASK-002 |
| **Probabilistic Consensus** (2024.11) | 多模型投票，3 模型可达 95.6% 准确率 | TASK-005 |
| **Parallel-R1** (2025.09) | 4-8 条并行推理路径，交叉验证 | TASK-006 |

### Phase 0: 开源仓库参考

请先阅读以下仓库的架构设计：

1. **FinRobot** (4,800+ stars)
   - GitHub: https://github.com/AI4Finance-Foundation/FinRobot
   - 重点看：`Director Agent` 设计、RAG 集成、任务编排

2. **FinRL** (9,600+ stars)
   - GitHub: https://github.com/AI4Finance-Foundation/FinRL
   - 重点看：回测框架、风险控制模块

3. **FinGPT** (13,000+ stars)
   - GitHub: https://github.com/AI4Finance-Foundation/FinGPT
   - 重点看：金融领域微调、数据集处理

4. **LangChain** (参考)
   - 重点看：Router 设计模式、Agent 执行框架

### 研究任务清单

在开始编码前，请完成：

- [ ] 阅读 FinRobot 的 `agents/` 目录结构
- [ ] 阅读 FinRobot 的 Director Agent 实现
- [ ] 理解 OrchestraLLM 的路由器训练方法
- [ ] 理解 Probabilistic Consensus 的投票算法
- [ ] 总结可借鉴的设计模式到 `tasks/epics/agent-optimization/research-notes.md`

---

## 📊 子任务

| 任务 | 优先级 | 描述 | 预计时长 |
|------|--------|------|---------|
| TASK-001 | ⭐⭐⭐⭐⭐ | 数据强制层 - 修改 system prompt | 1-2h |
| TASK-002 | ⭐⭐⭐⭐⭐ | 复杂度评估优化 | 1h |
| TASK-003 | ⭐⭐⭐⭐ | 详细版提示词模板 | 30min |
| TASK-004 | ⭐⭐⭐⭐ | 可学习路由器 | 4-6h |
| TASK-005 | ⭐⭐⭐ | 关键决策共识 | 4-6h |
| TASK-006 | ⭐⭐ | 并行推理（可选） | 2-3h |

---

## 🔄 执行顺序

```
Phase 1: TASK-001 → TASK-002 → TASK-003 (基础优化)
Phase 2: TASK-004 (路由器)
Phase 3: TASK-005 → TASK-006 (集成增强)
```

---

# TASK-001: 数据强制层

## 负责 Agent: 🟢 Codex

## 目标
- [ ] 修改所有模型的 system prompt，添加数据强制指令
- [ ] 禁止模型"凭记忆回答"

## 需要修改的文件

### 文件 1: `server/_core/agent/agents/analysis-agent.ts`

在现有的 `ANALYSIS_SYSTEM_PROMPT` 开头添加：

```typescript
const DATA_ENFORCEMENT_PREFIX = `
⚠️ 数据使用规则（必须遵守）：
1. 你的分析只能基于下面提供的实时数据
2. 禁止使用你训练集中的历史数据
3. 禁止说「根据我的数据」「在我的训练中」等表述
4. 如果数据不足，明确说「无法判断」
5. 每个结论都要有数据支撑

今日日期：${new Date().toISOString().split('T')[0]}
`;
```

然后修改 prompt 构造：
```typescript
const fullPrompt = DATA_ENFORCEMENT_PREFIX + ANALYSIS_SYSTEM_PROMPT;
```

### 文件 2: `server/_core/grokClient.ts`

在 `buildSystemPrompt` 函数中加入相同的前缀。

### 文件 3: `server/_core/grokAgentV2_ReactLoop.ts`

在 system prompt 中加入数据强制前缀。

## 验证

```bash
# 运行测试脚本
npx tsx server/scripts/test-grok-detailed.ts

# 检查输出中是否有"根据我的数据"等禁止词
```

---

# TASK-002: 复杂度评估优化

## 负责 Agent: 🟢 Codex

## 目标
- [ ] 增加复杂模式关键词
- [ ] 调整工具预算

## 需要修改的文件

### 文件: `server/_core/agent/base-agent.ts`

找到 `classifyQueryComplexity` 方法（约第 200-250 行），修改：

**当前代码**:
```typescript
const complexPatterns = [
  /对比|比较|研究|调研|分析.*趋势|深度分析/i,
  /回测|测试.*策略/i,
];
```

**修改为**:
```typescript
const complexPatterns = [
  /对比|比较|研究|调研|分析.*趋势|深度分析/i,
  /回测|测试.*策略/i,
  /叠加|逻辑|基本面|估值|业绩|行业地位/i,  // 新增
  /CPU|芯片|产业链|供应链|深度|全面|综合|详细/i,  // 新增
  /为什么|怎么操作|止损|止盈|买入|卖出|选择/i,  // 新增
];
```

**调整工具预算**:
找到 `toolBudget` 配置：
```typescript
// 当前
toolBudget: {
  simple: 4,
  complex: 8,
}

// 修改为
toolBudget: {
  simple: 6,   // 从 4 提升到 6
  complex: 12, // 从 8 提升到 12
}
```

## 验证

```bash
# 测试分类
npx tsx -e "
import { BaseAgent } from './server/_core/agent/base-agent';
const agent = new (class extends BaseAgent {})();
console.log(agent.classifyQueryComplexity('看看长城'));
console.log(agent.classifyQueryComplexity('分析长城的CPU逻辑'));
"
# 期望: simple, complex
```

---

# TASK-003: 详细版提示词模板

## 负责 Agent: 🟢 Codex

## 目标
- [ ] 创建详细版提示词模板
- [ ] 可通过配置切换

## 需要创建的文件

### 新建: `server/_core/prompts/stock-analysis-prompts.ts`

```typescript
/**
 * 股票分析提示词模板
 */

// 简洁版（默认）
export const CONCISE_PROMPT = `
你是专业A股技术分析师。请简洁输出：
1. 结论（买/卖/持有）
2. 三个关键理由
3. 具体点位（入场/止损/目标）
`;

// 详细版
export const DETAILED_PROMPT = `
你是一个专业的A股技术分析助手。

## 重要要求
1. **详细阐述**：每个指标都要详细解释含义、当前状态、以及对后市的影响
2. **不要省略**：所有指标都要给出具体数值
3. **逻辑链条**：分析要有因果关系
4. **字数要求**：输出至少 1500 字

## 输出框架

### [股票名称]（[代码]）技术分析报告

**一、最新行情回顾**
- 详细描述今日走势
- 分析成交量变化的含义
- 对比前几日的走势特征

**二、均线系统分析**
- 各档均线具体数值
- 均线排列情况及其含义
- 金叉/死叉信号分析
- 股价与均线的偏离程度分析

**三、MACD 指标深度解读**
- DIF、DEA、MACD柱的具体数值
- 红绿柱的趋势（放大/缩小）
- 金叉/死叉信号及其强度
- 与股价走势是否背离

**四、KDJ 指标分析**
- K、D、J 具体数值
- 超买超卖状态
- 钝化风险分析

**五、RSI 指标分析**
- RSI(14) 具体数值
- 当前所处区域
- 超买超卖风险

**六、资金面深度分析**
- 主力资金动向
- 各档资金分解
- 主力意图分析

**七、支撑位与阻力位**
- 多档支撑位及其依据
- 多档阻力位及其依据

**八、综合技术研判**
- 短期（日线）趋势判断
- 中期（周线）趋势判断
- 主要风险点

**九、操作策略**
- 持仓者策略
- 空仓者策略
- 入场价位/止损价位/目标价位
- 仓位建议
`;

export type PromptStyle = 'concise' | 'detailed';

export function getPromptByStyle(style: PromptStyle): string {
  return style === 'detailed' ? DETAILED_PROMPT : CONCISE_PROMPT;
}
```

### 修改: `server/_core/agent/agents/analysis-agent.ts`

导入并使用：
```typescript
import { getPromptByStyle, PromptStyle } from '../prompts/stock-analysis-prompts';

// 在 constructor 或配置中
private promptStyle: PromptStyle = 'concise';

// 获取 prompt 时
const analysisPrompt = getPromptByStyle(this.promptStyle);
```

---

# TASK-004: 可学习路由器

## 负责 Agent: 🟢 Codex

## 目标
- [ ] 创建 `LearnableRouter` 类
- [ ] 记录查询历史
- [ ] 基于历史相似度选择模型

## 需要创建的文件

### 新建: `server/_core/agent/learnable-router.ts`

```typescript
/**
 * 可学习路由器
 * 基于历史查询相似度动态选择最优模型
 */

export interface QueryRecord {
  id: string;
  query: string;
  stockCode: string;
  complexity: 'simple' | 'medium' | 'complex';
  intent: string;
  usedModel: 'grok' | 'glm' | 'qwen';
  latency: number;  // 毫秒
  tokenCount: number;
  success: boolean;
  timestamp: number;
}

export class LearnableRouter {
  private history: QueryRecord[] = [];
  private storageFile = 'query-history.json';

  constructor() {
    this.loadHistory();
  }

  async selectModel(
    query: string,
    stockCode: string,
    complexity: 'simple' | 'medium' | 'complex'
  ): Promise<'grok' | 'glm' | 'qwen'> {
    // 1. 找相似历史查询
    const similar = this.findSimilar(query, stockCode, 5);

    if (similar.length < 3) {
      // 历史数据不足，用默认策略
      return this.defaultRoute(complexity);
    }

    // 2. 统计模型成功率
    const modelStats = new Map<string, { wins: number; total: number; avgLatency: number }>();

    for (const record of similar) {
      const model = record.usedModel;
      if (!modelStats.has(model)) {
        modelStats.set(model, { wins: 0, total: 0, avgLatency: 0 });
      }
      const stat = modelStats.get(model)!;
      stat.total += 1;
      if (record.success) stat.wins += 1;
      stat.avgLatency = (stat.avgLatency * (stat.total - 1) + record.latency) / stat.total;
    }

    // 3. 计算加权分数 (成功率 70% + 速度 30%)
    let bestModel: 'grok' | 'glm' | 'qwen' = 'grok';
    let bestScore = -1;

    for (const [model, stat] of modelStats) {
      const winRate = stat.wins / stat.total;
      const speedScore = 1 - Math.min(stat.avgLatency / 60000, 1); // 60s 内归一化
      const score = winRate * 0.7 + speedScore * 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestModel = model as 'grok' | 'glm' | 'qwen';
      }
    }

    return bestModel;
  }

  recordResult(record: Omit<QueryRecord, 'id' | 'timestamp'>): void {
    this.history.push({
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
    this.saveHistory();
  }

  private findSimilar(query: string, stockCode: string, topK: number): QueryRecord[] {
    return this.history
      .filter(r => r.stockCode === stockCode)
      .map(r => ({
        ...r,
        similarity: this.computeSimilarity(query, r.query),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  private computeSimilarity(s1: string, s2: string): number {
    // 简单实现：Jaccard 相似度
    const tokens1 = new Set(s1.split(''));
    const tokens2 = new Set(s2.split(''));
    const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);
    return intersection.size / union.size;
  }

  private defaultRoute(complexity: 'simple' | 'medium' | 'complex'): 'grok' | 'glm' | 'qwen' {
    switch (complexity) {
      case 'simple': return 'qwen';
      case 'medium': return 'grok';
      case 'complex': return 'grok';
    }
  }

  private loadHistory(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', this.storageFile);
      if (fs.existsSync(filePath)) {
        this.history = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {
      console.warn('[LearnableRouter] Failed to load history:', e);
    }
  }

  private saveHistory(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, this.storageFile);
      fs.writeFileSync(filePath, JSON.stringify(this.history, null, 2));
    } catch (e) {
      console.warn('[LearnableRouter] Failed to save history:', e);
    }
  }

  // 获取统计报告
  getStats(): { model: string; totalQueries: number; successRate: number; avgLatency: number }[] {
    const stats = new Map<string, { total: number; wins: number; latencySum: number }>();

    for (const record of this.history) {
      if (!stats.has(record.usedModel)) {
        stats.set(record.usedModel, { total: 0, wins: 0, latencySum: 0 });
      }
      const s = stats.get(record.usedModel)!;
      s.total += 1;
      if (record.success) s.wins += 1;
      s.latencySum += record.latency;
    }

    return [...stats.entries()].map(([model, s]) => ({
      model,
      totalQueries: s.total,
      successRate: s.wins / s.total,
      avgLatency: s.latencySum / s.total,
    }));
  }
}

// 单例
export const learnableRouter = new LearnableRouter();
```

---

# TASK-005: 关键决策共识

## 负责 Agent: 🟢 Codex

## 目标
- [ ] 创建 `ConsensusAnalysis` 模块
- [ ] 3 模型并行调用
- [ ] 一致性计算和仲裁

## 需要创建的文件

### 新建: `server/_core/agent/consensus-analysis.ts`

```typescript
/**
 * 多模型共识分析
 * 用于关键交易决策，提升准确率
 */

import { ENV } from '../env';

export interface ConsensusResult {
  recommendation: string;
  confidence: number;  // 0-1
  method: 'unanimous' | 'majority' | 'arbitration';
  models: {
    grok: { conclusion: string; reasoning: string };
    glm: { conclusion: string; reasoning: string };
    qwen: { conclusion: string; reasoning: string };
  };
  arbitration?: string;
}

async function callModel(
  model: 'grok' | 'glm' | 'qwen',
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const configs = {
    grok: { url: ENV.grokApiUrl, key: ENV.grokApiKey, model: ENV.grokModel },
    glm: { url: ENV.glmApiUrl, key: ENV.glmApiKey, model: ENV.glmModel },
    qwen: { url: ENV.forgeApiUrl, key: ENV.forgeApiKey, model: 'Qwen/Qwen3-32B' },
  };

  const config = configs[model];
  if (!config.key) return `${model} API key not configured`;

  const response = await fetch(`${config.url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.key}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function extractConclusion(response: string): string {
  // 提取结论：买入/卖出/持有/止损 等
  const patterns = [
    /(?:建议|结论|操作)[：:]\s*(买入|卖出|持有|观望|止损|止盈|加仓|减仓)/,
    /(买入|卖出|持有|观望|止损|止盈|加仓|减仓)/,
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) return match[1];
  }

  return '无明确结论';
}

function calculateAgreement(conclusions: string[]): number {
  const votes = new Map<string, number>();
  for (const c of conclusions) {
    votes.set(c, (votes.get(c) || 0) + 1);
  }
  const maxVotes = Math.max(...votes.values());
  return maxVotes / conclusions.length;
}

function getMajorityConclusion(conclusions: string[]): string {
  const votes = new Map<string, number>();
  for (const c of conclusions) {
    votes.set(c, (votes.get(c) || 0) + 1);
  }
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export async function consensusAnalysis(
  query: string,
  stockCode: string,
  dataContext: string
): Promise<ConsensusResult> {
  const systemPrompt = `
你是专业A股分析师。请基于提供的数据分析，给出明确的交易建议。
结论必须是以下之一：买入、卖出、持有、观望、止损、止盈、加仓、减仓

先给结论，再说理由。
`;

  const userMessage = `股票代码：${stockCode}\n\n${dataContext}\n\n${query}`;

  // 并行调用 3 个模型
  const [grokResp, glmResp, qwenResp] = await Promise.all([
    callModel('grok', systemPrompt, userMessage),
    callModel('glm', systemPrompt, userMessage),
    callModel('qwen', systemPrompt, userMessage),
  ]);

  // 提取结论
  const grokConc = extractConclusion(grokResp);
  const glmConc = extractConclusion(glmResp);
  const qwenConc = extractConclusion(qwenResp);

  const conclusions = [grokConc, glmConc, qwenConc];
  const agreement = calculateAgreement(conclusions);

  const models = {
    grok: { conclusion: grokConc, reasoning: grokResp.slice(0, 500) },
    glm: { conclusion: glmConc, reasoning: glmResp.slice(0, 500) },
    qwen: { conclusion: qwenConc, reasoning: qwenResp.slice(0, 500) },
  };

  if (agreement >= 1.0) {
    // 完全一致
    return {
      recommendation: grokConc,
      confidence: 1.0,
      method: 'unanimous',
      models,
    };
  } else if (agreement >= 0.67) {
    // 2/3 一致
    return {
      recommendation: getMajorityConclusion(conclusions),
      confidence: 0.67,
      method: 'majority',
      models,
    };
  } else {
    // 完全分歧 → 仲裁
    const arbitrationPrompt = `
三个 AI 对 ${stockCode} 有不同看法：
- Grok: ${grokConc}
- GLM: ${glmConc}
- Qwen: ${qwenConc}

请综合分析，给出最终建议。结论必须是：买入/卖出/持有/观望/止损/止盈/加仓/减仓 之一。
`;

    const arbitration = await callModel('grok', '你是仲裁者。', arbitrationPrompt);

    return {
      recommendation: extractConclusion(arbitration),
      confidence: 0.5,
      method: 'arbitration',
      models,
      arbitration,
    };
  }
}
```

---

# TASK-006: 并行推理（可选）

## 负责 Agent: 🟢 Codex

## 目标
- [ ] 创建多角度并行分析模块
- [ ] 技术面/资金面/基本面/情绪面 4 个角度

## 需要创建的文件

### 新建: `server/_core/agent/parallel-reasoning.ts`

```typescript
/**
 * 并行多角度推理
 * 从技术面/资金面/基本面/情绪面 4 个角度分析
 */

import { ENV } from '../env';

export interface ParallelAnalysisResult {
  technical: string;  // 技术面
  capital: string;    // 资金面
  fundamental: string; // 基本面
  sentiment: string;  // 情绪面
  synthesis: string;  // 综合
}

const PERSPECTIVE_PROMPTS = {
  technical: `
你是技术分析专家。请只从技术面分析：
- 均线系统
- MACD/KDJ/RSI 指标
- 形态和趋势
- 支撑阻力位

给出技术面结论和买卖点位。
`,
  capital: `
你是资金流向分析专家。请只从资金面分析：
- 主力资金动向
- 超大单/大单/中单/小单分解
- 资金与股价走势关系
- 主力意图判断

给出资金面结论。
`,
  fundamental: `
你是基本面分析专家。请只从基本面分析：
- 行业地位
- 核心逻辑
- 估值水平
- 成长性

给出基本面结论。
`,
  sentiment: `
你是市场情绪分析专家。请只从情绪面分析：
- 换手率和成交量
- 市场热度
- 板块联动
- 资金偏好

给出情绪面结论。
`,
};

async function analyzeFromPerspective(
  perspective: keyof typeof PERSPECTIVE_PROMPTS,
  stockData: string
): Promise<string> {
  const response = await fetch(`${ENV.grokApiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ENV.grokApiKey}`,
    },
    body: JSON.stringify({
      model: ENV.grokModel,
      messages: [
        { role: 'system', content: PERSPECTIVE_PROMPTS[perspective] },
        { role: 'user', content: stockData },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function parallelAnalysis(
  stockCode: string,
  stockData: string
): Promise<ParallelAnalysisResult> {
  // 并行执行 4 个角度分析
  const [technical, capital, fundamental, sentiment] = await Promise.all([
    analyzeFromPerspective('technical', stockData),
    analyzeFromPerspective('capital', stockData),
    analyzeFromPerspective('fundamental', stockData),
    analyzeFromPerspective('sentiment', stockData),
  ]);

  // 综合分析
  const synthesisPrompt = `
你是综合分析师。请基于以下四个角度的分析，给出最终建议：

【技术面】
${technical}

【资金面】
${capital}

【基本面】
${fundamental}

【情绪面】
${sentiment}

请综合分析，给出最终结论和操作建议。
`;

  const synthesisResp = await fetch(`${ENV.grokApiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ENV.grokApiKey}`,
    },
    body: JSON.stringify({
      model: ENV.grokModel,
      messages: [
        { role: 'system', content: '你是资深A股操盘手，请综合分析给出最终建议。' },
        { role: 'user', content: synthesisPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const synthesisData = await synthesisResp.json();
  const synthesis = synthesisData.choices?.[0]?.message?.content || '';

  return {
    technical,
    capital,
    fundamental,
    sentiment,
    synthesis,
  };
}
```

---

## 🧪 验证步骤

完成所有任务后，运行以下验证：

```bash
# 1. 类型检查
pnpm check

# 2. 测试数据强制
npx tsx server/scripts/test-grok-detailed.ts

# 3. 测试共识分析（新建测试脚本）
npx tsx -e "
import { consensusAnalysis } from './server/_core/agent/consensus-analysis';
const result = await consensusAnalysis('应该止损吗', '600879', '收盘价31.46...');
console.log(result);
"
```

---

## 📝 提交规范

每个任务完成后提交：

```bash
git add .
git commit -m "feat(agent): TASK-00X - 任务描述"
```

全部完成后：

```bash
git push origin feature/agent-optimization
```

---

## ⚠️ 注意事项

1. 如果任何任务遇到阻塞，先完成其他任务，不要猜
2. 所有 API 调用都要有错误处理
3. 不要修改现有的接口签名，只添加新功能
4. 保持向后兼容

---

**预计完成时间**: 8-12 小时  
**执行模式**: 过夜执行  
**审查 Agent**: 🟣 Amp
