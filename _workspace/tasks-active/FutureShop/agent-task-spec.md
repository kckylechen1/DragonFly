# 🤖 AI 交易工具 Agent 任务规格书

**版本**: 1.0 | **日期**: 2026-01-29 | **目标 Agent**: Gemini / Claude Code / Manus

---

## 📌 项目概览

### 目标成果
构建一个 **Web 应用** 实现以下布局与交互：
- **左侧**（可选）：导航/自选列表 → 来自 Manus 信息架构的参考
- **中间**（核心）：AI 对话工作区 → Chat Workspace，支持流式、工具可视化、Thinking 摘要展示
- **右侧**（核心）：股票工作台 → 多面板系统（K线、分时、盘口、指标、交易建议等）

### 核心需求
- **实时性**：WebSocket 行情推送 + SSE 对话流 + 节流更新避免掉帧
- **可信度**：AI Thinking 步骤可展示（摘要形式）、工具调用流程透明化
- **可扩展**：右侧面板必须是插件式的、后续可轻松添加新面板类型
- **响应式**：支持 1024px+ 桌面端优先，平板/手机为降级体验

---

## 🎯 任务拆解（Agent 执行顺序）

### 阶段 1：骨架 & 路由（2-3h）
**交付物**：可运行的项目骨架

- [ ] 初始化 Next.js 项目（或 Vite + React Router）
- [ ] 三栏布局脚手架：`<Layout>` 组件包含 `<Sidebar>` + `<ChatWorkspace>` + `<StockWorkspace>`
- [ ] 路由结构：`/` (主页) + `/chat/:id` (对话详情) + API 路由占位符
- [ ] 状态管理初始化：Zustand store（`chatStore`、`marketStore`、`uiStore`）
- [ ] 样式框架：Tailwind CSS + 暗色主题配置（参考 Manus 设计）
- [ ] TypeScript 类型定义：Message、ToolCall、StockPanel、MarketTick 等

**验收标准**：
```bash
npm run dev  # 启动后看到三栏布局框架（内容为空占位）
# 网络无报错、路由可切换、store 可访问（DevTools）
```

---

### 阶段 2：对话流工作区（4-5h）
**交付物**：完整的 SSE 流式对话系统

#### 2.1 前端消息列表 UI
- [ ] `<ChatList>` 组件：显示消息流，支持以下类型：
  - User Message（用户提问）
  - Assistant Message（流式渲染 markdown）
  - Tool Request Card（展示"正在调用 fetch_stock_data..."的步骤）
  - Tool Result Card（显示工具结果摘要）
  - Thinking Summary Card（AI 思考阶段，可折叠）
  
- [ ] Markdown 渲染：安装 `react-markdown` + `remark-gfm`，支持表格、代码块、列表
- [ ] 自动滚动到最新消息
- [ ] 加载骨架屏（Skeleton）用于流式文本

#### 2.2 输入框 & 发送
- [ ] `<ChatInput>` 组件：
  - 支持多行输入（Textarea）
  - 按 Ctrl+Enter 或点击发送按钮
  - 发送中禁用输入、显示 Loading 状态
  - 可选"模式选择"（例如："分析模式"、"交易模式"）

#### 2.3 SSE 流式连接
- [ ] Hook: `useStreamingChat(conversationId)`
  - 调用 `POST /api/chat` 获取 `conversationId`
  - 连接 `EventSource` 至 `/api/chat/stream?conversationId=...`
  - 处理事件类型：
    ```
    - message_start: 初始化新消息占位符
    - content_delta: 追加文本（流式渲染）
    - thinking_delta: 内部思考（后端可折叠展示）
    - tool_request: 工具调用开始（显示步骤卡片）
    - tool_result: 工具结果返回（更新卡片）
    - message_complete: 消息完成（关闭 SSE）
    - error: 异常处理（显示错误提示）
    ```
  - 断线自动重连（指数退避，最多 5 次）
  - cleanup 时关闭 EventSource

#### 2.4 Thinking 可视化（可折叠）
- [ ] Thinking 处理方案（核心约束）：
  - 后端生成 `public_reasoning_summary`（可展示的摘要），NOT 原始 thinking block
  - 前端收到 `thinking_delta` 事件时，在消息卡片上方插入"思考进度条"：
    ```
    🧠 分析中 [=====>    ] 50%
      - 正在获取行情数据
      - 正在计算技术指标
    ```
  - 点击"展开"可显示完整阶段列表（不展示原始推理文本）
  - 默认折叠（仅显示进度条）

**验收标准**：
```bash
# POST /api/chat with "查一下AAPL最近的分析"
# 看到 SSE 逐字渲染、工具卡片插入、thinking 进度条出现
# 断网再连 → 自动重连成功
```

---

### 阶段 3：右侧面板系统（5-6h）
**交付物**：可配置、可插拔的面板系统

#### 3.1 面板架构
- [ ] 定义 `Panel` 类型：
  ```typescript
  interface Panel {
    id: string;                    // 唯一标识，例如 'kline', 'intraday'
    title: string;                 // 面板标题
    icon: React.ReactNode;         // 图标
    minWidth: number;              // 最小宽度 (px)
    defaultWidth?: number;         // 默认宽度
    dataDeps: string[];            // 依赖的数据源，例如 ['marketTick', 'klineHistory']
    component: React.ComponentType<PanelProps>;
    onSubscribe?: (symbol: string) => void;  // 面板激活时订阅数据
    onUnsubscribe?: () => void;    // 面板关闭时取消订阅
  }
  ```

- [ ] 面板注册表：
  ```typescript
  const panelRegistry: Record<string, Panel> = {
    kline: { id: 'kline', title: 'K线', icon: <CandleIcon />, ... },
    intraday: { id: 'intraday', title: '分时', icon: <LineIcon />, ... },
    orderbook: { id: 'orderbook', title: '盘口', icon: <OrderBookIcon />, ... },
    indicators: { id: 'indicators', title: '指标', icon: <ChartIcon />, ... },
    advice: { id: 'advice', title: '建议', icon: <LightbulbIcon />, ... },
    news: { id: 'news', title: '资讯', icon: <NewsIcon />, ... },
  };
  ```

#### 3.2 面板容器 & 切换
- [ ] `<StockWorkspace>` 组件：
  - 顶部 Tab Bar：显示所有可用面板，点击切换
  - 当前面板下方显示 symbol selector（例如：AAPL, MSFT, BABA 等快速切换）
  - 面板内容区：动态渲染当前活跃面板的 component
  - 面板间切换时，自动调用 `onSubscribe` / `onUnsubscribe`

- [ ] `<StockWorkspaceState>` (Zustand store)：
  ```typescript
  {
    currentSymbol: string;          // 当前选中股票
    activePanelId: string;          // 当前激活面板
    panelVisibility: Record<string, boolean>;  // 哪些面板已加载（懒加载）
    setCurrentSymbol(symbol: string);
    setActivePanelId(panelId: string);
  }
  ```

#### 3.3 实现核心面板（每个 2-3h）
**K线面板**（优先级最高）：
- [ ] 使用 `lightweight-charts` 渲染 K线图表
- [ ] 订阅 WebSocket 行情，收到 tick 后：
  - 批处理（requestAnimationFrame）
  - 仅更新最后一根 K 线，禁止调用 `fitContent()`
  - 显示均线、成交量（可选 MACD、RSI）
- [ ] 交互：鼠标悬停显示 OHLCV、点击显示详情
- [ ] Attribution：显示 "Powered by TradingView Lightweight Charts" 底部小字

**分时面板**：
- [ ] 同样用 `lightweight-charts` 的 Line Series
- [ ] 显示分时线 + 均价线 + 成交量柱
- [ ] 左侧显示开盘/最高/最低/收盘/涨跌幅

**盘口面板**（简化版）：
- [ ] 三栏布局：买一到买五 | 中间 (价格/涨跌%) | 卖一到卖五
- [ ] 实时更新，行情闪动时加脉冲动画

**指标面板**：
- [ ] 显示 PE、PB、ROE、市值、流通盘等基本指标（可从 API 或预存数据读取）
- [ ] 表格或卡片形式，支持横向滚动

**建议面板**：
- [ ] 显示"对当前股票的 AI 推荐"（来自对话区的工具结果）
- [ ] 格式：推荐理由 + 目标价 + 风险提示

**验收标准**：
```bash
# 选择 AAPL，切换到 K线 → 看到 3 年历史 K 线图表
# 切换到分时 → 看到今日分时线
# 按 Ctrl+K 打开搜索，输入新股票 → 面板数据刷新
# 右下角显示"Powered by TradingView Lightweight Charts"
```

---

### 阶段 4：数据连接 & 实时推送（4h）
**交付物**：WebSocket + SSE 数据通道完整

#### 4.1 WebSocket 行情推送
- [ ] Hook: `useMarketWebSocket(symbols: string[])`
  - 连接至 `wss://market-api/ws?symbols=AAPL,MSFT,...`
  - 接收 tick 事件（high/low/open/close/volume/timestamp）
  - 批处理（250ms 合并一次 tick 数据）
  - 计算涨跌幅、涨跌额
  - 更新 Zustand `marketStore`
  - 触发对应面板的订阅回调

- [ ] 重连机制：断线自动重连（指数退避，最多 10 次）
- [ ] 清理：页面卸载或 symbol 变更时，自动 unsubscribe

#### 4.2 数据流架构
- [ ] 后端最小 mock 实现（用于开发测试）：
  ```
  POST /api/chat → 返回 conversationId
  GET /api/chat/stream?conversationId=... → SSE 推送对话事件
  wss://market-api/ws → WebSocket 推送市场数据（mock 随机 tick）
  GET /api/stock/:symbol/kline → 历史 K 线数据
  GET /api/stock/:symbol/info → 基本面指标
  ```

- [ ] 数据缓存策略（React Query）：
  ```
  /stock/:symbol/kline → staleTime: 60s
  /stock/:symbol/info  → staleTime: 3600s
  /stock/:symbol/indicators → staleTime: 300s
  ```

#### 4.3 错误处理与降级
- [ ] WebSocket 断线时，显示"离线提示"，暂停图表更新
- [ ] SSE 错误时，显示"对话连接失败，请重试"
- [ ] 无网络时，展示本地缓存数据（灰色显示，注明"离线缓存"）

**验收标准**：
```bash
# npm run dev，模拟 WebSocket 连接
# 打开浏览器 DevTools → Network，看到 wss 和 EventSource 两条长连接
# 实时行情刷新无卡顿、对话流式输出无中断
# 手动断网 → 提示离线，重连自动恢复
```

---

### 阶段 5：动画、通知、性能优化（3h）
**交付物**：生产级别的 UX 和性能

#### 5.1 动画
- [ ] 安装 `framer-motion`
- [ ] 实现：
  - 股价更新时脉冲闪动（pulse 200ms）
  - 面板切换时淡入淡出（fade 300ms）
  - 通知从右侧滑入（slideInRight 300ms）
  - 确认成功时缩放打勾（scale + checkmark 600ms）

#### 5.2 通知系统
- [ ] 通知队列组件：`<NotificationCenter>`
  - 右下角显示通知堆叠
  - 类型：success、error、warning、info
  - 自动消失（3-5s，高优先级可手动关闭）
  - 用于：WebSocket 断线提示、对话错误、交易成功确认

#### 5.3 性能指标
- [ ] 集成 `web-vitals` 库，测量：
  - LCP（K线首次渲染）< 2.5s
  - CLS（布局抖动）< 0.1
  - FID（交互延迟）< 100ms
- [ ] 打包分析：`npm run build -- --analyze`
  - 确保 JS bundle < 500KB（gzip）
  - 图表库独立代码分割
  
- [ ] 构建生产包并测试加载时间

**验收标准**：
```bash
npm run build
# 检查 dist 大小 < 500KB (gzip)
# Lighthouse 报告 Performance > 80
```

---

### 阶段 6：测试、文档、部署（2-3h）
**交付物**：可维护的生产代码

- [ ] 单元测试：
  - `useStreamingChat` hook 逻辑
  - Panel Registry 数据流
  - Zustand store 状态更新
  - 使用 Vitest + React Testing Library
  
- [ ] E2E 测试（Playwright）：
  - 发送对话 → 看到流式响应
  - 切换 symbol → 面板数据刷新
  - WebSocket 断线 → 重连成功

- [ ] README 文档：
  - 项目结构
  - 环境变量配置
  - 如何运行、构建、部署
  - Panel API 文档（给后续开发者扩展）

- [ ] 部署配置：
  - Dockerfile（或 Vercel/Netlify 配置）
  - CI/CD pipeline（GitHub Actions）
  - 环境分离（dev/staging/prod）

---

## 📋 接口契约（后端 Mock 必须支持）

### A. 对话 API (REST + SSE)

**POST /api/chat**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "分析一下AAPL最近的趋势",
    "conversationId": "conv_abc123"  # 可选，首次请求不需要
  }'

# 返回
{
  "conversationId": "conv_abc123",
  "messageId": "msg_xyz",
  "status": "ok"
}
```

**GET /api/chat/stream?conversationId=conv_abc123** (SSE)
```
event: message_start
data: {"message_id": "msg_xyz", "timestamp": "2026-01-29T21:00:00Z"}

event: thinking_delta
data: {"delta": "正在分析AAPL的技术面..."}

event: tool_request
data: {
  "tool_name": "fetch_stock_data",
  "tool_input": {"symbol": "AAPL", "period": "1y"}
}

event: tool_result
data: {
  "tool_name": "fetch_stock_data",
  "result": {
    "symbol": "AAPL",
    "currentPrice": 185.23,
    "change": 2.5,
    "kline": [...]
  }
}

event: content_delta
data: {"delta": "基于数据，AAPL呈现上升趋势，建议..."}

event: message_complete
data: {"usage": {"input_tokens": 245, "output_tokens": 1024}}
```

### B. 行情 API (WebSocket)

**wss://localhost:3000/market?symbols=AAPL,MSFT**
```json
// 每秒或更频繁推送一次
{
  "symbol": "AAPL",
  "timestamp": 1706593200000,
  "price": 185.45,
  "open": 183.10,
  "high": 186.50,
  "low": 182.90,
  "volume": 52341000,
  "change": 2.35,
  "changePercent": 1.28
}
```

### C. 辅助 API (REST)

**GET /api/stock/AAPL/kline?period=1d&limit=250**
```json
{
  "symbol": "AAPL",
  "klines": [
    {
      "timestamp": 1706592000,
      "open": 183.10,
      "high": 186.50,
      "low": 182.90,
      "close": 185.45,
      "volume": 52341000
    },
    // ... 更多 K 线
  ]
}
```

**GET /api/stock/AAPL/info**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "price": 185.45,
  "pe": 28.5,
  "pb": 45.2,
  "roe": 96.5,
  "marketCap": 2.9e12,
  "floatShare": 16.04e9
}
```

---

## ✅ 验收标准（最终检查）

### 功能验收
- [ ] 三栏布局完整，左/中/右可正常显示
- [ ] 对话发送 → 流式渲染（可看到逐字出现效果）
- [ ] 工具调用步骤可视化（显示"正在查行情"、"已获得结果"）
- [ ] Thinking 摘要可展开，不泄漏完整推理链路
- [ ] 右侧面板可切换（K线 → 分时 → 盘口等）
- [ ] WebSocket 高频数据不掉帧、不卡顿
- [ ] WebSocket 断线自动重连、SSE 断线提示
- [ ] 所有面板数据与当前选中 symbol 关联

### 性能验收
- [ ] 首屏加载时间 < 2.5s（LCP）
- [ ] 布局抖动 < 0.1（CLS）
- [ ] 实时行情更新无明显延迟（< 500ms 从服务器到 UI 渲染）
- [ ] 内存占用稳定（打开 DevTools Memory，长时间交互无泄漏）

### 代码质量
- [ ] TypeScript 严格模式（no-implicit-any, strict）
- [ ] 所有组件都有 JSDoc 注释
- [ ] 单元测试覆盖率 > 70%
- [ ] ESLint + Prettier 通过
- [ ] 无控制台 warning / error

### 文档完整
- [ ] README 包含项目结构、快速开始、环境变量配置
- [ ] Panel API 文档（教别人如何新增面板）
- [ ] 数据流图（markdowndiagram 或 SVG）
- [ ] 常见问题 FAQ

---

## 🚀 快速开始（Agent 可复制执行）

```bash
# 1. 创建项目
npx create-next-app@latest trading-agent --typescript --tailwind

cd trading-agent

# 2. 安装依赖
npm install \
  lightweight-charts \
  framer-motion \
  zustand \
  @tanstack/react-query \
  react-markdown \
  remark-gfm \
  web-vitals

npm install -D vitest @testing-library/react @testing-library/jest-dom

# 3. 启动开发服务器
npm run dev

# 4. 在浏览器打开
open http://localhost:3000
```

---

## 📞 问题排查（Agent 常见坑）

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| SSE 连接立即断开 | 后端未返回 text/event-stream | 检查服务端响应头 `Content-Type: text/event-stream` |
| WebSocket 连接卡住 | 服务器未启动或 URL 错误 | 检查 `wss://` URL 和防火墙 |
| 图表不显示 | 容器高度为 0 或宽度不足 | 确保 Chart 容器有 `width: 100%; height: 400px` |
| 流式文本渲染卡顿 | Markdown 渲染太复杂或频率过高 | 用 `useMemo` 缓存渲染结果，或延迟 500ms 后渲染 |
| 内存泄漏（长时间使用内存增长） | 未清理 WebSocket、EventSource、计时器 | 在 useEffect cleanup 中调用 `ws.close()`, `eventSource.close()` |

---

## 📂 预期项目结构

```
trading-agent/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # 三栏主布局
│   │   ├── page.tsx             # 首页
│   │   ├── chat/
│   │   │   └── [id]/page.tsx    # 对话详情页
│   │   └── api/
│   │       ├── chat/
│   │       │   ├── route.ts     # POST /api/chat
│   │       │   └── stream/route.ts  # GET /api/chat/stream (SSE)
│   │       └── stock/
│   │           ├── [symbol]/route.ts  # GET /api/stock/:symbol/...
│   │           └── market/route.ts    # WebSocket mock
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatWorkspace.tsx
│   │   │   └── StockWorkspace.tsx
│   │   ├── chat/
│   │   │   ├── ChatList.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageCard.tsx
│   │   │   ├── ToolCard.tsx
│   │   │   └── ThinkingCard.tsx
│   │   ├── panels/
│   │   │   ├── KLinePanel.tsx
│   │   │   ├── IntradayPanel.tsx
│   │   │   ├── OrderBookPanel.tsx
│   │   │   ├── IndicatorsPanel.tsx
│   │   │   ├── AdvicePanel.tsx
│   │   │   └── NewsPanel.tsx
│   │   └── common/
│   │       ├── NotificationCenter.tsx
│   │       └── LoadingSkeletons.tsx
│   │
│   ├── hooks/
│   │   ├── useStreamingChat.ts
│   │   ├── useMarketWebSocket.ts
│   │   └── usePanel.ts
│   │
│   ├── store/
│   │   ├── chatStore.ts
│   │   ├── marketStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── chat.ts
│   │   ├── market.ts
│   │   ├── panel.ts
│   │   └── api.ts
│   │
│   ├── utils/
│   │   ├── formatters.ts       # 价格、百分比格式化
│   │   ├── validators.ts
│   │   └── api-client.ts
│   │
│   └── styles/
│       ├── globals.css         # Tailwind + 全局样式
│       └── animations.css      # 自定义动画
│
├── tests/
│   ├── hooks/
│   └── components/
│
├── .env.local                  # 环境变量（示例）
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
└── README.md                   # 项目文档
```

---

**版本**: 1.0  
**最后更新**: 2026-01-29  
**用途**: Agent 交付清单  
**状态**: ✅ Ready for Development