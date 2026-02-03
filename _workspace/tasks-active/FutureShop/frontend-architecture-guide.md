# 🏗️ 前端架构与面板系统完全指南

**版本**: 1.0 | **日期**: 2026-01-29 | **参考**: Manus 工作流 UI + TradingView Lightweight Charts

---

## 📐 布局架构（3 栏模型）

### 总体结构
```
┌─────────────────────────────────────────────────────┐
│                    顶部导航栏 (Header)              │
├────────────┬───────────────────────┬─────────────────┤
│            │                       │                 │
│  左侧      │     中间聊天工作区    │  右侧股票工作台  │
│  Sidebar   │   Chat Workspace      │ Stock Workspace │
│            │                       │                 │
│ - 导航     │ ┌─────────────────┐  │ ┌─────────────┐ │
│ - 自选列表 │ │  消息列表       │  │ │   Symbol    │ │
│ - 最近股   │ │  (流式渲染)     │  │ │  Selector   │ │
│ - 设置     │ │                 │  │ ├─────────────┤ │
│            │ │ - User Msg      │  │ │   Panel     │ │
│            │ │ - AI Msg        │  │ │   Tabs      │ │
│            │ │ - Tool Steps    │  │ │ k线 分时 盘口│ │
│            │ │ - Thinking      │  │ ├─────────────┤ │
│            │ │                 │  │ │   Active    │ │
│            │ │ (自动滚动到底)  │  │ │   Panel     │ │
│            │ └─────────────────┘  │ │  Content    │ │
│            │ ┌─────────────────┐  │ │             │ │
│            │ │  输入框         │  │ │   K线图     │ │
│            │ │  (Ctrl+Enter)   │  │ │   或其他    │ │
│            │ └─────────────────┘  │ └─────────────┘ │
│            │                       │                 │
└────────────┴───────────────────────┴─────────────────┘
```

### 响应式断点
| 屏幕 | 布局 | 备注 |
|------|------|------|
| 1024px+ | 三栏（1:2:1.5） | 桌面端，完整展示 |
| 768-1023px | 二栏（中+右） | 隐藏左侧导航，用顶部菜单替代 |
| <768px | 单栏（中） | 移动端，聊天优先，股票面板后退一层（tab 切换） |

---

## 💬 中间区：对话工作区（Chat Workspace）

### 消息类型与渲染

#### 1. User Message（用户消息）
```
┌────────────────────────────────┐
│ 👤 用户 (14:23)                │
│                                │
│ 帮我分析一下AAPL最近的走势    │
└────────────────────────────────┘
```

样式：
- 背景色：浅灰（`bg-gray-100` 或 dark mode `bg-gray-800`）
- 文字对齐：左对齐
- 时间戳：淡色小字
- 头像：可选

代码：
```tsx
<div className="flex gap-3 mb-4">
  <Avatar name="User" />
  <div className="flex-1">
    <div className="text-sm text-gray-500 mb-1">
      用户 • {formatTime(msg.timestamp)}
    </div>
    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg rounded-bl-none">
      {msg.content}
    </div>
  </div>
</div>
```

#### 2. Assistant Message（AI 回复，流式）
```
┌────────────────────────────────┐
│ 🤖 AI Agent (14:24)            │
│                                │
│ 基于最新数据，AAPL 呈现...    │
│ - 技术面：上升趋势            │
│ - 基本面：盈利稳定            │
│ - 建议：继续持有              │
│                                │
│ [展开详细分析] [加入自选]    │
└────────────────────────────────┘
```

特点：
- 支持 **Markdown 渲染**（表格、列表、代码块）
- **流式输出**：逐字渲染，用骨架屏占位
- **可交互**：底部按钮卡片可点击

代码：
```tsx
<div className="flex gap-3 mb-4">
  <Avatar name="AI" icon={<BotIcon />} />
  <div className="flex-1">
    <div className="text-sm text-gray-500 mb-1">
      AI Agent • {formatTime(msg.timestamp)}
    </div>
    <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg rounded-bl-none">
      {/* 流式渲染 markdown */}
      <Markdown>{msg.content}</Markdown>
    </div>
    {msg.actions && (
      <div className="flex gap-2 mt-2">
        {msg.actions.map(action => (
          <Button key={action.id} onClick={action.handler}>
            {action.label}
          </Button>
        ))}
      </div>
    )}
  </div>
</div>
```

#### 3. Tool Request Card（工具调用开始）
```
┌────────────────────────────────┐
│ ⚙️  正在调用工具               │
│                                │
│ 📊 fetch_stock_data            │
│  • symbol: AAPL               │
│  • period: 1y                 │
│  • indicators: [MACD, RSI]    │
│                                │
│ [⏳ 处理中...] (2.3s)         │
└────────────────────────────────┘
```

代码：
```tsx
<div className="bg-amber-50 dark:bg-amber-900 p-3 rounded-lg border-l-4 border-amber-500 mb-4">
  <div className="flex items-start gap-2">
    <GearIcon className="mt-1" />
    <div className="flex-1">
      <div className="font-semibold text-sm">正在调用工具</div>
      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
        <code>{toolName}</code>
      </div>
      {/* 输入参数列表 */}
      <div className="mt-2 space-y-1 text-xs">
        {Object.entries(toolInput).map(([key, value]) => (
          <div key={key}>• <strong>{key}</strong>: {String(value)}</div>
        ))}
      </div>
      {/* 进度指示 */}
      <div className="mt-3 flex items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-gray-500">处理中... ({elapsedTime}s)</span>
      </div>
    </div>
  </div>
</div>
```

#### 4. Tool Result Card（工具结果）
```
┌────────────────────────────────┐
│ ✅ 工具执行完成               │
│                                │
│ 📊 fetch_stock_data            │
│  • currentPrice: $185.23      │
│  • change: +2.35%             │
│  • PE: 28.5                   │
│  • Volume: 52.3M              │
│                                │
│ [查看图表] [显示详情]        │
└────────────────────────────────┘
```

代码：
```tsx
<div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg border-l-4 border-green-500 mb-4">
  <div className="flex items-start gap-2">
    <CheckCircleIcon className="text-green-600 mt-1" />
    <div className="flex-1">
      <div className="font-semibold text-sm">✅ {toolName}</div>
      {/* 结果摘要表格 */}
      <table className="mt-2 w-full text-xs">
        <tbody>
          {Object.entries(result).map(([key, value]) => (
            <tr key={key} className="border-b border-green-200 dark:border-green-700">
              <td className="font-semibold py-1">{key}</td>
              <td className="text-right py-1">{formatValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 操作按钮 */}
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline">查看图表</Button>
        <Button size="sm" variant="outline">显示详情</Button>
      </div>
    </div>
  </div>
</div>
```

#### 5. Thinking Summary Card（思考过程，可折叠）
```
默认（折叠）：
┌────────────────────────────────┐
│ 🧠 AI 思考中                   │
│ [===========>      ] 65% 完成  │
│                                │
│ [展开] [隐藏]                 │
└────────────────────────────────┘

展开后：
┌────────────────────────────────┐
│ 🧠 AI 思考过程                 │
│ [==============] 100% 完成    │
│                                │
│ ✓ 步骤 1: 解析用户需求        │
│   获取最近 5 年 AAPL 数据     │
│                                │
│ ✓ 步骤 2: 调用工具             │
│   已获取 OHLCV、指标数据      │
│                                │
│ ✓ 步骤 3: 分析数据             │
│   计算技术面、基本面评分      │
│                                │
│ [收起]                         │
└────────────────────────────────┘
```

代码：
```tsx
const [expanded, setExpanded] = useState(false);

return (
  <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-lg border-l-4 border-purple-500 mb-4">
    <div className="flex items-start gap-2">
      <BrainIcon className="text-purple-600 mt-1" />
      <div className="flex-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-semibold text-sm flex items-center gap-2 hover:underline"
        >
          🧠 AI 思考过程
          <ChevronIcon rotation={expanded ? 180 : 0} />
        </button>

        {/* 进度条 */}
        <div className="mt-2 w-full bg-purple-200 dark:bg-purple-700 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 展开内容 */}
        {expanded && (
          <div className="mt-3 space-y-2 text-xs">
            {thinkingSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircleIcon className="text-purple-600 mt-0.5" size="sm" />
                <div>
                  <strong>步骤 {idx + 1}: {step.title}</strong>
                  <p className="text-gray-600 dark:text-gray-300 mt-0.5">
                    {step.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
```

### 聊天输入框
```
┌─────────────────────────────────────────────┐
│ 输入你的问题或指令...                        │
│                                             │
│                                             │
│ [📎 附件] [🎯 模式选择] [➤ 发送]          │
└─────────────────────────────────────────────┘
```

特点：
- 支持多行（textarea，最小高度 3 行）
- Ctrl+Enter 快速发送
- 模式选择：分析模式、交易模式、学习模式
- 发送中禁用输入

代码：
```tsx
const [input, setInput] = useState('');
const [mode, setMode] = useState<'analysis' | 'trade' | 'learn'>('analysis');

const handleSend = async () => {
  if (!input.trim()) return;
  
  setLoading(true);
  await sendQuery({
    content: input,
    mode,
    conversationId
  });
  
  setInput('');
  setLoading(false);
};

return (
  <div className="border-t p-4 bg-white dark:bg-gray-900">
    <div className="flex gap-2 mb-2">
      <ModeSelector value={mode} onChange={setMode} />
    </div>
    <textarea
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          handleSend();
        }
      }}
      placeholder="输入你的问题或指令..."
      className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2"
      rows={3}
      disabled={loading}
    />
    <div className="flex justify-end gap-2 mt-2">
      <Button variant="outline" size="sm">📎 附件</Button>
      <Button
        variant="primary"
        size="sm"
        onClick={handleSend}
        loading={loading}
      >
        ➤ 发送
      </Button>
    </div>
  </div>
);
```

---

## 📊 右侧区：股票工作台（Stock Workspace）

### 面板系统架构

#### 面板注册表（Panel Registry）

```typescript
// types/panel.ts
export interface Panel {
  id: string;                      // 唯一 ID: 'kline' | 'intraday' | ...
  title: string;                   // UI 标题: 'K线' | '分时' | ...
  icon: React.ReactNode;           // Tab 图标
  category: 'chart' | 'data' | 'advice';  // 分类
  minWidth: number;                // 最小宽度（px）
  defaultWidth?: number;           // 默认宽度
  lazy: boolean;                   // 是否延迟加载
  dataDeps: string[];              // 依赖数据源: ['marketTick', 'klineHistory']
  component: React.ComponentType<PanelProps>;
  onSubscribe?: (symbol: string) => Promise<void>;
  onUnsubscribe?: (symbol: string) => void;
}

// store/panelRegistry.ts
export const panelRegistry: Record<string, Panel> = {
  kline: {
    id: 'kline',
    title: 'K线',
    icon: <CandleIcon />,
    category: 'chart',
    minWidth: 400,
    defaultWidth: 600,
    lazy: false,
    dataDeps: ['marketTick', 'klineHistory'],
    component: KLinePanel,
    onSubscribe: async (symbol) => {
      // 订阅 WebSocket 行情
      marketStore.subscribe(symbol);
      // 获取历史 K 线数据
      const klines = await fetchKlineHistory(symbol, '1d', 250);
      marketStore.setKlineData(symbol, klines);
    },
  },
  
  intraday: {
    id: 'intraday',
    title: '分时',
    icon: <LineIcon />,
    category: 'chart',
    minWidth: 400,
    defaultWidth: 600,
    lazy: true,
    dataDeps: ['marketTick'],
    component: IntradayPanel,
    onSubscribe: async (symbol) => {
      marketStore.subscribe(symbol);
      const intraday = await fetchIntradayData(symbol);
      marketStore.setIntradayData(symbol, intraday);
    },
  },
  
  orderbook: {
    id: 'orderbook',
    title: '盘口',
    icon: <OrderBookIcon />,
    category: 'data',
    minWidth: 300,
    lazy: true,
    dataDeps: ['orderbook'],
    component: OrderBookPanel,
  },
  
  indicators: {
    id: 'indicators',
    title: '指标',
    icon: <ChartIcon />,
    category: 'data',
    minWidth: 300,
    lazy: true,
    dataDeps: ['stockInfo'],
    component: IndicatorsPanel,
    onSubscribe: async (symbol) => {
      const info = await fetchStockInfo(symbol);
      marketStore.setStockInfo(symbol, info);
    },
  },
  
  advice: {
    id: 'advice',
    title: '建议',
    icon: <LightbulbIcon />,
    category: 'advice',
    minWidth: 300,
    lazy: true,
    dataDeps: ['chatRecommendation'],
    component: AdvicePanel,
  },
  
  news: {
    id: 'news',
    title: '资讯',
    icon: <NewsIcon />,
    category: 'advice',
    minWidth: 300,
    lazy: true,
    dataDeps: ['news'],
    component: NewsPanel,
    onSubscribe: async (symbol) => {
      const news = await fetchNews(symbol);
      marketStore.setNews(symbol, news);
    },
  },
};
```

#### Stock Workspace 容器

```tsx
// components/StockWorkspace.tsx
export const StockWorkspace: React.FC = () => {
  const currentSymbol = useStockStore((s) => s.currentSymbol);
  const activePanelId = useStockStore((s) => s.activePanelId);
  const setActivePanelId = useStockStore((s) => s.setActivePanelId);
  const setCurrentSymbol = useStockStore((s) => s.setCurrentSymbol);

  const activePanel = panelRegistry[activePanelId];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Symbol Selector */}
      <div className="p-3 border-b bg-white dark:bg-gray-800">
        <SymbolSearchBar 
          value={currentSymbol}
          onChange={setCurrentSymbol}
        />
      </div>

      {/* Panel Tabs */}
      <div className="flex gap-1 p-2 border-b bg-white dark:bg-gray-800 overflow-x-auto">
        {Object.values(panelRegistry).map((panel) => (
          <Tab
            key={panel.id}
            active={activePanelId === panel.id}
            onClick={() => setActivePanelId(panel.id)}
            icon={panel.icon}
            label={panel.title}
          />
        ))}
      </div>

      {/* Active Panel Content */}
      <div className="flex-1 overflow-auto">
        {activePanel && (
          <Suspense fallback={<PanelSkeleton />}>
            <activePanel.component symbol={currentSymbol} />
          </Suspense>
        )}
      </div>
    </div>
  );
};
```

### 各面板详细实现

#### 1. K线面板（KLinePanel）

```tsx
// components/panels/KLinePanel.tsx
import { IChartApi, createChart, ColorType } from 'lightweight-charts';

export const KLinePanel: React.FC<PanelProps> = ({ symbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const marketData = useMarketStore((s) => s.data[symbol]);
  const klineHistory = useMarketStore((s) => s.klineHistory[symbol]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. 初始化图表
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1f2937' },
        textColor: '#d1d5db',
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // 2. 添加 K 线 Series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderUpColor: '#16a34a',
      borderDownColor: '#dc2626',
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    });

    // 3. 加载历史数据
    if (klineHistory && klineHistory.length > 0) {
      const data = klineHistory.map((k) => ({
        time: k.timestamp,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }));
      candlestickSeries.setData(data);

      // 只在首次加载时 fitContent
      chart.timeScale().fitContent();
    }

    // 4. 实时更新（仅最后一根 K 线）
    const handleMarketUpdate = (tick: MarketTick) => {
      if (!chartRef.current) return;

      const lastKline = {
        time: Math.floor(tick.timestamp / 1000),
        open: tick.open,
        high: tick.high,
        low: tick.low,
        close: tick.close,
      };

      // 关键：不调用 fitContent()，仅更新数据
      candlestickSeries.update(lastKline);
    };

    // 使用 requestAnimationFrame 批处理更新
    let updateQueue: MarketTick[] = [];
    let isScheduled = false;

    const flushUpdates = () => {
      if (updateQueue.length > 0) {
        const latest = updateQueue[updateQueue.length - 1];
        handleMarketUpdate(latest);
        updateQueue = [];
      }
      isScheduled = false;
    };

    const onTick = (tick: MarketTick) => {
      updateQueue.push(tick);
      if (!isScheduled) {
        isScheduled = true;
        requestAnimationFrame(flushUpdates);
      }
    };

    marketStore.on(`tick:${symbol}`, onTick);

    // 5. 窗口缩放处理
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      marketStore.off(`tick:${symbol}`, onTick);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [symbol, klineHistory]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};
```

**关键优化**：
- ❌ 禁止每次 tick 都调用 `fitContent()`（会导致时间轴频繁抖动）
- ✅ 使用 `requestAnimationFrame` 批处理，250ms 最多更新一次 UI
- ✅ 仅更新最后一根 K 线，历史数据不变

#### 2. 分时面板（IntradayPanel）

```tsx
export const IntradayPanel: React.FC<PanelProps> = ({ symbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const intradayData = useMarketStore((s) => s.intradayData[symbol]);

  useEffect(() => {
    if (!containerRef.current || !intradayData) return;

    // 使用 Line Series 而非 Candlestick
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1f2937' },
        textColor: '#d1d5db',
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: true },
    });

    const lineSeries = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
    });

    const data = intradayData.map((point) => ({
      time: point.timestamp,
      value: point.price,
    }));

    lineSeries.setData(data);
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [intradayData, symbol]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};
```

#### 3. 盘口面板（OrderBookPanel）

```tsx
export const OrderBookPanel: React.FC<PanelProps> = ({ symbol }) => {
  const orderbook = useMarketStore((s) => s.orderbook[symbol]);

  if (!orderbook) return <PanelSkeleton />;

  const { bids, asks, mid } = orderbook;

  return (
    <div className="p-4 space-y-4">
      {/* 中间价格 */}
      <div className="text-center">
        <div className="text-3xl font-bold">{mid.price}</div>
        <div className={`text-lg ${mid.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {mid.change > 0 ? '+' : ''}{mid.change} ({mid.changePercent}%)
        </div>
      </div>

      {/* 盘口数据 */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        {/* 买单 */}
        <div className="bg-green-50 dark:bg-green-900 p-3 rounded">
          <div className="font-semibold mb-2 text-green-700">买盘</div>
          <table className="w-full text-xs">
            <tbody>
              {bids.slice(0, 5).map((bid, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-1">¥{bid.price}</td>
                  <td className="text-right py-1">{bid.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 中间空白 */}
        <div className="flex items-center justify-center">
          <div className="text-gray-500 text-xs">买 / 卖</div>
        </div>

        {/* 卖单 */}
        <div className="bg-red-50 dark:bg-red-900 p-3 rounded">
          <div className="font-semibold mb-2 text-red-700">卖盘</div>
          <table className="w-full text-xs">
            <tbody>
              {asks.slice(0, 5).map((ask, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-1">¥{ask.price}</td>
                  <td className="text-right py-1">{ask.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

#### 4. 指标面板（IndicatorsPanel）

```tsx
export const IndicatorsPanel: React.FC<PanelProps> = ({ symbol }) => {
  const stockInfo = useMarketStore((s) => s.stockInfo[symbol]);

  if (!stockInfo) return <PanelSkeleton />;

  const indicators = [
    { label: 'PE 比率', value: stockInfo.pe, status: stockInfo.pe < 15 ? 'low' : 'normal' },
    { label: 'PB 比率', value: stockInfo.pb, status: stockInfo.pb < 1.5 ? 'low' : 'normal' },
    { label: 'ROE', value: `${stockInfo.roe}%`, status: stockInfo.roe > 15 ? 'high' : 'normal' },
    { label: '市值', value: formatLargeNumber(stockInfo.marketCap) },
    { label: '流通股', value: formatLargeNumber(stockInfo.floatShare) },
    { label: '股息率', value: `${stockInfo.dividendYield}%` },
  ];

  return (
    <div className="p-4 space-y-3">
      {indicators.map((ind) => (
        <div key={ind.label} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded">
          <span className="text-sm font-semibold">{ind.label}</span>
          <span className={`text-lg font-bold ${
            ind.status === 'low' ? 'text-green-600' : ind.status === 'high' ? 'text-blue-600' : ''
          }`}>
            {ind.value}
          </span>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔌 数据流与订阅模型

### 数据依赖关系
```
用户选择 Symbol (AAPL)
         ↓
    激活面板 (Panel Tab)
         ↓
   触发 onSubscribe() 回调
         ↓
   ┌─────────────────────────┐
   │   数据订阅开始           │
   ├─────────────────────────┤
   │ 1. marketStore.subscribe(symbol)    │
   │    → 建立 WebSocket 连接               │
   │    → 开始接收 tick 事件                │
   │                        │
   │ 2. fetchKlineHistory(symbol, ...) │
   │    → REST 获取历史 K 线             │
   │    → 缓存到 React Query              │
   │                        │
   │ 3. fetchStockInfo(symbol)         │
   │    → REST 获取指标数据               │
   │    → 缓存 5 分钟                     │
   └─────────────────────────┘
         ↓
   各面板接收数据更新
         ↓
   UI 渲染（逐帧更新，不卡顿）
```

### Zustand Store 结构

```typescript
// store/marketStore.ts
interface MarketState {
  // 当前市场数据（实时）
  data: Record<string, MarketTick>;
  
  // 历史 K 线
  klineHistory: Record<string, KLine[]>;
  
  // 分时数据
  intradayData: Record<string, IntradayPoint[]>;
  
  // 盘口数据
  orderbook: Record<string, OrderBook>;
  
  // 股票基本信息
  stockInfo: Record<string, StockInfo>;
  
  // 新闻资讯
  news: Record<string, News[]>;
  
  // Actions
  setMarketTick: (symbol: string, tick: MarketTick) => void;
  setKlineData: (symbol: string, klines: KLine[]) => void;
  setOrderBook: (symbol: string, book: OrderBook) => void;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  data: {},
  klineHistory: {},
  intradayData: {},
  orderbook: {},
  stockInfo: {},
  news: {},
  
  setMarketTick: (symbol, tick) =>
    set((state) => ({
      data: { ...state.data, [symbol]: tick },
    })),
  
  setKlineData: (symbol, klines) =>
    set((state) => ({
      klineHistory: { ...state.klineHistory, [symbol]: klines },
    })),
  
  subscribe: (symbol) => {
    // 连接 WebSocket 或启动数据推送
    if (!wsRef.current) {
      wsRef.current = new WebSocket('wss://market-api/ws');
    }
    wsRef.current.send(JSON.stringify({ action: 'subscribe', symbol }));
  },
  
  unsubscribe: (symbol) => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ action: 'unsubscribe', symbol }));
    }
  },
}));
```

---

## 🎨 样式与主题

### Tailwind 配置（暗色优先）
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        up: '#16a34a',      // 涨（绿）
        down: '#dc2626',    // 跌（红）
        neutral: '#6b7280', // 中性
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
};
```

### 全局样式
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* 深色模式 */
.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* 动画 */
@keyframes pulse-fast {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse-fast {
  animation: pulse-fast 200ms ease-in-out;
}
```

---

## 📈 性能优化清单

| 优化项 | 实现方案 | 验收标准 |
|--------|---------|---------|
| 代码分割 | `React.lazy` + `Suspense` 延迟加载面板 | Chunk 大小 < 100KB 每个 |
| 数据缓存 | React Query (staleTime, gcTime) | API 重复调用减少 90% |
| 实时更新批处理 | `requestAnimationFrame` 合并 tick | 60fps 无抖动（Lighthouse） |
| 内存泄漏 | useEffect cleanup 清理 WS/SSE | DevTools Memory 稳定增长 < 5MB/min |
| 图表优化 | 禁止频繁 fitContent、仅更新最后 bar | FCP < 1.5s、LCP < 2.5s |

---

**版本**: 1.0  
**最后更新**: 2026-01-29  
**用途**: 前端工程化指南，支撑 Agent 开发