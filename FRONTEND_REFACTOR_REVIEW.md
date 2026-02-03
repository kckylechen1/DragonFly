# 🏗️ 前端重构方案综合评审报告

**版本**: 1.0 | **日期**: 2026-01-29 | **评审来源**: Amp + Vercel Best Practices + Oracle

---

## 📋 评审概述

本报告基于以下三个视角对 `tasks/FutureShop/` 下的前端重构方案进行综合评审：

1. **初步架构评审** - 整体设计合理性分析
2. **Vercel React Best Practices** - 57 条规则对照检查
3. **Oracle 深度分析** - 高频实时系统专项审查

### 总体评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构设计 | ⭐⭐⭐⭐ | 三栏布局 + 插件面板设计优秀 |
| 状态管理 | ⭐⭐⭐ | Zustand 选型正确，但高频更新策略需改进 |
| 实时数据 | ⭐⭐⭐ | SSE/WS 分离正确，但缺少连接管理层 |
| 性能优化 | ⭐⭐⭐ | 有意识但不够激进 |
| 可测试性 | ⭐⭐ | 测试策略过于笼统 |

---

## 🆕 新增交互需求

### 1. 可折叠侧边栏 (参考 Manus 设计)

**设计要求**:
- 侧边栏可通过按钮收起/展开
- 收起状态：仅显示图标（约 60px 宽）
- 展开状态：显示完整内容（约 280px 宽）
- 底部包含设置按钮入口
- 折叠/展开动画平滑（300ms ease-out）

**实现方案**:
```tsx
// components/layout/Sidebar.tsx
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 60 : 280 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full bg-gray-900 border-r border-gray-800 flex flex-col"
    >
      {/* 顶部 Logo + 折叠按钮 */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && <span className="text-lg font-semibold">DragonFly</span>}
        <button
          onClick={onToggle}
          className="p-2 rounded hover:bg-gray-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto">
        <SidebarItem icon={<PlusIcon />} label="新建任务" collapsed={collapsed} />
        <SidebarItem icon={<SearchIcon />} label="搜索" collapsed={collapsed} />
        <SidebarItem icon={<LibraryIcon />} label="库" collapsed={collapsed} />
        
        {/* 项目列表 */}
        {!collapsed && (
          <div className="mt-4 px-4">
            <div className="text-xs text-gray-500 mb-2">项目</div>
            {/* 项目列表项... */}
          </div>
        )}
        
        {/* 自选股列表 */}
        {!collapsed && (
          <div className="mt-4 px-4">
            <div className="text-xs text-gray-500 mb-2">自选股</div>
            {/* 股票列表项... */}
          </div>
        )}
      </nav>

      {/* 底部设置按钮 */}
      <div className="border-t border-gray-800 p-2">
        <button
          className="w-full flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition-colors"
          onClick={() => openSettings()}
        >
          <Settings size={20} />
          {!collapsed && <span>设置</span>}
        </button>
      </div>
    </motion.aside>
  );
};

// 侧边栏菜单项组件
const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}> = ({ icon, label, collapsed, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors"
    title={collapsed ? label : undefined}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </button>
);
```

**Zustand 状态**:
```typescript
// store/uiStore.ts
interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      
      settingsOpen: false,
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
    }),
    { name: 'ui-state' }
  )
);
```

---

### 2. 可拖拽调整的对话框和股票面板

**设计要求**:
- 中间对话区和右侧股票区之间可拖拽调整宽度
- 拖拽手柄可视化（hover 时显示）
- 最小/最大宽度限制
- 拖拽状态持久化到 localStorage

**实现方案 (使用 react-resizable-panels)**:
```bash
npm install react-resizable-panels
```

```tsx
// components/layout/MainLayout.tsx
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export const MainLayout: React.FC = () => {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="h-screen flex bg-gray-950">
      {/* 可折叠侧边栏 */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* 主内容区：可拖拽分割 */}
      <PanelGroup
        direction="horizontal"
        autoSaveId="main-layout" // 自动持久化到 localStorage
        className="flex-1"
      >
        {/* 对话工作区 */}
        <Panel
          defaultSize={50}
          minSize={30}
          maxSize={70}
          className="flex flex-col"
        >
          <ChatWorkspace />
        </Panel>

        {/* 拖拽手柄 */}
        <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-500 transition-colors cursor-col-resize group">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-600 group-hover:bg-blue-400 rounded-full" />
          </div>
        </PanelResizeHandle>

        {/* 股票工作区 */}
        <Panel
          defaultSize={50}
          minSize={25}
          maxSize={60}
          className="flex flex-col"
        >
          <StockWorkspace />
        </Panel>
      </PanelGroup>
    </div>
  );
};
```

**拖拽手柄样式**:
```css
/* 自定义拖拽手柄 */
.resize-handle {
  position: relative;
  width: 4px;
  background: transparent;
  cursor: col-resize;
  transition: background 0.2s;
}

.resize-handle:hover,
.resize-handle:active {
  background: rgba(59, 130, 246, 0.5);
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 32px;
  background: #4b5563;
  border-radius: 4px;
  transition: background 0.2s;
}

.resize-handle:hover::after {
  background: #3b82f6;
}
```

---

### 3. 响应式布局策略

**断点设计**:
| 屏幕宽度 | 布局 | 侧边栏 | 面板 |
|---------|------|--------|------|
| ≥1440px (2K+) | 三栏完整 | 展开 280px | 对话 50% + 股票 50% |
| 1024-1439px | 三栏紧凑 | 可折叠 | 对话 55% + 股票 45% |
| 768-1023px | 二栏 | 强制折叠 | 仅显示一个面板 (Tab 切换) |
| <768px | 单栏 | 抽屉式 | 底部 Tab 切换 |

**响应式 Hook**:
```typescript
// hooks/useResponsiveLayout.ts
import { useMediaQuery } from '@/hooks/useMediaQuery';

type LayoutMode = 'desktop-large' | 'desktop' | 'tablet' | 'mobile';

export const useResponsiveLayout = () => {
  const isLargeDesktop = useMediaQuery('(min-width: 1440px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  const mode: LayoutMode = isLargeDesktop
    ? 'desktop-large'
    : isDesktop
    ? 'desktop'
    : isTablet
    ? 'tablet'
    : 'mobile';

  return {
    mode,
    showSidebar: isDesktop,
    showBothPanels: isDesktop,
    sidebarCollapsible: isDesktop && !isLargeDesktop,
    forceSidebarCollapsed: !isDesktop,
  };
};
```

**移动端布局**:
```tsx
// components/layout/MobileLayout.tsx
export const MobileLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'stock'>('chat');

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部导航 */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-gray-800">
        <button onClick={openDrawer}>
          <MenuIcon />
        </button>
        <span>DragonFly</span>
        <SymbolSelector compact />
      </header>

      {/* 主内容 */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? <ChatWorkspace /> : <StockWorkspace />}
      </main>

      {/* 底部 Tab 切换 */}
      <nav className="h-16 flex border-t border-gray-800">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex-1 flex flex-col items-center justify-center',
            activeTab === 'chat' && 'text-blue-500'
          )}
        >
          <MessageIcon />
          <span className="text-xs mt-1">对话</span>
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={cn(
            'flex-1 flex flex-col items-center justify-center',
            activeTab === 'stock' && 'text-blue-500'
          )}
        >
          <ChartIcon />
          <span className="text-xs mt-1">行情</span>
        </button>
      </nav>

      {/* 侧边栏抽屉 */}
      <Drawer open={drawerOpen} onClose={closeDrawer}>
        <Sidebar collapsed={false} />
      </Drawer>
    </div>
  );
};
```

**自适应入口组件**:
```tsx
// components/layout/ResponsiveLayout.tsx
export const ResponsiveLayout: React.FC = () => {
  const { mode } = useResponsiveLayout();

  if (mode === 'mobile') {
    return <MobileLayout />;
  }

  if (mode === 'tablet') {
    return <TabletLayout />;
  }

  return <MainLayout />;
};
```

---

### 4. 设置面板设计

**设置项分类**:
```typescript
interface Settings {
  // 外观
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  
  // 交易
  defaultSymbol: string;
  priceColorScheme: 'red-green' | 'green-red'; // 中国/美国配色
  
  // 图表
  chartType: 'candle' | 'line';
  showVolume: boolean;
  indicators: string[];
  
  // 通知
  priceAlerts: boolean;
  soundEnabled: boolean;
  
  // API
  apiKey?: string;
  dataSource: 'mock' | 'live';
}
```

**设置面板 UI**:
```tsx
// components/settings/SettingsModal.tsx
export const SettingsModal: React.FC = () => {
  const { settingsOpen, closeSettings } = useUIStore();
  const [activeTab, setActiveTab] = useState('appearance');

  return (
    <Dialog open={settingsOpen} onOpenChange={closeSettings}>
      <DialogContent className="max-w-2xl h-[600px] p-0">
        <div className="flex h-full">
          {/* 左侧 Tab */}
          <div className="w-48 border-r border-gray-800 p-4">
            <SettingsTab id="appearance" icon={<PaletteIcon />} label="外观" />
            <SettingsTab id="trading" icon={<ChartIcon />} label="交易" />
            <SettingsTab id="chart" icon={<CandleIcon />} label="图表" />
            <SettingsTab id="notifications" icon={<BellIcon />} label="通知" />
            <SettingsTab id="api" icon={<KeyIcon />} label="API" />
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'trading' && <TradingSettings />}
            {activeTab === 'chart' && <ChartSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'api' && <ApiSettings />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🔴 CRITICAL 级别问题 (必须修复)

### 1. 高频 Tick 直接进入 React 渲染链

**问题描述**: 当前方案将每个 WebSocket tick 直接写入 Zustand store，会导致：
- 每秒数十次的 React 重渲染
- GC 抖动（大量对象拷贝）
- 60fps 无法保证

**当前代码问题**:
```typescript
// ❌ 每个 tick 都触发 React 更新
setMarketTick: (symbol, tick) =>
  set((state) => ({
    data: { ...state.data, [symbol]: tick }, // 高频 spread 拷贝
  })),
```

**修复方案**:
```typescript
// ✅ 引入缓冲层，批量更新
// src/realtime/marketClient.ts
class MarketClient {
  private buffer = new Map<string, MarketTick>();
  private flushScheduled = false;

  onTick(symbol: string, tick: MarketTick) {
    this.buffer.set(symbol, tick);
    if (!this.flushScheduled) {
      this.flushScheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  private flush() {
    this.flushScheduled = false;
    const updates = Object.fromEntries(this.buffer);
    this.buffer.clear();
    useMarketStore.getState().batchUpdateTicks(updates);
  }
}

// Store 端
batchUpdateTicks: (updates: Record<string, MarketTick>) =>
  set((state) => ({
    data: { ...state.data, ...updates },
  })),
```

---

### 2. WebSocket/SSE 副作用放在 Zustand Store 内

**问题描述**: 示例代码 `wsRef.current` 在 store 初始化作用域内不成立，且副作用与状态耦合导致难测试。

**修复方案**: 新建独立的连接管理模块

```typescript
// src/realtime/marketClient.ts
export const marketClient = {
  ws: null as WebSocket | null,
  refCount: new Map<string, number>(),

  connect() {
    if (this.ws) return;
    this.ws = new WebSocket('wss://market-api/ws');
    this.ws.onmessage = (e) => {
      const tick = JSON.parse(e.data);
      // 写入缓冲而非直接更新 store
      tickBuffer.set(tick.symbol, tick);
    };
  },

  subscribe(symbol: string) {
    const count = (this.refCount.get(symbol) || 0) + 1;
    this.refCount.set(symbol, count);
    if (count === 1) {
      this.ws?.send(JSON.stringify({ action: 'subscribe', symbol }));
    }
  },

  unsubscribe(symbol: string) {
    const count = (this.refCount.get(symbol) || 0) - 1;
    this.refCount.set(symbol, Math.max(0, count));
    if (count <= 0) {
      this.ws?.send(JSON.stringify({ action: 'unsubscribe', symbol }));
      this.refCount.delete(symbol);
    }
  },

  dispose() {
    this.ws?.close();
    this.ws = null;
    this.refCount.clear();
  },
};
```

---

### 3. 数据获取瀑布流 (`async-parallel`)

**问题描述**: 阶段 4.2 中数据获取是串行的

**修复方案**:
```typescript
// ❌ 串行
const marketData = await fetchMarketData(symbol);
const klineData = await fetchKlineHistory(symbol);
const stockInfo = await fetchStockInfo(symbol);

// ✅ 并行
const [marketData, klineData, stockInfo] = await Promise.all([
  fetchMarketData(symbol),
  fetchKlineHistory(symbol),
  fetchStockInfo(symbol),
]);
```

**预期收益**: 首屏加载时间减少 40-60%

---

### 4. 缺少 Bundle 分割 (`bundle-dynamic-imports`)

**问题描述**: 所有面板静态导入，首屏加载过重

**修复方案**:
```typescript
// ❌ 静态导入
import { KLinePanel } from './panels/KLinePanel';
import { IntradayPanel } from './panels/IntradayPanel';

// ✅ 动态导入
import dynamic from 'next/dynamic';

const panelRegistry = {
  kline: {
    component: dynamic(() => import('./panels/KLinePanel'), {
      loading: () => <PanelSkeleton />,
      ssr: false,
    }),
  },
  intraday: {
    component: dynamic(() => import('./panels/IntradayPanel'), {
      loading: () => <PanelSkeleton />,
      ssr: false,
    }),
  },
};
```

---

## 🟠 HIGH 级别问题 (强烈建议修复)

### 5. 缺少 Suspense 边界

**补充方案**:
```tsx
// 面板区域
<StockWorkspace>
  <Suspense fallback={<PanelSkeleton />}>
    <ActivePanel symbol={symbol} />
  </Suspense>
</StockWorkspace>

// 对话区域
<ChatWorkspace>
  <Suspense fallback={<MessageSkeleton />}>
    <ChatList conversationId={id} />
  </Suspense>
</ChatWorkspace>
```

---

### 6. SSE 流缺少幂等与序号机制

**问题描述**: 重连后可能收到重复 token

**修复方案**:
```typescript
// 后端事件格式
event: content_delta
data: {"conversationId": "xxx", "messageId": "yyy", "seq": 42, "delta": "..."}

// 前端去重
const lastSeqRef = useRef(0);
eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.seq <= lastSeqRef.current) return; // 丢弃重复
  lastSeqRef.current = data.seq;
  // 处理 delta...
};
```

---

### 7. Markdown 流式渲染卡顿

**问题描述**: 每个 token 更新都触发 remark-gfm 完整解析

**修复方案**:
```typescript
// ✅ 批量 commit，节流渲染
const pendingTextRef = useRef('');
const [displayText, setDisplayText] = useState('');

useEffect(() => {
  const interval = setInterval(() => {
    if (pendingTextRef.current) {
      setDisplayText(prev => prev + pendingTextRef.current);
      pendingTextRef.current = '';
    }
  }, 50); // 50ms 批量提交
  return () => clearInterval(interval);
}, []);

// SSE 回调中
onContentDelta: (delta) => {
  pendingTextRef.current += delta;
};
```

---

### 8. 服务端数据序列化过大 (`server-serialization`)

**问题描述**: K 线历史数据字段名过长，传输量大

**修复方案**:
```typescript
// ❌ 完整字段名
{ timestamp, open, high, low, close, volume }

// ✅ 简写 + 服务端预处理
{ t, o, h, l, c, v }

// 或使用 gzip 压缩响应
```

---

### 9. 缺少 React.cache() 请求去重

**补充方案**:
```typescript
// src/lib/data-fetching.ts
import { cache } from 'react';

export const getStockInfo = cache(async (symbol: string) => {
  const res = await fetch(`/api/stock/${symbol}/info`);
  return res.json();
});

// 同一渲染周期内多次调用自动去重
```

---

## 🟡 MEDIUM 级别问题

### 10. Zustand 订阅粒度过粗

**修复方案**:
```typescript
// ❌ 订阅整个对象
const tick = useMarketStore((s) => s.data[symbol]);

// ✅ 只订阅需要的字段
const price = useMarketStore((s) => s.data[symbol]?.price);

// 或使用 shallow 比较
import { shallow } from 'zustand/shallow';
const { price, change } = useMarketStore(
  (s) => ({ 
    price: s.data[symbol]?.price, 
    change: s.data[symbol]?.changePercent 
  }),
  shallow
);
```

---

### 11. 缺少 useTransition 处理

**补充方案**:
```typescript
const [isPending, startTransition] = useTransition();

const handleSymbolChange = (newSymbol: string) => {
  startTransition(() => {
    setCurrentSymbol(newSymbol);
  });
};

// UI
{isPending && <div className="opacity-50">切换中...</div>}
```

---

### 12. 图表更新应走 Imperative 路径

**问题描述**: 图表更新通过 React state 中转，增加延迟

**修复方案**:
```typescript
// ✅ 直接调用图表 API
const chartRef = useRef<IChartApi | null>(null);
const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

useEffect(() => {
  const unsubscribe = marketClient.onTick(symbol, (tick) => {
    // 直接更新最后一根 K 线，不经过 React
    seriesRef.current?.update({
      time: tick.timestamp,
      open: tick.open,
      high: tick.high,
      low: tick.low,
      close: tick.close,
    });
  });
  return unsubscribe;
}, [symbol]);
```

---

### 13. 消息列表缺少 content-visibility

**补充方案**:
```css
/* 长列表优化 */
.message-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 100px;
}
```

---

### 14. 缺少 passive 事件监听器

**补充方案**:
```typescript
// 图表滚动/缩放
container.addEventListener('wheel', handleZoom, { passive: true });
container.addEventListener('touchmove', handlePan, { passive: true });
```

---

### 15. 缺少 localStorage 持久化方案

**补充方案**:
```typescript
const STORAGE_VERSION = 1;

interface PersistedState {
  version: number;
  watchlist: string[];
  activePanelId: string;
  theme: 'light' | 'dark';
}

export const loadPersistedState = (): Partial<PersistedState> => {
  try {
    const raw = localStorage.getItem('trading-app-state');
    if (!raw) return {};
    const state = JSON.parse(raw);
    if (state.version !== STORAGE_VERSION) {
      localStorage.removeItem('trading-app-state');
      return {};
    }
    return state;
  } catch {
    return {};
  }
};

export const persistState = (state: PersistedState) => {
  localStorage.setItem('trading-app-state', JSON.stringify({
    ...state,
    version: STORAGE_VERSION,
  }));
};
```

---

## 🔧 架构改进建议

### 新增：连接状态机

```typescript
type ConnectionState = 
  | 'idle' 
  | 'connecting' 
  | 'open' 
  | 'degraded' 
  | 'closed' 
  | 'error';

interface ConnectionStatus {
  state: ConnectionState;
  lastMessageAt: number | null;
  retryCount: number;
  lastError: Error | null;
}

// 统一管理 WS 和 SSE 连接状态
const useConnectionStore = create<{
  wsStatus: ConnectionStatus;
  sseStatus: ConnectionStatus;
  setWsStatus: (status: Partial<ConnectionStatus>) => void;
  setSseStatus: (status: Partial<ConnectionStatus>) => void;
}>(...);
```

---

### 新增：面板能力声明升级

```typescript
// ❌ 当前方案
interface Panel {
  dataDeps: string[];  // 太松散
  onSubscribe?: (symbol: string) => void;
  onUnsubscribe?: () => void;
}

// ✅ 改进方案
interface Panel {
  id: string;
  title: string;
  icon: React.ReactNode;
  
  // 声明式依赖
  requires: {
    realtime?: ('tick' | 'orderbook')[];
    queries?: ('kline' | 'info' | 'news')[];
  };
  
  // 统一生命周期
  setup?: (ctx: PanelContext) => () => void;  // 返回 cleanup
  
  component: React.ComponentType<PanelProps>;
}

interface PanelContext {
  symbol: string;
  marketClient: MarketClient;
  queryClient: QueryClient;
}
```

---

### 新增：数据一致性标记

```typescript
// 在 marketStore 中标记数据来源状态
interface MarketState {
  data: Record<string, MarketTick>;
  sourceStatus: Record<string, 'live' | 'stale' | 'offline-cache'>;
  
  // 根据状态决定 UI 展示
  // 'stale' -> 灰色显示 + "最后更新: xx秒前"
  // 'offline-cache' -> 灰色 + "离线缓存"
}
```

---

## 🧪 测试策略改进

当前方案 "70% 覆盖率" 过于笼统，建议按风险分层：

### 单元测试 (Vitest)

| 测试目标 | 测试点 | 优先级 |
|---------|--------|--------|
| marketClient | tick buffer、flush 节流、refCount 逻辑 | P0 |
| SSE parser | 事件序列、重连幂等、乱序/重复处理 | P0 |
| Zustand selectors | 订阅不触发无关更新 | P1 |
| 格式化工具函数 | 价格、百分比、大数字格式化 | P1 |

### 集成测试 (MSW + WS Mock)

| 测试场景 | 验证点 |
|---------|--------|
| React Query caching | staleTime 行为正确 |
| SSE 高频 delta | UI commit 节流生效 |
| WS 断线重连 | 自动重连 + 状态恢复 |

### E2E 测试 (Playwright)

| 测试路径 | 验证点 |
|---------|--------|
| 三栏布局渲染 | 各区域正确显示 |
| Symbol 切换 | 面板数据刷新 |
| 对话流式输出 | 逐字渲染 + 工具卡片插入 |
| 断网/重连 | 提示正确 + 自动恢复 |

### 性能回归测试

```bash
# 建议添加到 CI 或本地脚本
# 1 分钟 tick 压测模式
# 断言：渲染帧率 >= 55fps，内存增长 < 10MB/min
```

---

## 📁 建议项目结构调整

```
src/
├── app/                      # Next.js App Router
├── components/
│   ├── layout/
│   ├── chat/
│   ├── panels/
│   └── common/
├── hooks/
│   ├── useStreamingChat.ts
│   ├── useMarketData.ts      # 封装 marketClient 订阅
│   └── usePanel.ts
├── store/
│   ├── chatStore.ts
│   ├── marketStore.ts        # 只存低频/聚合后的状态
│   ├── uiStore.ts
│   └── connectionStore.ts    # 新增：连接状态
├── realtime/                  # 新增：实时连接管理层
│   ├── marketClient.ts       # WebSocket 管理
│   ├── sseClient.ts          # SSE 管理
│   └── tickBuffer.ts         # 缓冲与批量更新
├── lib/
│   ├── data-fetching.ts      # React.cache 包装
│   └── persistence.ts        # localStorage 管理
├── types/
└── utils/
```

---

## 📊 改进后预期收益

| 指标 | 当前方案预估 | 优化后预估 | 提升 |
|------|-------------|-----------|------|
| LCP | < 2.5s | < 1.5s | 40% |
| 首屏 JS Bundle | ~300KB | ~120KB | 60% |
| 面板切换响应 | ~200ms | ~50ms | 75% |
| 60fps 稳定性 | 90% | 99% | - |
| 内存增长 | 未知 | < 5MB/min | - |

---

## ✅ 执行清单

### 阶段 0 新增项 (交互增强 + 设计系统)

**设计系统基础**:
- [ ] 创建 `styles/design-tokens.css` - CSS 变量定义
- [ ] 创建 `styles/effects.css` - 霓虹/扫描线/玻璃态效果
- [ ] 配置 Tailwind 自定义颜色 (void/neon/up/down)
- [ ] 配置 Google Fonts (JetBrains Mono + Space Grotesk + Orbitron)
- [ ] 创建 Lightweight Charts 主题配置文件

**交互组件**:
- [ ] 安装 `react-resizable-panels` + `framer-motion` 依赖
- [ ] 实现可折叠侧边栏组件 (`Sidebar.tsx`) - 含扫描线效果
- [ ] 实现拖拽分割布局 (`MainLayout.tsx`) - 霓虹手柄
- [ ] 创建响应式 Hook (`useResponsiveLayout.ts`)
- [ ] 实现移动端布局 (`MobileLayout.tsx`)
- [ ] 实现平板布局 (`TabletLayout.tsx`)
- [ ] 创建设置面板组件 (`SettingsModal.tsx`) - 玻璃态
- [ ] 创建 Command Palette 股票搜索 (`CommandPalette.tsx`)
- [ ] uiStore 添加 sidebar/settings/commandPalette 状态

**微交互组件**:
- [ ] 创建 `PriceDisplay` 组件 - 数字滚动 + 闪光 (含节流)
- [ ] 创建 `GlassPanel` 组件 - 分层: 默认不 blur / --blur 变体
- [ ] 创建 `NeonButton` 组件 - 发光边框按钮
- [ ] 创建 `TerminalCard` 组件 - 终端风格卡片
- [ ] 创建 `ThinkingProgress` 组件 - 神经网络进度条

**Oracle 建议必须补充**:
- [ ] 创建 `PerformanceModeToggle` - 一键关闭视觉特效
- [ ] 创建 `ConnectionStatus` 组件 - WS/SSE 状态灯
- [ ] 创建 `PanelErrorBoundary` - 面板级错误隔离
- [ ] 集成 `@tanstack/react-virtual` - 订单簿/成交虚拟列表
- [ ] 实现效果预算常量 `EFFECT_BUDGET`
- [ ] 实现 `prefers-reduced-motion` 媒体查询支持
- [ ] 实现涨跌非颜色编码 (箭头 + 符号)

### 阶段 1 补充项 (骨架 & 路由)

- [ ] 添加 Suspense 边界设计
- [ ] 创建 `src/realtime/` 目录结构
- [ ] 设计连接状态机类型
- [ ] 实现 `ResponsiveLayout` 入口组件

### 阶段 2 补充项 (对话流)

- [ ] SSE 事件添加 seq/eventId
- [ ] 实现 delta 批量 commit (50ms)
- [ ] Markdown 渲染 useMemo 优化
- [ ] 添加 startTransition 处理

### 阶段 3 补充项 (面板系统)

- [ ] 所有面板改为 dynamic() 懒加载
- [ ] 禁用 barrel 导入
- [ ] 面板定义升级为能力声明
- [ ] 图表更新走 imperative 路径

### 阶段 4 补充项 (数据连接)

- [ ] 创建独立 marketClient 模块
- [ ] 实现 tick buffer + rAF flush
- [ ] 订阅引用计数机制
- [ ] 数据获取改为 Promise.all()
- [ ] 添加 React.cache() 去重
- [ ] 心跳检测 + 断线判定

### 阶段 5 补充项 (性能优化)

- [ ] 消息列表 content-visibility
- [ ] 图表事件 passive 监听
- [ ] localStorage 持久化方案
- [ ] 数据源状态标记

### 测试补充项

- [ ] marketClient 单元测试
- [ ] SSE parser 单元测试
- [ ] Playwright E2E 基础用例
- [ ] 性能回归脚本

---

## 🚨 风险与防护措施

| 风险 | 防护措施 |
|------|----------|
| 订阅抖动导致行情断续 | refCount + symbol 去重；面板切换不直接 unsubscribe |
| SSE 重连后重复 token | seq/eventId 前端去重 |
| 内存泄漏 | 每个面板 setup() 返回 cleanup；marketClient.dispose() |
| Symbol 快速切换数据错乱 | 校验 symbol + timestamp，丢弃旧 symbol 的晚到 tick |
| 对象拷贝与 GC 抖动 | 降低写入 Zustand 频率至 4-10Hz |

---

## 📚 参考资料

- [Vercel React Best Practices](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [TradingView Lightweight Charts Performance](https://tradingview.github.io/lightweight-charts/docs/next/performance)
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/updating-state)
- [React Query Real-time Patterns](https://tanstack.com/query/latest/docs/framework/react/guides/background-fetching-indicators)

---

## 🎨 UI/UX 设计系统 (基于 UI-UX-Pro-Max + Frontend Design)

### 设计理念：赛博金融 (Cyber Finance)

> **核心概念**: 将传统金融的严谨与赛博朋克的未来感融合，打造一个让用户感觉自己是"掌控全局的交易指挥官"的沉浸式体验。

| 维度 | 定位 | 差异化记忆点 |
|------|------|-------------|
| **风格** | Cyber Terminal | 不是普通深色模式，而是像科幻电影里的交易终端 |
| **氛围** | 控制室感 | 多屏数据流、扫描线、微弱脉冲光 |
| **情绪** | 冷静+掌控 | 深邃的蓝黑色调，关键信息用霓虹高亮 |

### 配色方案：深渊蓝 + 霓虹强调

```typescript
// tailwind.config.ts
const colors = {
  // 主色调 - 深渊蓝 (不是普通的灰黑)
  void: {
    950: '#020617',  // 最深 - 近乎纯黑但带蓝调
    900: '#0A0F1C',  // 主背景
    800: '#111827',  // 卡片背景
    700: '#1E293B',  // 悬浮/高亮背景
  },
  
  // 霓虹强调色 - 让关键信息"发光"
  neon: {
    cyan: '#00F5FF',    // 主强调 - 赛博青
    amber: '#FFB800',   // 警告/关注
    magenta: '#FF00FF', // 极端状态
  },
  
  // 涨跌色 - 更鲜艳的霓虹版本
  up: '#00FF88',      // 霓虹绿 (比普通绿更亮眼)
  down: '#FF3366',    // 霓虹红 (比普通红更警示)
  
  // 文字层级
  text: {
    primary: '#F8FAFC',   // 近白
    secondary: '#94A3B8', // 银灰
    muted: '#64748B',     // 暗灰
  },
  
  // 边框 - 带微光效果
  border: {
    DEFAULT: 'rgba(0, 245, 255, 0.1)',  // 青色微光边框
    hover: 'rgba(0, 245, 255, 0.3)',
  },
};
```

### 字体方案：技术感 + 可读性

```css
/* 推荐字体组合：
   - 数据展示: JetBrains Mono (更适合密集数字)
   - UI 文案: Space Grotesk (几何感但保持可读)
   - 大标题: Orbitron (可选，科幻感标题)
*/
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap');
```

```typescript
// tailwind.config.ts
fontFamily: {
  sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  display: ['Orbitron', 'sans-serif'], // 可选，用于大标题
}

// 使用场景
// - 价格、K线数据: font-mono text-neon-cyan
// - 标签、按钮: font-sans
// - Logo、大标题: font-display (可选)
```

### 独特视觉效果 (记忆点)

```css
/* 1. 扫描线效果 - 增加终端感 */
.scanlines::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
  z-index: 10;
}

/* 2. 霓虹发光效果 - 关键数据 */
.neon-glow {
  text-shadow: 
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 20px currentColor;
}

.neon-glow-subtle {
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
}

/* 3. 股价变化脉冲 - 更戏剧化 */
@keyframes price-flash {
  0% { 
    background: rgba(0, 255, 136, 0.3);
    text-shadow: 0 0 20px currentColor;
  }
  100% { 
    background: transparent;
    text-shadow: none;
  }
}

.price-up-flash {
  animation: price-flash 0.5s ease-out;
  color: #00FF88;
}

/* 4. 边框微光呼吸 - 活跃面板 */
@keyframes border-pulse {
  0%, 100% { border-color: rgba(0, 245, 255, 0.2); }
  50% { border-color: rgba(0, 245, 255, 0.5); }
}

.panel-active {
  animation: border-pulse 2s ease-in-out infinite;
  border: 1px solid rgba(0, 245, 255, 0.2);
}

/* 5. 数据流动效果 - 背景装饰 */
.data-stream {
  background: 
    linear-gradient(180deg, transparent 0%, rgba(0, 245, 255, 0.02) 50%, transparent 100%),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 100px,
      rgba(0, 245, 255, 0.03) 100px,
      rgba(0, 245, 255, 0.03) 101px
    );
}

/* 6. 玻璃态面板 - 层次感 */
.glass-panel {
  background: rgba(10, 15, 28, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 245, 255, 0.1);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 7. 渐变网格背景 */
.grid-bg {
  background-image: 
    linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}
```

### 图表风格：霓虹版

```typescript
// Lightweight Charts 主题配置
const chartTheme = {
  layout: {
    background: { type: 'solid', color: 'transparent' },
    textColor: '#94A3B8',
    fontSize: 12,
    fontFamily: 'JetBrains Mono',
  },
  grid: {
    vertLines: { color: 'rgba(0, 245, 255, 0.05)' },
    horzLines: { color: 'rgba(0, 245, 255, 0.05)' },
  },
  crosshair: {
    mode: 0,
    vertLine: {
      color: 'rgba(0, 245, 255, 0.5)',
      style: 2,
    },
    horzLine: {
      color: 'rgba(0, 245, 255, 0.5)',
      style: 2,
    },
  },
};

// K 线颜色
const candleColors = {
  upColor: '#00FF88',
  downColor: '#FF3366',
  borderUpColor: '#00FF88',
  borderDownColor: '#FF3366',
  wickUpColor: '#00FF88',
  wickDownColor: '#FF3366',
};

// 分时线
const lineSeriesOptions = {
  color: '#00F5FF',
  lineWidth: 2,
  crosshairMarkerRadius: 4,
  crosshairMarkerBorderColor: '#00F5FF',
  crosshairMarkerBackgroundColor: '#020617',
};
```

### 图表配色指南 (霓虹版)

| 图表类型 | 主色 | 次色 | 背景 | 网格 |
|---------|------|------|------|------|
| K 线图 | 涨 `#00FF88` / 跌 `#FF3366` | 均线 `#00F5FF` / `#FFB800` | 透明 | `rgba(0,245,255,0.05)` |
| 分时图 | `#00F5FF` (15% 填充) | 均价线 `#FFB800` | 透明 | `rgba(0,245,255,0.05)` |
| 成交量 | 涨 `rgba(0,255,136,0.5)` | 跌 `rgba(255,51,102,0.5)` | - | - |
| 实时流 | `#00F5FF` 脉冲 | 历史渐隐 | 深色 | 青色微光 |

### 独特交互设计 (差异化体验)

#### 1. 侧边栏折叠动画
```tsx
// 不只是宽度变化，加入"关门"效果
<motion.aside
  animate={{ 
    width: collapsed ? 60 : 280,
    opacity: collapsed ? 0.9 : 1,
  }}
  transition={{ 
    duration: 0.3, 
    ease: [0.4, 0, 0.2, 1] // Material Design easing
  }}
  className="relative overflow-hidden"
>
  {/* 折叠时显示扫描线效果 */}
  {collapsed && (
    <motion.div 
      className="absolute inset-0 scanlines opacity-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
    />
  )}
</motion.aside>
```

#### 2. 面板切换 - 滑动+渐变
```tsx
// 面板切换不是简单替换，而是"数据流切换"效果
<AnimatePresence mode="wait">
  <motion.div
    key={activePanelId}
    initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
    transition={{ duration: 0.25 }}
  >
    <ActivePanel />
  </motion.div>
</AnimatePresence>
```

#### 3. 股票搜索 - Command Palette 风格
```tsx
// Ctrl+K 打开，类似 VS Code / Raycast
<CommandPalette>
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: -20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    className="glass-panel w-[600px] max-h-[400px]"
  >
    <div className="flex items-center gap-3 p-4 border-b border-neon-cyan/10">
      <SearchIcon className="text-neon-cyan" />
      <input 
        className="flex-1 bg-transparent text-lg font-mono focus:outline-none"
        placeholder="搜索股票代码或名称..."
        autoFocus
      />
      <kbd className="px-2 py-1 text-xs bg-void-800 rounded">ESC</kbd>
    </div>
    {/* 搜索结果列表 */}
  </motion.div>
</CommandPalette>
```

#### 4. 工具调用卡片 - 终端风格
```tsx
// 不是普通卡片，而是像终端执行命令
<div className="glass-panel font-mono text-sm">
  <div className="flex items-center gap-2 p-3 border-b border-neon-cyan/10">
    <span className="text-neon-cyan">$</span>
    <span className="text-neon-amber">fetch_stock_data</span>
    <span className="text-text-secondary">--symbol AAPL --period 1y</span>
  </div>
  <div className="p-3 space-y-1 text-text-secondary">
    <div className="flex items-center gap-2">
      <motion.span
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-neon-cyan"
      >
        ▶
      </motion.span>
      <span>正在连接数据源...</span>
    </div>
  </div>
</div>
```

#### 5. Thinking 进度条 - 神经网络风格
```tsx
// 不是普通进度条，而是像 AI 在"思考"
<div className="relative h-1 bg-void-800 rounded-full overflow-hidden">
  <motion.div
    className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-cyan"
    style={{ width: `${progress}%` }}
    animate={{
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    }}
    transition={{ duration: 2, repeat: Infinity }}
  />
  {/* 脉冲点 */}
  <motion.div
    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-cyan"
    style={{ left: `${progress}%` }}
    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
    transition={{ duration: 0.5, repeat: Infinity }}
  />
</div>
```

#### 6. 通知系统 - 从右侧滑入 + 边框发光
```tsx
<motion.div
  initial={{ x: 100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 100, opacity: 0 }}
  className={cn(
    "glass-panel p-4 min-w-[300px]",
    type === 'success' && "border-l-2 border-l-up",
    type === 'error' && "border-l-2 border-l-down",
    type === 'warning' && "border-l-2 border-l-neon-amber",
  )}
  style={{
    boxShadow: type === 'success' 
      ? '0 0 20px rgba(0, 255, 136, 0.2)' 
      : type === 'error'
      ? '0 0 20px rgba(255, 51, 102, 0.2)'
      : undefined
  }}
>
  {/* 通知内容 */}
</motion.div>
```

### 微交互细节清单

| 元素 | 交互 | 效果 |
|------|------|------|
| 价格数字 | 值变化时 | 数字滚动 + 背景闪光 + 发光 |
| Tab 切换 | 点击 | 下划线滑动 + 内容淡入 |
| 按钮 Hover | 悬停 | 边框发光 + 背景渐变 |
| 输入框 Focus | 聚焦 | 边框变亮 + 微微放大 |
| 面板拖拽 | 拖动手柄 | 手柄变亮 + 光标变化 |
| 加载状态 | 等待中 | 骨架屏 + 扫描线效果 |
| 股票代码 | Hover | 浮现迷你预览卡片 |
| 对话消息 | 新消息 | 从下方滑入 + 渐显 |

---

## ⚠️ Oracle 性能与可访问性审查

### 视觉效果分层策略 (关键)

> **核心原则**: 把"赛博"效果拆成 3 层，不要每个组件都发光

| 层级 | 允许的效果 | 数量限制 | 示例 |
|------|-----------|---------|------|
| **Layer 0: 背景氛围** | grid-bg, data-stream | 全屏 1 个元素 | body 背景 |
| **Layer 1: 容器** | glass-panel (blur) | ≤ 3 个顶级容器 | ChatWorkspace, StockWorkspace, Header |
| **Layer 2: 数据强调** | neon-glow, price-flash | 仅关键数值 | 价格、PnL、成交提示 |

### 效果预算 (硬性限制)

```typescript
// 同屏效果配额
const EFFECT_BUDGET = {
  backdropBlur: 2,      // 最多 2-3 个 blur 容器
  infiniteAnimations: 2, // 只用 transform/opacity
  neonTextShadow: 5,    // 只用于大字号关键数值
  scanlineOverlay: 1,   // 仅背景层，不覆盖文字
};
```

### 效果冲突避免

| ❌ 避免组合 | 原因 | ✅ 替代方案 |
|------------|------|-----------|
| scanlines + backdrop-blur + text-shadow | 字体边缘糊、颜色溢出 | scanlines 只在背景层，不盖文字 |
| 每行订单簿都 neon-glow | 密集小字号会模糊不清 | 只对价格变化行闪光 |
| border-pulse 持续动画 | 触发频繁 paint | 用 opacity/transform 在 pseudo-element 上 |

### Glass Panel 性能优化

```css
/* ❌ 原方案：所有面板都 blur */
.glass-panel {
  backdrop-filter: blur(12px);
}

/* ✅ 改进：分层 + 降级 */
.glass-panel {
  background: rgba(10, 15, 28, 0.9); /* 提高不透明度保证可读性 */
}

.glass-panel--blur {
  backdrop-filter: blur(12px);
}

/* 性能模式降级 */
.performance-mode .glass-panel--blur {
  backdrop-filter: none;
}

/* 设备能力检测 */
@supports not (backdrop-filter: blur(12px)) {
  .glass-panel--blur {
    background: rgba(10, 15, 28, 0.95);
  }
}
```

### 价格闪光节流

```typescript
// ❌ 每次 tick 都闪光
onTick(price) {
  element.classList.add('price-flash');
}

// ✅ 同方向 300ms 内只触发一次
const flashThrottle = new Map<string, number>();

onTick(symbol: string, direction: 'up' | 'down') {
  const key = `${symbol}-${direction}`;
  const now = Date.now();
  const lastFlash = flashThrottle.get(key) || 0;
  
  if (now - lastFlash > 300) {
    flashThrottle.set(key, now);
    triggerFlash(symbol, direction);
  }
}

// 只对可见区域执行
if (isElementInViewport(element)) {
  triggerFlash();
}
```

### 可访问性修复

#### 1. 运动敏感支持 (必须)

```css
/* 禁用持续动画 */
@media (prefers-reduced-motion: reduce) {
  .border-pulse,
  .scanlines::before,
  .data-stream {
    animation: none !important;
  }
  
  .price-flash {
    animation-duration: 0.01ms !important;
    /* 改为静态高亮 */
    background: rgba(0, 255, 136, 0.2);
  }
  
  * {
    transition-duration: 0.01ms !important;
  }
}
```

#### 2. 涨跌非颜色编码 (色盲友好)

```tsx
// ❌ 仅靠颜色区分
<span className={change > 0 ? 'text-up' : 'text-down'}>
  {change}%
</span>

// ✅ 颜色 + 符号 + 方向
<span className={cn(
  change > 0 ? 'text-up' : 'text-down',
  'flex items-center gap-1'
)}>
  {change > 0 ? (
    <>
      <ArrowUpIcon className="w-3 h-3" />
      <span>+{Math.abs(change)}%</span>
    </>
  ) : (
    <>
      <ArrowDownIcon className="w-3 h-3" />
      <span>−{Math.abs(change)}%</span>
    </>
  )}
</span>
```

#### 3. 对比度保障

```typescript
// 文字颜色规范 - 不要用 neon 色当正文
const TEXT_COLORS = {
  // ✅ 正文固定用这些
  primary: '#F8FAFC',   // 主要文字
  secondary: '#94A3B8', // 次要文字
  muted: '#64748B',     // 禁用/辅助
  
  // ⚠️ neon 色只用于强调
  accent: '#00F5FF',    // 仅用于：hover态、选中态、关键数值
};

// glass-panel 内文字区域加深底色
.glass-panel-content {
  background: rgba(2, 6, 23, 0.5); /* 局部实底保证可读性 */
  border-radius: 8px;
  padding: 16px;
}
```

### 性能模式开关 (强烈建议)

```typescript
// store/uiStore.ts
interface UIState {
  performanceMode: boolean;
  togglePerformanceMode: () => void;
}

// 性能模式下禁用的效果
const PERFORMANCE_MODE_DISABLED = [
  'backdrop-filter: blur()',
  'scanline overlay',
  'border-pulse animation',
  'heavy text-shadow',
  'continuous animations',
];

// 设置面板中的开关
<SettingItem
  label="性能模式"
  description="关闭视觉特效以提升流畅度"
  value={performanceMode}
  onChange={togglePerformanceMode}
/>
```

### 移动端效果降级

```typescript
// hooks/useResponsiveLayout.ts
export const useResponsiveLayout = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(max-width: 1023px)');
  
  // 移动端默认禁用重效果
  const effectsConfig = {
    backdropBlur: !isMobile,      // 移动端关闭 blur
    scanlines: !isMobile,          // 移动端关闭扫描线
    heavyTextShadow: !isTablet,    // 平板以下关闭重阴影
    continuousAnimations: !isMobile,
  };
  
  return { isMobile, isTablet, effectsConfig };
};
```

### 缺失的关键组件 (Oracle 建议补充)

| 组件 | 重要性 | 说明 |
|------|--------|------|
| **Performance Mode Toggle** | 🔴 必须 | 一键关闭所有视觉特效 |
| **Connection Status UI** | 🔴 必须 | WS/SSE 连接状态灯 + 最后更新时间 |
| **Error Boundary** | 🔴 必须 | 面板级错误隔离，某个图表崩了不拖垮全屏 |
| **Virtual List** | 🔴 必须 | 订单簿/成交列表虚拟滚动 |
| **Keyboard Shortcuts** | 🟡 建议 | 快捷键切换 symbol、面板、时间周期 |

---

### UI 质量清单 (交付前必检)

#### 图标与视觉

| 规则 | ✅ 正确做法 | ❌ 错误做法 |
|------|-----------|-----------|
| 不使用 Emoji 作图标 | 使用 Lucide/Heroicons SVG | 使用 🎨 🚀 ⚙️ 作为 UI 图标 |
| 稳定的 Hover 状态 | 颜色/透明度变化 | scale 变换导致布局抖动 |
| 统一图标尺寸 | 固定 viewBox 24x24，使用 w-6 h-6 | 随意混用不同尺寸 |

#### 交互与光标

| 规则 | ✅ 正确做法 | ❌ 错误做法 |
|------|-----------|-----------|
| cursor-pointer | 所有可点击元素添加 `cursor-pointer` | 交互元素保持默认光标 |
| Hover 反馈 | 提供颜色、阴影、边框变化 | 无任何视觉反馈 |
| 平滑过渡 | `transition-colors duration-200` | 瞬间状态切换或 >500ms 过慢 |

#### 深色模式对比度

| 元素 | 最低对比度 | 推荐值 |
|------|-----------|--------|
| 主要文字 | 4.5:1 | `#F9FAFB` (gray-50) |
| 次要文字 | 3:1 | `#9CA3AF` (gray-400) |
| 禁用文字 | - | `#6B7280` (gray-500) |
| 边框 | 可见 | `#374151` (gray-700) |

#### 布局与间距

| 规则 | ✅ 正确做法 | ❌ 错误做法 |
|------|-----------|-----------|
| 浮动导航 | `top-4 left-4 right-4` 留边距 | 贴边 `top-0 left-0` |
| 固定头部内容偏移 | 计算 header 高度留 padding | 内容被固定元素遮挡 |
| 统一最大宽度 | 全站使用 `max-w-7xl` | 各页面容器宽度不一 |

---

### 响应式断点优化

```typescript
// tailwind.config.ts - 自定义断点
screens: {
  'xs': '375px',    // 小手机
  'sm': '640px',    // 大手机
  'md': '768px',    // 平板竖屏
  'lg': '1024px',   // 平板横屏/小笔记本
  'xl': '1280px',   // 桌面
  '2xl': '1440px',  // 大桌面
  '3xl': '1920px',  // 2K 显示器
  '4xl': '2560px',  // 4K 显示器
}
```

| 断点 | 侧边栏 | 对话区 | 股票区 | 字体缩放 |
|------|--------|--------|--------|----------|
| 4K (2560px+) | 320px 展开 | 45% | 55% | 1.125x |
| 2K (1440px+) | 280px 展开 | 50% | 50% | 1x |
| 桌面 (1024px+) | 60-280px 可折叠 | 55% | 45% | 1x |
| 平板 (768px+) | 60px 折叠 | Tab 切换 | Tab 切换 | 1x |
| 手机 (<768px) | 抽屉式 | 全屏 | 全屏 | 0.9375x |

---

### 动画性能规范

| 属性 | ✅ 推荐 | ❌ 避免 |
|------|--------|--------|
| 位置变化 | `transform: translateX/Y` | `left`, `top`, `margin` |
| 尺寸变化 | `transform: scale()` | `width`, `height` |
| 透明度 | `opacity` | `visibility` (无动画) |
| 颜色 | `background-color`, `color` | `box-shadow` 频繁变化 |

```css
/* 强制 GPU 加速 */
.animate-gpu {
  will-change: transform, opacity;
  transform: translateZ(0);
}

/* 尊重用户偏好 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 可访问性检查清单

- [ ] 所有图片有 `alt` 属性
- [ ] 表单输入有 `<label>` 关联
- [ ] 颜色不是唯一的信息传达方式（涨跌用颜色+箭头）
- [ ] 键盘可完全操作（Tab 顺序正确）
- [ ] 焦点状态清晰可见
- [ ] 实时更新区域有 `aria-live` 属性
- [ ] 闪烁元素可暂停（行情闪动需提供开关）
- [ ] 对比度符合 WCAG AA (4.5:1 文字，3:1 UI 元素)

```tsx
// 实时行情区域
<div 
  aria-live="polite" 
  aria-label={`${symbol} 当前价格 ${price}`}
>
  {price}
</div>

// 涨跌不仅用颜色
<span className={cn(
  change > 0 ? 'text-up' : 'text-down'
)}>
  {change > 0 ? '▲' : '▼'} {Math.abs(change)}%
</span>
```

---

## 📁 更新后的项目结构

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
├── components/
│   ├── layout/
│   │   ├── ResponsiveLayout.tsx   # 自适应入口
│   │   ├── MainLayout.tsx         # 桌面三栏 (含拖拽分割)
│   │   ├── TabletLayout.tsx       # 平板二栏
│   │   ├── MobileLayout.tsx       # 手机单栏
│   │   ├── Sidebar.tsx            # 可折叠侧边栏 (扫描线效果)
│   │   ├── ChatWorkspace.tsx
│   │   └── StockWorkspace.tsx
│   ├── chat/
│   │   ├── ChatList.tsx
│   │   ├── ChatInput.tsx
│   │   ├── MessageCard.tsx
│   │   ├── ToolCard.tsx           # 终端风格
│   │   └── ThinkingCard.tsx       # 神经网络进度条
│   ├── panels/
│   │   ├── KLinePanel.tsx
│   │   ├── IntradayPanel.tsx
│   │   ├── OrderBookPanel.tsx
│   │   ├── IndicatorsPanel.tsx
│   │   ├── AdvicePanel.tsx
│   │   └── NewsPanel.tsx
│   ├── settings/
│   │   └── SettingsModal.tsx      # 玻璃态设置面板
│   └── ui/                        # 赛博风格基础组件
│       ├── GlassPanel.tsx         # 玻璃态容器
│       ├── NeonButton.tsx         # 发光边框按钮
│       ├── TerminalCard.tsx       # 终端风格卡片
│       ├── PriceDisplay.tsx       # 数字滚动 + 闪光
│       ├── ThinkingProgress.tsx   # 神经网络进度条
│       ├── CommandPalette.tsx     # Ctrl+K 股票搜索
│       ├── Dialog.tsx
│       ├── Drawer.tsx
│       └── Skeleton.tsx           # 扫描线骨架屏
├── hooks/
│   ├── useResponsiveLayout.ts     # 响应式检测
│   ├── useMediaQuery.ts
│   ├── useStreamingChat.ts
│   ├── useMarketData.ts
│   └── useKeyboardShortcuts.ts    # Ctrl+K 等快捷键
├── store/
│   ├── uiStore.ts                 # sidebar/settings/commandPalette
│   ├── chatStore.ts
│   ├── marketStore.ts
│   └── connectionStore.ts
├── realtime/
│   ├── marketClient.ts
│   ├── sseClient.ts
│   └── tickBuffer.ts
├── lib/
│   ├── data-fetching.ts
│   ├── persistence.ts
│   └── chart-theme.ts             # Lightweight Charts 主题
├── styles/
│   ├── globals.css                # 基础 + Tailwind
│   ├── design-tokens.css          # CSS 变量 (void/neon 颜色)
│   ├── effects.css                # 扫描线/霓虹/玻璃态
│   └── animations.css             # 脉冲/闪光/滑动动画
└── types/
```

---

**文档状态**: ✅ 评审完成，待执行  
**任务评审**: 详见 `tasks/epics/frontend-v3/TASK_REVIEW.md`  
**下一步**: 按 TASK_REVIEW.md 修复清单更新任务文件后启动执行
