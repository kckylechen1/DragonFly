# 📄 Phase 2: PageIndex 集成 - 研报/财报精准检索

> **状态**: 🔜 待启动（SimpleMem 完成后）  
> **优先级**: ⭐⭐⭐⭐  
> **预计时长**: 1 周  
> **前置条件**: SimpleMem 集成完成

---

## 📝 背景

当用户问「长城汽车的核心竞争力是什么？」时，需要从年报/研报中精准检索，而不是让 LLM 凭记忆回答。

**PageIndex 优势**:
- 98.7% 准确率（FinanceBench 基准）
- 树形结构索引，保留文档原始层级
- LLM 推理驱动检索，不依赖向量相似度

---

## ✅ Done Definition

- [ ] PDF 年报自动解析为树形索引
- [ ] 用户可按股票代码检索财报数据
- [ ] 检索结果可追溯到具体页码
- [ ] 与 Agent 分析流程集成

---

## 📊 任务列表

### TASK-P01: PageIndex 服务部署
**时长**: 3-4h

```bash
# 作为独立微服务部署
cd PageIndex
pip install -r requirements.txt
python -m pageindex.server --port 8001
```

---

### TASK-P02: PDF 预处理管道
**时长**: 4-6h

```typescript
// 为每个关注股票预处理年报
interface PDFProcessor {
  // 下载年报
  downloadAnnualReport(stockCode: string, year: number): Promise<string>;
  
  // 生成树形索引
  generateTreeIndex(pdfPath: string): Promise<TreeStructure>;
  
  // 缓存索引
  cacheTreeStructure(stockCode: string, year: number, tree: TreeStructure): void;
}
```

---

### TASK-P03: 树搜索 API
**时长**: 4-6h

```typescript
interface PageIndexClient {
  // 在指定股票的年报中搜索
  search(stockCode: string, query: string): Promise<SearchResult[]>;
  
  // 返回相关页面内容 + 页码 + 推理路径
}

interface SearchResult {
  pageNumbers: number[];
  content: string;
  reasoningPath: string[];  // 推理过程
  confidence: number;
}
```

---

### TASK-P04: Agent 集成
**时长**: 3-4h

```typescript
// 新增工具: get_annual_report_data
const tools = [
  {
    name: "get_annual_report_data",
    description: "从年报中检索具体财务数据或公司信息",
    parameters: {
      stockCode: { type: "string" },
      query: { type: "string" },
    },
    handler: async ({ stockCode, query }) => {
      return await pageIndexClient.search(stockCode, query);
    },
  },
];
```

---

## 📁 文件结构

```
server/_core/
├── pageindex/                   # 新增目录
│   ├── index.ts                 # PageIndex 客户端
│   ├── pdf-processor.ts         # PDF 处理
│   ├── tree-cache.ts            # 树结构缓存
│   └── types.ts                 # 类型定义
└── stockTools.ts                # 修改：添加 get_annual_report_data
```

---

## 🗓️ 执行计划

| 天数 | 任务 |
|------|------|
| Day 1 | TASK-P01: 部署 PageIndex 服务 |
| Day 2-3 | TASK-P02: PDF 预处理管道 |
| Day 4 | TASK-P03: 树搜索 API |
| Day 5 | TASK-P04: Agent 集成 + 测试 |

---

## ⚠️ 注意事项

1. **PDF 处理成本**: GPT-4o 调用较贵，预处理后缓存结果
2. **存储空间**: 每个年报的树结构约 100KB-1MB
3. **延迟**: 首次解析慢（分钟级），检索快（秒级）

---

**依赖**: SimpleMem 集成完成后再启动此 Epic
