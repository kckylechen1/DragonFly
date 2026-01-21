# 🟢 Codex 代码质量提升任务指南

> **负责 Agent**: Codex (GPT-5.2)  
> **任务来源**: Codex + Amp Code Review (2026-01-21)  
> **优先级**: 按紧急程度排序执行

---

## ⚠️ 最重要的规则

```
1. 按 AI-COLLAB-PLAYBOOK 工作
2. 每完成一个任务运行 pnpm check 验证
3. 遇到问题立即停下，记录在本文件末尾，不要猜测
4. 使用 context7 MCP 查询库文档
5. 不要修改 GLM 负责的文件（参见文件所有权）
```

---

## 📋 当前状态

- ✅ `pnpm check` 通过
- ✅ `tsconfig.json` 已排除 `experiments/`, `scripts/`, `agent/` 目录
- ✅ SSE 端点已实现 (`GET/POST /api/ai/stream`)
- ⚠️ 需要改进的问题如下

---

## 📋 任务清单（按优先级排序）

### 🔴 P-1: 旧代码清理 [FIRST]

#### CDX-CLEAN-001: 删除旧 UI 代码 ⏱️ 30min

**背景**：用户确认 `refactor_v2` 已完全替换旧 UI，可以删除

**待删除目录/文件**：

```
client/src/
├── components/          # 81 个旧组件 → 删除
│   ├── ui/              # 54 个 shadcn 组件
│   ├── stock/           # 11 个股票组件
│   ├── ai/              # 4 个 AI 组件
│   ├── market/          # 3 个市场组件
│   ├── layout/          # 1 个布局组件
│   └── *.tsx            # 8 个根级组件
├── contexts/            # 旧 ThemeContext → 删除
├── pages/               # 3 个旧页面 → 删除
│   ├── Home.tsx
│   ├── NotFound.tsx
│   └── StockDetail.tsx
├── hooks/               # 6 个旧 hooks → 删除 (检查是否被 refactor_v2 使用)
├── App.tsx              # 旧入口 → 删除
└── index.css            # 旧样式 → 删除
```

**执行步骤**：

```bash
# 1. 先确认没有 refactor_v2 引用这些文件
grep -r "from '@/components" client/src/refactor_v2/
grep -r "from '@/contexts" client/src/refactor_v2/
grep -r "from '@/pages" client/src/refactor_v2/
grep -r "from '@/hooks" client/src/refactor_v2/

# 2. 如果无引用，执行删除
rm -rf client/src/components
rm -rf client/src/contexts
rm -rf client/src/pages
rm -rf client/src/hooks
rm client/src/App.tsx
rm client/src/index.css

# 3. 更新 main.tsx 入口指向 refactor_v2
```

**验证**：
```bash
pnpm check
pnpm build
```

---

#### CDX-CLEAN-002: 更新入口文件 ⏱️ 15min

**文件**: `client/src/main.tsx`

**修改**：确保完全使用 refactor_v2 的组件和路由

**验证**: `pnpm dev` 启动正常

---

### 🔴 P0: 关键安全问题 [CRITICAL]

#### CDX-SEC-001: AI 端点 CORS 限制 ⏱️ 30min

**问题**：`/api/ai/stream` 允许 `Access-Control-Allow-Origin: "*"`，任何网站都可调用 AI（成本风险）

**文件**: `server/_core/index.ts` (第 47, 185 行)

**修复方案**:

```typescript
// 在文件顶部定义
const ALLOWED_ORIGINS = process.env.NODE_ENV === "development" 
  ? ["http://localhost:3000", "http://localhost:5173"]
  : ["https://your-domain.com"]; // 生产环境限制

// 替换 res.setHeader("Access-Control-Allow-Origin", "*");
const origin = req.headers.origin;
if (origin && ALLOWED_ORIGINS.includes(origin)) {
  res.setHeader("Access-Control-Allow-Origin", origin);
}
```

**验证**: 
```bash
# 应该被拒绝
curl -H "Origin: https://evil.com" http://localhost:3000/api/ai/stream
```

---

#### CDX-SEC-002: AI 端点输入校验 ⏱️ 30min

**问题**：`message` 参数无长度限制，可能被滥用

**文件**: `server/_core/index.ts`

**修复方案**:

```typescript
// GET 端点（约第 69 行后添加）
const MAX_MESSAGE_LENGTH = 8000;
if (message.length > MAX_MESSAGE_LENGTH) {
  sendEvent({ type: "error", data: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` });
  res.end();
  return;
}

// POST 端点（约第 196 行后添加）
if (!messages || !Array.isArray(messages)) {
  res.write(`data: ${JSON.stringify({ error: "Invalid messages format" })}\n\n`);
  res.end();
  return;
}
```

**验证**: `pnpm check`

---

### 🟠 P1: Orchestrator 修复 [HIGH]

#### CDX-ORCH-001: 修复 Orchestrator 编译错误 ⏱️ 1h

**问题**：`orchestrator.ts` 有重复方法定义和结构错误

**文件**: `server/_core/agent/orchestrator.ts`

> ⚠️ 注意：此文件在 `tsconfig.json` 中被排除 (`server/_core/agent/**/*`)，所以不影响 `pnpm check`。但如果你需要修复它，请：

**步骤**:

1. 先读取文件，找到问题：
   ```bash
   cat server/_core/agent/orchestrator.ts | grep -n "getModelPreferenceForAgent"
   ```

2. 删除重复的 `getModelPreferenceForAgent` 方法（保留一份）

3. 修复多余的 `}` 括号

4. 统一 Agent 构造签名：
   ```typescript
   interface AgentConfig {
     sessionId?: string;
     stockCode?: string;
     verbose?: boolean;
     detailMode?: boolean;
     preferredModel?: ModelPreference;
   }
   
   // 在 createAgent 中
   const preferredModel = this.getModelPreferenceForAgent(type);
   return new AnalysisAgent({ ...baseConfig, preferredModel });
   ```

**验证**: 暂时从 `tsconfig.json` exclude 中移除 `server/_core/agent/**/*`，运行 `pnpm check`

---

### 🟡 P2: 性能优化 [MEDIUM]

#### CDX-PERF-001: StockChart 优化 ⏱️ 1.5h

**问题**：每次 data/theme 变化都重新创建 chart 实例

**文件**: `client/src/refactor_v2/components/StockChart.tsx` (约第 142, 337 行)

**修复方案**:

```typescript
// 分离初始化和更新
const chartRef = useRef<IChartApi | null>(null);

// 初始化 effect - 只运行一次
useEffect(() => {
  if (!chartContainerRef.current || chartRef.current) return;
  
  chartRef.current = createChart(chartContainerRef.current, {
    // 初始配置
  });
  
  return () => {
    chartRef.current?.remove();
    chartRef.current = null;
  };
}, []); // 空依赖

// 数据更新 effect
useEffect(() => {
  if (!chartRef.current || !data) return;
  // 只更新 series 数据，不重建 chart
  candlestickSeries.setData(data);
}, [data]);

// 主题更新 effect
useEffect(() => {
  if (!chartRef.current) return;
  chartRef.current.applyOptions({
    // 只更新主题相关配置
  });
}, [theme]);
```

**验证**: 浏览器测试，切换主题时 chart 不应闪烁/重建

---

#### CDX-PERF-002: Zustand Selectors 优化 ⏱️ 1h

**问题**：多个组件读取整个 store，导致不必要的重渲染

**文件**:
- `client/src/pages/Home.tsx` (第 11 行)
- `client/src/refactor_v2/components/LayoutShell.tsx` (第 37 行)
- `client/src/refactor_v2/components/LeftPane.tsx` (第 69 行)

**修复方案**:

```typescript
import { shallow } from "zustand/shallow";

// 替换
const store = useLayoutStore();

// 为
const { leftPanelOpen, rightPanelOpen } = useLayoutStore(
  state => ({
    leftPanelOpen: state.leftPanelOpen,
    rightPanelOpen: state.rightPanelOpen,
  }),
  shallow
);
```

**验证**: React DevTools Profiler 确认减少重渲染

---

#### CDX-PERF-003: 批量 Watchlist 查询 ⏱️ 1h

**问题**：每个 watchlist 行单独发起 10s 轮询查询

**文件**: 
- `client/src/refactor_v2/components/LeftPane.tsx` (第 34 行)
- `client/src/refactor_v2/api/stocks.ts` (第 5 行)

**修复方案**:

1. 创建批量查询接口：
   ```typescript
   // server/routers/stocks.ts
   batchQuotes: publicProcedure
     .input(z.object({ codes: z.array(z.string().regex(/^\d{6}$/)).max(50) }))
     .query(async ({ input }) => {
       // 批量获取，使用 Promise.all 但加并发限制
     }),
   ```

2. 前端使用单一查询：
   ```typescript
   // 在父组件查询所有股票
   const { data: quotesMap } = trpc.stocks.batchQuotes.useQuery(
     { codes: watchlist.map(s => s.code) },
     { refetchInterval: 10000 }
   );
   ```

**验证**: Network tab 确认只有一个批量请求

---

### 🟢 P3: 代码质量 [LOW]

#### CDX-TS-001: 消除 any 类型 ⏱️ 2h

**问题文件列表**:

| 文件 | 行号 | 问题 |
|------|------|------|
| `server/routers/stocks.ts` | 175, 228, 260 | `any[]` 类型 |
| `server/db.ts` | 158, 217, 248 | `any` 参数 |
| `server/eastmoney.ts` | 多处 | `item: any` |

**修复方案**:

1. 在 `shared/types.ts` 定义强类型：
   ```typescript
   export interface KlineBar {
     time: number;
     open: number;
     high: number;
     low: number;
     close: number;
     volume: number;
   }
   
   export interface TimelinePoint {
     time: string;
     price: number;
     avgPrice: number;
     volume: number;
     change: number;
     changePercent: number;
   }
   ```

2. 逐步替换 `any[]` 为具体类型

**验证**: `pnpm check` + 搜索确认 `any` 数量减少

---

#### CDX-TS-002: tRPC 输入校验统一 ⏱️ 1h

**问题**：部分接口用自定义 `unknown` parser 而非 zod

**文件**: `server/routers/stocks.ts`

**修复方案**:

```typescript
// 替换
.input((val: unknown) => {
  if (typeof val === "object" && val && "code" in val) {
    return val as { code: string };
  }
  throw new Error("Invalid input");
})

// 为
.input(z.object({ 
  code: z.string().regex(/^\d{6}$/, "Invalid stock code format") 
}))
```

**验证**: `pnpm check`

---

#### CDX-FIX-001: Tooltip 零值显示 ⏱️ 15min

**问题**：`StockChart.tsx` tooltip 用 truthy 检查，零值被隐藏

**文件**: `client/src/refactor_v2/components/StockChart.tsx` (约第 425 行)

**修复方案**:

```typescript
// 替换
if (value) { ... }

// 为
if (typeof value === "number") { ... }
```

**验证**: 显示包含 0 值的数据点，确认 tooltip 正常

---

## 📁 文件所有权声明

### ✅ 本任务拥有 (可修改)
- `server/_core/index.ts`
- `server/_core/agent/orchestrator.ts`
- `server/routers/stocks.ts`
- `server/db.ts`
- `server/eastmoney.ts`
- `client/src/refactor_v2/components/StockChart.tsx`
- `client/src/refactor_v2/components/LeftPane.tsx`
- `client/src/refactor_v2/api/stocks.ts`
- `shared/types.ts`

### 🚫 禁止触碰 (GLM 负责)
- `client/src/refactor_v2/components/FloatingAIChatInput.tsx`
- `client/src/refactor_v2/components/AIChatPanel.tsx`
- `client/src/refactor_v2/stores/aiChat.store.ts`
- `server/_core/analysis/stock-analysis-framework.ts`

---

## ✅ 完成检查清单

```
P-1 清理:
[ ] CDX-CLEAN-001: 删除旧 UI 代码
[ ] CDX-CLEAN-002: 更新入口文件

P0 安全:
[ ] CDX-SEC-001: CORS 限制
[ ] CDX-SEC-002: 输入校验

P1 修复:
[ ] CDX-ORCH-001: Orchestrator 编译

P2 性能:
[ ] CDX-PERF-001: StockChart 优化
[ ] CDX-PERF-002: Zustand Selectors
[ ] CDX-PERF-003: 批量查询

P3 代码质量:
[ ] CDX-TS-001: 消除 any
[ ] CDX-TS-002: tRPC 输入统一
[ ] CDX-FIX-001: Tooltip 零值

总体完成度: 0/11 任务 (0%)
```

---

## 🛑 阻塞处理

如果遇到以下情况，**立即停下并在下方记录**:

1. **orchestrator.ts 结构太乱** - 先跳过，继续其他任务
2. **类型定义冲突** - 记录冲突文件
3. **测试失败** - 记录失败原因

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

1. 确保 `pnpm check` 通过
2. 提交代码:
```bash
git add -A
git commit -m "fix: 代码质量提升 - 安全/性能/类型"
```

---

## 🔖 Review 来源

本任务基于以下 review 创建：

1. **Codex Review** (2026-01-21)
   - tsconfig experiments 问题 ✅ 已解决
   - 主题系统重复
   - StockChart 重建
   - Zustand selectors

2. **Amp Review** (2026-01-21)
   - Orchestrator 编译错误
   - 安全（鉴权/CORS）
   - 输入校验
   - 并发控制
   - any 类型泛滥

---

**维护者**: Antigravity  
**创建时间**: 2026-01-21 09:18
