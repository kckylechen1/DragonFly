# 🧠 Epic: SimpleMem 集成 - 智能记忆系统升级

> **状态**: 🆕 新建  
> **优先级**: ⭐⭐⭐⭐⭐ (高)  
> **预计时长**: 2-3 周（分阶段）  
> **执行模式**: MVP 优先，验证后迭代

---

## 📝 背景

当前 DragonFly 的 memory 系统存在以下问题：

| 问题 | 当前实现 | SimpleMem 方案 |
|------|----------|----------------|
| **检索效率** | 关键词匹配 | 向量 + 元数据混合检索 |
| **Token 消耗** | 全量注入 | Token budget 控制 + 压缩 |
| **对话历史** | 简单截断 | 原子事实提取（Phase 2） |

---

## ⚠️ 关键风险（Oracle 审查）

| 风险 | 缓解措施 |
|------|----------|
| **"无损压缩"在金融语境可能丢失关键信息** | Phase 1 不做 LLM 压缩，MVP 验证后再加 |
| **中文 BM25 分词质量差** | 先用 n-gram + 股票词典，不做完整 BM25 |
| **LanceDB 多实例写入锁** | 单写多读 + 异步队列 |
| **向量维度不匹配** | 从模型配置动态读取，不硬编码 |
| **替换风险** | Adapter 模式 + 双轨运行（shadow mode） |

---

## ✅ Done Definition

### MVP（必须）
- [ ] VectorStore + 元数据过滤可用
- [ ] Adapter 模式，现有 MemoryStore API 不变
- [ ] Token budget 控制生效
- [ ] Benchmark 脚本可运行
- [ ] `pnpm check` 通过

### Phase 2（MVP 验证后）
- [ ] 混合检索（向量 + 简单词法）
- [ ] 中文实体规范化（股票代码/简称映射）

### Phase 3（效果好再做）
- [ ] LLM 压缩（带回归测试集）
- [ ] 代词解析 / 时间锚定

---

## 📊 阶段规划

### 🚀 Phase 1: MVP（1 周）

> **目标**：验证向量检索 + 元数据过滤是否比现有关键词匹配更好

#### TASK-001: 依赖安装与基础设施
**时长**: 2-3h

```bash
# 安装依赖
pnpm add vectordb lancedb
```

**创建文件**:
```
server/_core/memory/simplemem/
├── index.ts           # 入口
├── vector-store.ts    # LanceDB 封装
├── adapter.ts         # MemoryStore 适配器
└── types.ts           # 类型定义
```

---

#### TASK-002: VectorStore - 向量存储
**时长**: 4-6h

```typescript
interface VectorStore {
  // 存储
  store(entries: MemoryEntry[]): Promise<void>;
  
  // 向量检索 + 元数据过滤
  search(query: string, options?: SearchOptions): Promise<MemoryEntry[]>;
}

interface SearchOptions {
  stockCode?: string;
  type?: MemoryType;
  timeRange?: [string, string];
  topK?: number;
}
```

**关键设计**:
```typescript
// 向量维度从模型配置动态读取，不硬编码
const EMBEDDING_DIMENSION = await getEmbeddingDimension();

// Schema
const schema = {
  entry_id: 'string',
  content: 'string',
  type: 'string',           // fact/lesson/trade/...
  stock_code: 'string?',
  keywords: 'string[]',
  importance: 'float',
  created_at: 'string',
  vector: `float[${EMBEDDING_DIMENSION}]`,
};
```

---

#### TASK-003: Adapter 模式 - 双轨运行
**时长**: 3-4h

**核心思路**：保留现有 `MemoryStore` 作为真源，SimpleMem 作为旁路索引

```typescript
// server/_core/memory/simplemem/adapter.ts

import { MemoryStore, MemoryEntry } from '../memory-store';
import { VectorStore } from './vector-store';

export class SimpleMemAdapter {
  private legacyStore: MemoryStore;  // 真源
  private vectorStore: VectorStore;  // 旁路索引
  private shadowMode: boolean;       // 是否双轨运行
  
  constructor(options: { shadowMode?: boolean } = {}) {
    this.legacyStore = getMemoryStore();
    this.vectorStore = new VectorStore();
    this.shadowMode = options.shadowMode ?? true;
  }
  
  // 写入：双写
  async addMemory(entry: MemoryEntry): Promise<string> {
    // 1. 写入旧系统（真源）
    const id = this.legacyStore.addMemory(entry);
    
    // 2. 异步写入向量索引（旁路）
    this.vectorStore.store([{ ...entry, id }]).catch(err => {
      console.error('[SimpleMemAdapter] Vector store write failed:', err);
    });
    
    return id;
  }
  
  // 检索：可切换
  async recall(query: string, options?: RecallOptions): Promise<MemoryEntry[]> {
    if (this.shadowMode) {
      // 双轨：同时跑旧/新，记录差异
      const [legacyResults, vectorResults] = await Promise.all([
        this.legacyStore.recall(query, options),
        this.vectorStore.search(query, options),
      ]);
      
      this.logDiff(query, legacyResults, vectorResults);
      
      // 仍返回旧系统结果（安全）
      return legacyResults;
    }
    
    // 正式切换后：使用向量检索
    return this.vectorStore.search(query, options);
  }
  
  private logDiff(query: string, legacy: MemoryEntry[], vector: MemoryEntry[]): void {
    // 记录差异，用于评估
    console.log(`[Shadow] Query: ${query}`);
    console.log(`[Shadow] Legacy: ${legacy.map(m => m.id).join(',')}`);
    console.log(`[Shadow] Vector: ${vector.map(m => m.id).join(',')}`);
  }
}
```

---

#### TASK-004: Token Budget 控制
**时长**: 2-3h

```typescript
// server/_core/memory/simplemem/token-budget.ts

interface TokenBudgetOptions {
  maxTokens: number;          // 最大注入 token
  priorityOrder: MemoryType[]; // 类型优先级
}

export function selectWithinBudget(
  memories: MemoryEntry[],
  options: TokenBudgetOptions
): MemoryEntry[] {
  const { maxTokens, priorityOrder } = options;
  
  // 按类型分组
  const byType = groupBy(memories, m => m.type);
  
  // 按优先级选择
  const selected: MemoryEntry[] = [];
  let currentTokens = 0;
  
  for (const type of priorityOrder) {
    const typeMemories = byType.get(type) || [];
    for (const memory of typeMemories) {
      const tokens = estimateTokens(memory.content);
      if (currentTokens + tokens > maxTokens) break;
      selected.push(memory);
      currentTokens += tokens;
    }
  }
  
  return selected;
}

function estimateTokens(text: string): number {
  // 粗估：中文约 0.5 token/字，英文约 0.25 token/字
  return Math.ceil(text.length * 0.6);
}
```

---

#### TASK-005: Benchmark 脚本
**时长**: 3-4h

**创建文件**: `server/scripts/benchmark-memory.ts`

```typescript
/**
 * 记忆系统 Benchmark
 * 对比旧/新检索的：
 * 1. Token 消耗
 * 2. 检索延迟
 * 3. 结果差异
 */

import { getMemoryStore } from '../_core/memory';
import { SimpleMemAdapter } from '../_core/memory/simplemem';

const TEST_QUERIES = [
  { query: '长城汽车的历史分析', stockCode: '601633' },
  { query: '我之前买入的股票', stockCode: undefined },
  { query: '上周的交易记录', stockCode: undefined },
  { query: '追高失败的教训', stockCode: undefined },
];

async function benchmark() {
  const legacy = getMemoryStore();
  const adapter = new SimpleMemAdapter({ shadowMode: true });
  
  console.log('🧪 Memory System Benchmark\n');
  console.log('='.repeat(70));
  
  for (const { query, stockCode } of TEST_QUERIES) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(70));
    
    // Legacy
    const legacyStart = Date.now();
    const legacyResults = legacy.recall(query, { stockCode, limit: 5 });
    const legacyLatency = Date.now() - legacyStart;
    const legacyTokens = legacyResults.reduce(
      (sum, m) => sum + estimateTokens(m.content), 0
    );
    
    // Vector
    const vectorStart = Date.now();
    const vectorResults = await adapter.recall(query, { stockCode, limit: 5 });
    const vectorLatency = Date.now() - vectorStart;
    const vectorTokens = vectorResults.reduce(
      (sum, m) => sum + estimateTokens(m.content), 0
    );
    
    console.log(`
| 指标 | Legacy | Vector | 对比 |
|------|--------|--------|------|
| 延迟 | ${legacyLatency}ms | ${vectorLatency}ms | ${vectorLatency < legacyLatency ? '✅' : '⚠️'} |
| Token | ${legacyTokens} | ${vectorTokens} | ${vectorTokens < legacyTokens ? '✅' : '⚠️'} |
| 结果数 | ${legacyResults.length} | ${vectorResults.length} | - |
`);
  }
  
  console.log('='.repeat(70));
  console.log('✅ Benchmark 完成');
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length * 0.6);
}

benchmark().catch(console.error);
```

---

### 🔧 Phase 2: 混合检索（MVP 验证后，1 周）

> **前置条件**：Phase 1 benchmark 显示向量检索有提升

#### TASK-006: 简单词法检索
**时长**: 4-6h

**不做完整 BM25**，先用简单方案：

```typescript
// n-gram + 股票词典
interface LexicalSearch {
  // 2-gram / 3-gram 匹配
  search(query: string, candidates: MemoryEntry[]): ScoredEntry[];
}

// 股票实体规范化
const STOCK_ALIASES: Record<string, string[]> = {
  '601633': ['长城汽车', '长城', '长汽'],
  '000066': ['中国长城', '长城电脑'],
  // ...
};

function normalizeStockMention(text: string): string[] {
  // 识别股票代码和别名，统一为代码
}
```

---

#### TASK-007: 混合评分
**时长**: 3-4h

```typescript
// 混合评分: S = α·vector + β·lexical + γ·metadata
interface HybridScorer {
  score(
    query: string,
    memory: MemoryEntry,
    weights?: { vector?: number; lexical?: number; metadata?: number }
  ): number;
}

// 保留旧系统的 importance / recency / accessCount 作为 rerank 信号
```

---

### 🧠 Phase 3: LLM 压缩（效果好再做，1-2 周）

> **前置条件**：
> - Phase 2 完成
> - 有 50-100 条人工标注的回归测试集
> - 检索质量已达标，但 token 仍是瓶颈

#### TASK-008: MemoryBuilder - 对话压缩器
**时长**: 6-8h

```typescript
interface MemoryBuilder {
  // 添加对话
  addDialogue(speaker: string, content: string, timestamp: string): void;
  
  // 触发压缩（异步，可失败）
  processWindow(): Promise<CompressedEntry[]>;
}

interface CompressedEntry {
  // 压缩后的原子事实
  claim: string;
  
  // 保留原文引用（可追溯）
  sourceRefs: { sessionId: string; messageIds: string[] };
  
  // 结构化字段
  timeAnchor?: string;      // 绝对时间
  subject?: string;         // 主语
  polarity: 'positive' | 'negative' | 'uncertain';
  confidence: number;
}
```

**关键设计**：
1. **可重放**：保留 `sourceRefs`，可从原始对话重建
2. **可降级**：压缩失败时回退到原文
3. **有回归集**：50-100 条人工验证

---

#### TASK-009: 时间锚定（规则版）
**时长**: 2-3h

```typescript
// 先用规则，不用 LLM
const TIME_PATTERNS = [
  { pattern: /今天|今日/, resolve: () => today() },
  { pattern: /昨天|昨日/, resolve: () => yesterday() },
  { pattern: /明天|明日/, resolve: () => tomorrow() },
  { pattern: /上周/, resolve: () => lastWeek() },
  { pattern: /(\d+)月(\d+)日/, resolve: (m) => parseDate(m) },
];

function anchorTime(text: string, referenceTime: Date): string {
  // 规则匹配 + 替换
}
```

---

## 📁 文件结构

```
server/_core/memory/
├── index.ts                     # 原有入口（不变）
├── memory-store.ts              # 原有实现（保留，作为真源）
├── simplemem.types.ts           # 原有类型
├── analysis-memory-manager.ts   # 原有管理器
└── simplemem/                   # 新增目录
    ├── index.ts                 # SimpleMem 入口
    ├── adapter.ts               # MemoryStore 适配器（双轨运行）
    ├── vector-store.ts          # 向量存储 (LanceDB)
    ├── token-budget.ts          # Token 预算控制
    ├── embedding.ts             # 嵌入模型适配器
    ├── lexical-search.ts        # 简单词法检索（Phase 2）
    ├── hybrid-scorer.ts         # 混合评分（Phase 2）
    ├── memory-builder.ts        # 对话压缩器（Phase 3）
    └── types.ts                 # 类型定义
```

---

## 🔧 技术选型

| 组件 | 选择 | 备注 |
|------|------|------|
| **向量数据库** | LanceDB | 轻量、嵌入式 |
| **嵌入模型** | OpenAI text-embedding-3-small | 1536 维，动态读取 |
| **词法检索** | n-gram + 股票词典 | 先不做完整 BM25 |
| **LLM 压缩** | GPT-4o-mini | Phase 3 才用 |

---

## 📊 成功指标

### MVP 指标
| 指标 | 目标 | 测量方法 |
|------|------|----------|
| 检索延迟 | <200ms P95 | Benchmark 脚本 |
| 向后兼容 | 100% | 现有 API 测试 |
| Shadow 差异率 | <30% | 日志分析 |

### Phase 2 指标
| 指标 | 目标 | 测量方法 |
|------|------|----------|
| 检索准确率 | ≥70% Precision@5 | 人工评测 |
| Token 节省 | ≥30% | Benchmark 对比 |

### Phase 3 指标
| 指标 | 目标 | 测量方法 |
|------|------|----------|
| 压缩无损率 | ≥95% | 回归测试集 |
| Token 节省 | ≥50% | Benchmark 对比 |

---

## 🔄 执行顺序

```
Week 1 (MVP):
  Day 1:   TASK-001 依赖安装
  Day 2-3: TASK-002 VectorStore
  Day 4:   TASK-003 Adapter 模式
  Day 5:   TASK-004 Token Budget + TASK-005 Benchmark

Week 2 (验证 + Phase 2):
  Day 1-2: 运行 Benchmark，分析结果
  Day 3-4: TASK-006 简单词法检索
  Day 5:   TASK-007 混合评分

Week 3+ (Phase 3，可选):
  TASK-008 压缩器
  TASK-009 时间锚定
```

---

## 🚨 回滚策略

1. **Feature Flag**：`ENABLE_SIMPLEMEM=true/false`
2. **Shadow Mode**：默认开启，新系统只记录不生效
3. **一键切回**：Adapter 切换到纯 legacy 模式
4. **索引可重建**：从 `memories.json` 重建向量索引

---

## 📚 参考资源

- [SimpleMem 仓库](https://github.com/kckylechen1/SimpleMem)
- [LanceDB 文档](https://lancedb.github.io/lancedb/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)

---

**审查 Agent**: 🟣 Amp (Oracle)  
**执行 Agent**: 🟢 Codex
