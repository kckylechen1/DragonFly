# Agent-图表集成系统详细设计文档

> **文档版本**: v1.0  
> **创建日期**: 2026-02-01  
> **适用对象**: 产品经理、前端开发、后端开发、AI工程师  
> **文档状态**: 设计中

---

## 📋 文档概览

### 核心目标

构建一个**AI驱动的股票分析系统**，实现：

1. **智能意图识别** - Agent能判断用户想要闲聊、快速建议还是深度分析
2. **自适应响应** - 根据意图动态调整回答长度、数据查询量和输出格式
3. **图表交互** - Agent能在股票图表上直接标记买卖点、高亮区间、缩放定位
4. **自我进化** - Agent能从每次对话中学习，优化策略，无需人工重新训练

### 当前问题（已诊断）

#### 问题1: 响应过载

**症状**:

- 用户问"黄金为什么跌"，Agent输出1850字报告
- 包含10+技术指标、资金分析、操作建议、风险提示
- 用户真正想看的可能只是2句话的原因

**根因**:

- 缺乏**意图分层** - 所有问题都用同一套"深度分析"流程
- 没有**响应限制** - 没有maxChars或工具数量限制
- 假设过度 - Agent假设用户要的就是完整报告

#### 问题2: 格式僵化

**症状**:

- 不管问什么，都是「行情→指标→资金→建议」固定结构
- 过度使用emoji和口语化表达（"哥们儿"、"别慌"）
- 专业场景缺乏专业感

**根因**:

- System Prompt没有定义不同场景的格式规范
- 缺乏语气控制（greeting vs analysis的语气不同）

#### 问题3: 图表与Agent割裂

**症状**:

- Agent分析完股票，图表上没有任何标记
- 用户需要自己在图表上找Agent提到的"MACD金叉"位置
- 买卖点无法可视化

**根因**:

- 没有图表标记的API和工具
- Agent无法操作前端图表组件

---

## 🏗️ 核心架构设计

### 参考架构: OpenClaw Agent Loop

借鉴OpenClaw的设计理念，我们的Agent遵循以下生命周期：

```
用户输入
    ↓
[意图识别层] → 判断: greeting | quick | deep
    ↓
[上下文组装] → 加载历史记忆、用户偏好
    ↓
[模型推理] → LLM生成回复 + 工具调用决策
    ↓
[工具执行] → 查询数据、计算指标、标记图表
    ↓
[响应塑形] → 根据意图裁剪、格式化输出
    ↓
[流式输出] → 渐进式展示（非一次性dump）
    ↓
[持久化] → 记录对话到memory、更新学习数据
```

### 设计原则

#### 1. 意图分层（Intent Layering）

**三层意图分类**:

| 意图类型     | 触发条件                                 | 响应策略             | 数据查询 | 图表操作 | 最大长度 |
| ------------ | ---------------------------------------- | -------------------- | -------- | -------- | -------- |
| **greeting** | 问候语（"hi"、"你好"、"在吗"）           | 简短友好，无数据     | 0个工具  | ❌       | 100字    |
| **quick**    | 快速问题（"怎么办"、"建议"、"能买吗"）   | 直接给结论+2-3点理由 | ≤2个工具 | ❌       | 300字    |
| **deep**     | 深度分析（"分析一下"、"详细"、"技术面"） | 完整结构化报告       | 全套工具 | ✅       | 2000字   |

**意图判断规则**:

```typescript
// System Prompt中的判断逻辑
if (query.length < 10 && isGreetingKeyword(query)) {
  return "greeting";
}
if (containsKeywords(query, ["分析", "深度", "详细", "技术面", "基本面"])) {
  return "deep";
}
if (containsKeywords(query, ["怎么办", "建议", "能买吗", "怎么看"])) {
  return "quick";
}
```

#### 2. 渐进式披露（Progressive Disclosure）

**不要一次性给所有信息**:

```
用户: "黄金为什么跌？"
↓
Agent: "可能和国际金价回调有关。你想了解：\n1. 具体原因分析\n2. 我的操作建议"
↓
用户选择: "具体原因"
↓
Agent: 查询数据 → 输出300字分析
↓
Agent: "需要我在图表上标出关键点位吗？[标出] [不用了]"
↓
用户点击: "标出"
↓
Agent: 调用 add_chart_markers → 图表显示标记
```

#### 3. 显式记忆系统（Explicit Memory）

**不依赖隐式学习，使用显式记忆文件**:

```
memory/
├── 2026-02-01.md          # 每日原始对话记录
├── 2026-01-31.md          # 昨天记录
└── MEMORY.md              # 人工整理的长期记忆（策略优化）
```

**记忆内容示例**:

```markdown
# 2026-02-01.md

## 对话记录

### 10:30 - 用户询问黄金大跌

- 用户问题: "黄金为什么跌？"
- Agent响应: 1850字完整报告（❌ 过度响应）
- 用户反馈: 未读完（通过滚动行为判断）
- 教训: 应该先用quick模式给简要回答

### 14:20 - 用户要求分析300308

- 用户问题: "分析一下300308"
- Agent响应: 深度分析报告 + 图表标记（✅ 正确）
- 标记效果: 用户点击了2个买入信号标记查看详情
- 成功模式: MACD金叉+成交量放大组合信号

## 今日学习总结

1. 对于"为什么"类问题，先给2句话简要回答，再询问是否需要展开
2. 图表标记需要支持点击交互显示详情
3. 用户偏好在10:30查看股票（可能在开盘前）
```

**Heartbeat机制**（每晚02:00执行）:

```typescript
// 自动回顾记忆，更新策略
const heartbeat = {
  reviewDailyMemories: true, // 回顾今日对话
  identifyPatterns: true, // 识别成功/失败模式
  updateStrategyWeights: true, // 更新策略权重
  cleanOldData: true, // 清理过期数据
  updateMemoryMd: true, // 更新长期记忆
};
```

#### 4. 何时说话 vs 保持静默（Know When to Speak）

**回应时机**:

- ✅ 用户直接提及或提问
- ✅ 能添加有价值的信息（新数据、新视角）
- ✅ 用户要求图表标记或操作建议

**保持静默**:

- ❌ 只是闲聊（"今天天气不错"）
- ❌ 已经有人回答了（在群聊场景中）
- ❌ 回复只是"好的"、"明白"等无意义确认

---

## 🔧 图表标记系统详细设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ AIChatPanel │  │ StockChart   │  │ ScreenerPanel    │   │
│  │ (对话界面)   │  │ (图表组件)    │  │ (筛选结果)        │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼────────────────┼───────────────────┼─────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        状态管理层                             │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │ ChatStore        │  │ ChartMarkersStore               │  │
│  │ - messages       │  │ - markersBySymbol               │  │
│  │ - isLoading      │  │ - highlightsBySymbol            │  │
│  │ - sessionId      │  │ - zoomRequest                   │  │
│  └──────────────────┘  │ - setMarkers()                  │  │
│                        │ - clearMarkers()                │  │
│                        └─────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        服务层 (SSE)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   useAIStream Hook                    │  │
│  │  - startStream()                                      │  │
│  │  - 处理StreamEvent:                                   │  │
│  │    · "content" → 更新chatStore                        │  │
│  │    · "chart_markers" → 更新chartMarkersStore          │  │
│  │    · "chart_highlight" → 更新highlights               │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        后端Agent层                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  AgentOrchestrator                    │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │ ResearchAgent│ │ AnalysisAgent│ │ BacktestAgent│  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        数据层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 股票行情API  │  │ 技术指标计算 │  │ 资金流向数据 │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 核心类型定义

#### StreamEvent扩展

```typescript
// shared/stream.ts

export type StreamEventType =
  | "thinking"
  | "tool_call"
  | "tool_result"
  | "content"
  | "chart_markers" // ← 新增：图表标记事件
  | "chart_highlight" // ← 新增：区间高亮事件
  | "chart_zoom" // ← 新增：缩放定位事件
  | "error"
  | "done";

// 图表标记定义
export interface ChartMarker {
  time: number; // Unix timestamp (秒)
  position: "aboveBar" | "belowBar" | "inBar";
  color: string; // 'green' | 'red' | '#ef4444'
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text?: string; // 显示的文本，如"金叉买入"
  size?: 0 | 1 | 2; // 标记大小

  // 交互详情（点击标记时显示）
  details?: {
    title: string; // 弹窗标题
    summary: string; // 简要说明
    indicators: {
      name: string;
      value: string;
      signal: "bullish" | "bearish" | "neutral";
    }[];
    rationale: string[]; // 判断依据
    suggestion: string; // 操作建议
    confidence: number; // 置信度 0-100
  };
}

// 区间高亮定义
export interface HighlightRange {
  startTime: number;
  endTime: number;
  color: string; // 背景色，如 'rgba(255,0,0,0.1)'
  label?: string; // 标签，如"震荡区间"
}

// 事件数据结构
export interface ChartMarkersEvent {
  symbol: string;
  markers: ChartMarker[];
  clearExisting?: boolean; // 是否清除之前的标记
}
```

### Agent工具设计

#### 1. add_chart_markers（添加图表标记）

```typescript
// server/_core/agent/agents/analysis-agent.ts

const ANALYSIS_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "add_chart_markers",
      description: `在股票图表上添加技术分析标记（买卖点、信号等）。
        当分析发现明显的交易信号时使用。
        标记会实时显示在用户正在查看的图表上。`,
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "股票代码，如 '300308'",
          },
          markers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time: { type: "number", description: "Unix时间戳（秒）" },
                position: {
                  type: "string",
                  enum: ["aboveBar", "belowBar", "inBar"],
                  description: "aboveBar=卖出信号, belowBar=买入信号",
                },
                signalType: {
                  type: "string",
                  enum: [
                    "macd_golden_cross", // MACD金叉
                    "macd_death_cross", // MACD死叉
                    "ma_breakthrough", // 均线突破
                    "support_bounce", // 支撑反弹
                    "resistance_rejection", // 阻力遇阻
                    "top_divergence", // 顶背离
                    "pattern_break", // 形态突破
                  ],
                  description: "信号类型（决定颜色样式）",
                },
                text: { type: "string", description: "显示文字" },
                details: {
                  type: "object",
                  description: "点击标记时显示的详细信息",
                },
              },
              required: ["time", "position", "signalType"],
            },
          },
          clearExisting: {
            type: "boolean",
            description: "是否清除之前的标记",
          },
        },
        required: ["symbol", "markers"],
      },
    },
  },
];
```

**样式预定义库**:

```typescript
// 前端样式库，Agent只需选signalType
const MARKER_STYLES = {
  macd_golden_cross: {
    color: "#22c55e",
    shape: "arrowUp",
    position: "belowBar",
    size: 2,
  },
  macd_death_cross: {
    color: "#ef4444",
    shape: "arrowDown",
    position: "aboveBar",
    size: 2,
  },
  // ... 其他信号类型
};
```

#### 2. highlight_chart_range（区间高亮）

```typescript
{
  name: "highlight_chart_range",
  description: "在图表上高亮显示特定区间（震荡区间、上升通道等）",
  parameters: {
    symbol: { type: "string" },
    ranges: {
      type: "array",
      items: {
        startTime: { type: "number" },
        endTime: { type: "number" },
        color: { type: "string" },
        label: { type: "string" }
      }
    }
  }
}
```

#### 3. zoom_chart_to_range（缩放定位）

```typescript
{
  name: "zoom_chart_to_range",
  description: "调整图表显示范围，聚焦到特定时间段",
  parameters: {
    symbol: { type: "string" },
    from: { type: "number", description: "起始时间戳" },
    to: { type: "number", description: "结束时间戳" }
  }
}
```

### 前端状态管理

#### ChartMarkersStore

```typescript
// client/src/refactor_v2/stores/chartMarkers.store.ts

import { create } from "zustand";

interface ChartMarker {
  time: number;
  position: "aboveBar" | "belowBar" | "inBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text?: string;
  size?: 0 | 1 | 2;
  details?: ChartMarkerDetails;
}

interface HighlightRange {
  startTime: number;
  endTime: number;
  color: string;
  label?: string;
}

interface ChartMarkersState {
  markersBySymbol: Record<string, ChartMarker[]>;
  highlightsBySymbol: Record<string, HighlightRange[]>;
  zoomRequest: { symbol: string; from: number; to: number } | null;

  setMarkers: (
    symbol: string,
    markers: ChartMarker[],
    clearExisting?: boolean
  ) => void;
  clearMarkers: (symbol: string) => void;
  addHighlight: (symbol: string, range: HighlightRange) => void;
  clearHighlights: (symbol: string) => void;
  setZoomRequest: (symbol: string, from: number, to: number) => void;
  clearZoomRequest: () => void;
}

export const useChartMarkersStore = create<ChartMarkersState>(set => ({
  markersBySymbol: {},
  highlightsBySymbol: {},
  zoomRequest: null,

  setMarkers: (symbol, markers, clearExisting = false) => {
    set(state => ({
      markersBySymbol: {
        ...state.markersBySymbol,
        [symbol]: clearExisting
          ? markers
          : [...(state.markersBySymbol[symbol] || []), ...markers],
      },
    }));
  },

  clearMarkers: symbol => {
    set(state => {
      const { [symbol]: _, ...rest } = state.markersBySymbol;
      return { markersBySymbol: rest };
    });
  },

  addHighlight: (symbol, range) => {
    set(state => ({
      highlightsBySymbol: {
        ...state.highlightsBySymbol,
        [symbol]: [...(state.highlightsBySymbol[symbol] || []), range],
      },
    }));
  },

  setZoomRequest: (symbol, from, to) => {
    set({ zoomRequest: { symbol, from, to } });
  },

  clearZoomRequest: () => {
    set({ zoomRequest: null });
  },
}));
```

### StockChart组件增强

```typescript
// client/src/refactor_v2/components/StockChart.tsx

import {
  createChart,
  createSeriesMarkers,
  type ISeriesMarkersPluginApi,
  type Time,
} from "lightweight-charts";
import { useChartMarkersStore } from "@/refactor_v2/stores/chartMarkers.store";

export const StockChart: React.FC<StockChartProps> = ({
  data,
  height = 400,
  activePeriod = "1D",
  onPeriodChange,
}) => {
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const currentSymbol = useWatchlistStore(state => state.currentSymbol);

  // 监听标记变化
  useEffect(() => {
    const unsubscribe = useChartMarkersStore.subscribe(
      state => state.markersBySymbol[currentSymbol],
      markers => {
        if (!candlestickSeriesRef.current) return;

        // 清除旧标记
        if (markersPluginRef.current) {
          markersPluginRef.current.detach();
        }

        if (markers && markers.length > 0) {
          // 创建新标记
          markersPluginRef.current = createSeriesMarkers(
            candlestickSeriesRef.current,
            markers.map(m => ({
              time: m.time as Time,
              position: m.position,
              color: m.color,
              shape: m.shape,
              text: m.text,
              size: m.size,
            }))
          );
        }
      }
    );

    return () => unsubscribe();
  }, [currentSymbol]);

  // 监听缩放请求
  useEffect(() => {
    const unsubscribe = useChartMarkersStore.subscribe(
      state => state.zoomRequest,
      zoomRequest => {
        if (!zoomRequest || zoomRequest.symbol !== currentSymbol) return;
        if (!chartRef.current) return;

        chartRef.current.timeScale().setVisibleRange({
          from: zoomRequest.from as Time,
          to: zoomRequest.to as Time,
        });

        useChartMarkersStore.getState().clearZoomRequest();
      }
    );

    return () => unsubscribe();
  }, [currentSymbol]);

  // 图表点击交互
  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.subscribeClick(param => {
      if (!param.point || !param.time) return;

      // 查找该时间点的标记
      const marker = findMarkerAtTime(param.time as number);
      if (marker?.details) {
        openMarkerDetails(marker.details);
      }
    });
  }, []);

  // ... 其余现有代码
};
```

### SSE事件处理

```typescript
// client/src/refactor_v2/hooks/useAIStream.ts

export function useAIStream() {
  const startStream = useCallback(
    (message: string, options?: StreamOptions) => {
      const eventSource = new EventSource(url);

      eventSource.onmessage = event => {
        const data = JSON.parse(event.data) as StreamEvent;

        switch (data.type) {
          case "content":
            // 更新对话内容
            appendToChat(data.data);
            break;

          case "chart_markers":
            // 分发到ChartMarkers Store
            const { symbol, markers, clearExisting } = data.data;
            useChartMarkersStore
              .getState()
              .setMarkers(symbol, markers, clearExisting);
            break;

          case "chart_highlight":
            const { symbol, ranges } = data.data;
            ranges.forEach((range: HighlightRange) => {
              useChartMarkersStore.getState().addHighlight(symbol, range);
            });
            break;

          case "chart_zoom":
            const { symbol, from, to } = data.data;
            useChartMarkersStore.getState().setZoomRequest(symbol, from, to);
            break;
        }
      };
    },
    []
  );
}
```

---

## 🧠 自我进化机制设计

### 三层进化体系

#### 第一层：工具生成层（Tool Generation）

**概念**: Agent 不应只有预定义工具，而应该能**编写代码创建新工具**

**场景**:

```
用户：找出资金流入前10 + MACD金叉的股票

Agent 思考：
1. 我没有"screen_stocks"工具
2. 但我有基础能力：数据库查询、指标计算、排名算法
3. 让我动态写一个 screening 工具

Agent 调用 CodeGen Agent → 生成 screening 工具代码 → 注册并执行
```

**实现**:

- **代码生成 Agent**: 专门负责写代码的 LLM
- **安全沙箱**: QuickJS/WebAssembly 中运行生成代码
- **工具生命周期**: 需求 → 代码生成 → 自动注册 → 执行 → 验证 → 保存/丢弃

#### 第二层：策略学习层（Strategy Learning）

**记忆系统**:

```
长期记忆（MEMORY.md）:
- 成功的分析模式（加权使用）
- 用户偏好的信号组合
- 市场状态下的有效策略

工作记忆（当前对话）:
- 近期尝试的方法
- 当前图表的标记历史
```

**学习机制**:

**1. 显式反馈学习**:

```
用户：标记不准确
Agent：记录这次失败 → 调整参数 → 下次避免

用户：这个分析很准！
Agent：记录成功模式 → 加权使用 → 强化学习
```

**2. 隐式观察学习**:

```
观察用户行为：
- 经常点击"买入信号" → 用户关注入场点
- 从不点击"观望信号" → 这类标记可以弱化
- 特定时间段查看图表 → 记住这个习惯
```

**3. 类比迁移学习**:

```
学会分析300308后 → 迁移到其他科技股
学会MACD策略后 → 自动尝试MACD+RSI组合
```

#### 第三层：图表意图理解层（Chart Intent）

**动态标记优先级**:

```
Agent 分析后得到10个信号：
- 但图表上显示太多会混乱
- Agent 需要学会"什么是关键信号"

学习维度：
1. 时间集中度（近期信号 > 历史信号）
2. 信号强度（金叉+放量 > 单独金叉）
3. 用户关注度（常点击的类型 > 很少点击的）
4. 成功率（历史上这类信号的胜率）
```

### 进化触发机制

#### 1. 每日进化循环（Heartbeat）

```typescript
// 每晚 02:00 执行
const nightlyEvolution = {
  steps: [
    "1. 回顾当天的所有对话（读取 memory/2026-02-01.md）",
    "2. 识别成功的分析 vs 失败的分析",
    "3. 统计各策略的成功率",
    "4. 生成新的策略变体",
    "5. A/B测试新策略（小部分对话使用）",
    "6. 评估效果，保留好的策略",
    "7. 更新 MEMORY.md",
  ],
};
```

#### 2. 用户个性化进化

```typescript
// 每个用户有独立的偏好向量
interface UserProfile {
  timePreference: "short_term" | "long_term"; // 短线 vs 长线
  indicatorPreference: string[]; // ['MACD', 'KDJ']
  riskTolerance: "high" | "medium" | "low"; // 风险偏好
  activeHours: number[]; // [9, 10, 14] 活跃时段
  preferredSymbols: string[]; // 常看的股票
}

// Agent 根据用户画像调整策略
if (userProfile.timePreference === "short_term") {
  // 关注15分钟图，标记短线突破点
} else {
  // 关注周线，标记长期支撑位
}
```

#### 3. 群体智慧进化（共享学习）

```typescript
// 多个用户的 Agent 共享学习（脱敏后）
const crowdLearning = {
  observation: "80%的用户在查看'MACD金叉+放量'信号后点击了详情",
  inference: "这是一个高价值信号",
  action: "升级所有 Agent 的优先级权重",
};
```

### 噪声纠正方案

**问题**: Agent 学了错误的东西（把噪声当信号）

**三层防护**:

**1. 版本控制（可回滚）**:

```
策略版本:
- v1.2: MACD金叉权重 0.8
- v1.3: MACD金叉权重 0.9（学习后提升）
- v1.4: MACD金叉权重 0.7（发现过拟合，回滚）
```

**2. 人工干预（遗忘机制）**:

```
用户说：忘掉今天的学习
Agent：回滚到昨日策略版本
```

**3. 自动检测（异常识别）**:

```
if (newStrategy.winRate < baselineStrategy.winRate * 0.7) {
  // 新策略表现远低于基线
  // 自动回滚并标记为"负样本"
  rollbackStrategy();
}
```

---

## 📊 实现优先级

### P0 - 核心功能（MVP）

| 功能                              | 优先级 | 预计工时 | 负责人   |
| --------------------------------- | ------ | -------- | -------- |
| 意图识别层（greeting/quick/deep） | P0     | 4h       | AI工程师 |
| System Prompt改进                 | P0     | 2h       | AI工程师 |
| StreamEvent类型扩展               | P0     | 2h       | 后端开发 |
| add_chart_markers工具             | P0     | 4h       | 后端开发 |
| ChartMarkersStore                 | P0     | 3h       | 前端开发 |
| StockChart标记集成                | P0     | 4h       | 前端开发 |
| SSE事件分发                       | P0     | 2h       | 前端开发 |

**验收标准**:

- 用户问"hi" → 100字内简短回复，不查数据
- 用户问"分析一下" → 完整报告 + 图表上出现标记
- 标记可点击显示详情

### P1 - 增强体验

| 功能                      | 优先级 | 预计工时 | 负责人   |
| ------------------------- | ------ | -------- | -------- |
| highlight_chart_range工具 | P1     | 3h       | 后端开发 |
| zoom_chart_to_range工具   | P1     | 2h       | 后端开发 |
| 标记详情弹窗              | P1     | 3h       | 前端开发 |
| 区间高亮渲染              | P1     | 4h       | 前端开发 |
| 记忆系统（memory文件）    | P1     | 4h       | 后端开发 |
| 用户反馈收集              | P1     | 2h       | 前端开发 |

**验收标准**:

- Agent能高亮"震荡区间"
- 用户说"太啰嗦" → 记录到memory
- 标记点击显示详细分析

### P2 - 高级功能

| 功能           | 优先级 | 预计工时 | 负责人   |
| -------------- | ------ | -------- | -------- |
| 趋势线绘制工具 | P2     | 6h       | 后端开发 |
| 技术指标叠加   | P2     | 8h       | 后端开发 |
| 多周期联动     | P2     | 6h       | 前端开发 |
| Heartbeat机制  | P2     | 6h       | 后端开发 |
| 策略进化系统   | P2     | 12h      | AI工程师 |
| 代码生成Agent  | P2     | 16h      | AI工程师 |

**验收标准**:

- Agent能自动画支撑/压力线
- 每晚自动回顾并优化策略
- 能动态生成新工具

---

## 🎯 用户体验流程示例

### 场景1：渐进式分析

```
用户: 分析一下300308

Agent:
"中际旭创(300308)技术面显示强势，MACD金叉且资金净流入。

你想看：
1. 详细技术指标分析
2. 资金流向深度解析
3. 我的操作建议"

用户: 1

Agent:
"详细分析：
- MACD：DIF(1.23)上穿DEA(0.98)，红柱放大，强势金叉
- 均线：股价突破MA20/MA60，多头排列
- KDJ：K值65，未超买，还有空间

发现2个买入信号，需要在图表上标出吗？[标出] [不用]"

用户点击: 标出

Agent调用: add_chart_markers

图表变化: 出现2个绿色箭头
  - 位置1: 09:30 MACD金叉
  - 位置2: 14:00 放量突破

用户点击标记1 → 弹窗显示:
  标题: MACD金叉买入信号
  MACD指标: DIF 1.23, DEA 0.98, 红柱0.5 (bullish)
  成交量: 较前5日均量放大1.8倍 (bullish)
  判断依据: ...
  操作建议: 建议买入，止损位¥42.50
  置信度: 85%
```

### 场景2：快速建议

```
用户: 黄金大跌了怎么办

Agent:
"黄金板块大跌主要因国际金价回调+资金撤离。建议：
1. 持仓者设5%止损，跌破减仓
2. 空仓者观望，等企稳信号
3. 关注周一资金流向

需要详细分析某只具体黄金股吗？"

Agent没有: 输出1850字报告
Agent没有: 查询10个指标
Agent没有: 在图表上标记
```

### 场景3：策略进化

```
对话1:
用户: 分析一下
Agent: [输出1850字报告]
用户: [未读完就关闭]
→ Agent记录到memory: 过度响应

对话2:
用户: 分析一下
Agent: [试探性回复] "你想了解哪方面？"
用户: [选择详细分析]
Agent: [输出完整报告]
用户: [完整阅读并点击标记]
→ Agent记录到memory: 渐进式披露成功

Heartbeat（每晚02:00）:
Agent回顾记忆:
- 发现渐进式披露成功率80%
- 发现直接dump成功率30%
- 更新策略: 默认使用渐进式披露

对话3:
用户: 分析一下
Agent: [直接给出选项，不直接dump]
→ 成功率提升
```

---

## 🔍 技术注意事项

### 性能优化

**1. 标记数量控制**:

```typescript
// 标记过多时的处理策略
if (markers.length > 50) {
  // 策略1: 只显示关键信号（时间最近、强度最高）
  // 策略2: 合并相似信号（同一时间段内）
  // 策略3: 分页显示（用户点击"加载更多"）
}
```

**2. 时间戳对齐**:

```typescript
// Agent分析的数据时间戳必须与图表数据对齐
// 注意时区统一使用Unix timestamp（秒）
const chartTime = Math.floor(new Date("2025-02-01 10:30:00").getTime() / 1000);
```

**3. 错误处理**:

```typescript
// 如果时间戳在图表数据范围外，lightweight-charts会自动忽略
// 前端需要有graceful降级
if (
  marker.time < chartData[0].time ||
  marker.time > chartData[chartData.length - 1].time
) {
  console.warn("Marker时间超出图表范围，已忽略");
  return;
}
```

### 安全考虑

**1. 工具权限控制**:

- `add_chart_markers`: 只读操作，安全
- `highlight_chart_range`: 只读操作，安全
- 代码生成工具: 在沙箱中运行，限制文件系统访问

**2. 数据隐私**:

- 用户memory文件存储在本地
- 群体学习时数据脱敏（去除用户ID、具体股票代码）

---

## 📚 参考文档

### OpenClaw参考

- [Agent Loop](https://docs.openclaw.ai/concepts/agent-loop)
- [System Prompt](https://docs.openclaw.ai/concepts/system-prompt)
- [AGENTS.md Template](https://docs.openclaw.ai/reference/templates/AGENTS)
- [Memory System](https://github.com/openclaw/openclaw/blob/main/docs/reference/templates/AGENTS.md)

### Lightweight Charts参考

- [Series Markers](https://tradingview.github.io/lightweight-charts/docs/api/functions/createSeriesMarkers)
- [Getting Started](https://tradingview.github.io/lightweight-charts/docs)

---

## ✅ 验收清单

### 开发前

- [ ] 确认需求范围（P0/P1/P2）
- [ ] 分配开发人员
- [ ] 确定技术方案评审时间

### 开发中

- [ ] P0功能完成
- [ ] 单元测试通过
- [ ] TypeScript类型检查通过
- [ ] 代码审查完成

### 发布后

- [ ] 用户反馈收集机制就位
- [ ] 监控Agent响应长度分布
- [ ] 监控图表标记点击率
- [ ] Heartbeat机制运行正常

---

## 💬 附录：对话示例（改进前后对比）

### 改进前（当前问题）

```
用户: 黄金为什么跌？

Agent: [立即查询10个工具]
[输出1850字报告，包含]
- 行情数据（200字）
- 技术指标：MACD、KDJ、RSI、均线（400字）
- 资金流向：主力、超大单、大单（300字）
- 支撑阻力分析（200字）
- 综合研判（300字）
- 操作建议（300字）
- 风险提示（150字）

用户: [只读了前50字就关闭]
```

### 改进后（目标效果）

```
用户: 黄金为什么跌？

Agent: "可能和国际金价回调有关。你想了解：
1. 具体原因分析
2. 我的操作建议"

用户: 1

Agent: "具体原因：
- 国际金价回调（美联储信号）
- 资金撤离476亿（主力流出）
- 估值偏高（PE>40）

需要我在图表上标出关键点位吗？[标出] [不用]"

用户点击: 标出

[图表上出现标记]
```

**改进点**:

- ✅ 意图识别: quick模式
- ✅ 渐进披露: 先试探，再深入
- ✅ 响应长度: 300字以内（第一阶段）
- ✅ 图表交互: 用户确认后才标记
- ✅ 工具使用: 只查2个核心工具（而非10个）

---

**文档结束**

如有疑问，请联系：AI架构师（就是你大哥我）😎
