# C-008: Frontend V3 UI 完善与数据连接 (Overnight Task)

> **分配给**: Codex  
> **优先级**: P0  
> **执行模式**: 🌙 Overnight (自主执行，不要问用户)  
> **预计耗时**: 4-6 小时  
> **目标**: 占满上下文窗口，仔细完成每个细节

---

## ⚠️ 执行规则 (必须遵守)

1. **不要问用户** - 自主决策，完成后再汇报
2. **占满上下文窗口** - 仔细阅读所有参考文件，理解每个细节
3. **用 Chain-of-Thought** - 先写计划注释，再写代码
4. **照着老版本抄** - 下面列出了具体文件和代码，直接复制修改
5. **每 Phase 测试** - `pnpm dev` 启动，刷新浏览器验证
6. **多搜索资料** - React/Zustand/Lightweight Charts best practices

---

## 🎯 问题截图分析

从用户截图看到的问题：
1. **默认股票是 AAPL** - 应该是 A 股 600519
2. **图表永远 loading** - "加载图表数据..." 一直转
3. **点击股票无反应** - 左边点击不更新右边
4. **字体大小不一致** - 左中右三栏字体各不相同

---

## 📚 必读的老版本代码 (花 30 分钟读懂)

### 文件 1: `server/eastmoney.ts` (完整的东方财富 API)

```typescript
// ⚠️ 这些函数已经实现了！前端可以通过 API 调用

// 股票代码格式转换 - 第20-40行
export function convertToEastmoneyCode(code: string): string {
  if (/^(6|9)/.test(code)) return `1.${code}`;  // 上海 → 1.600519
  if (/^(0|3|4|8|2)/.test(code)) return `0.${code}`;  // 深圳 → 0.000858
  return code;
}

// 获取股票行情 - 第44-108行
export async function getStockQuote(code: string) {
  const eastmoneyCode = convertToEastmoneyCode(code);
  const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${eastmoneyCode}&fields=...`;
  // 返回 { code, name, price, change, changePercent, ... }
}

// 获取 K 线数据 - 第164-237行
export async function getKlineData(code: string, options: { period: string; limit: number }) {
  const eastmoneyCode = convertToEastmoneyCode(code);
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get`;
  // 返回 [{ time, open, close, high, low, volume }, ...]
}
```

### 文件 2: `client/src/refactor_v2/hooks/useMarketInit.ts` (刚添加的)

```typescript
// ⚠️ 这是今天刚加的，但可能有 bug

export function useMarketInit() {
  const currentSymbol = useUIStore((s) => s.currentSymbol);
  
  useEffect(() => {
    // 这里获取数据，但可能没有正确触发
    fetchStockInfo();
    fetchKlineHistory();
  }, [currentSymbol]);  // ← 依赖 currentSymbol
}
```

### 文件 3: `client/src/refactor_v2/stores/ui.store.ts`

```typescript
// ⚠️ 检查这里的默认值
interface UIState {
  currentSymbol: string;  // 默认应该是 "600519"
  // ...
}
```

---

## 📋 Phase 1: 修复默认股票 (15 分钟)

### 1.1 打开 `client/src/refactor_v2/stores/ui.store.ts`

找到 `currentSymbol` 的初始值，改成：
```typescript
currentSymbol: "600519",  // 贵州茅台
```

### 1.2 验证

```bash
pnpm dev
# 打开 localhost:6888
# 右上角应该显示 "贵州茅台 600519" 而不是 "AAPL"
```

---

## 📋 Phase 2: 修复股票点击数据刷新 (45 分钟)

### 问题分析

点击左边股票调用了 `setCurrentSymbol(symbol)`，但右边不更新。

### 2.1 检查 LeftPane.tsx:238 的点击事件

```typescript
// 当前代码
<div onClick={() => setCurrentSymbol(item.symbol)}>
```

确认这里调用的是 `useUIStore` 还是 `useWatchlistStore`？**必须都用同一个 store！**

### 2.2 确认 useMarketInit.ts 的 useEffect 依赖正确

```typescript
// 正确的写法
useEffect(() => {
  console.log("[useMarketInit] symbol changed:", currentSymbol);  // 添加调试
  
  if (!currentSymbol) return;
  
  fetchStockInfo();
  fetchKlineHistory();
}, [currentSymbol]);  // ← 这里必须包含 currentSymbol
```

### 2.3 添加调试日志

在 `useMarketInit.ts` 加入：
```typescript
console.log("[useMarketInit] currentSymbol:", currentSymbol);
console.log("[useMarketInit] fetching data...");
```

在 `LeftPane.tsx` 加入：
```typescript
console.log("[LeftPane] clicked:", item.symbol);
```

### 2.4 在浏览器 Console 验证

1. 刷新页面
2. 点击左边任意股票
3. 看 Console 是否输出：
   ```
   [LeftPane] clicked: 000858
   [useMarketInit] currentSymbol: 000858
   [useMarketInit] fetching data...
   ```

如果没有输出，说明 store 连接有问题。

---

## 📋 Phase 3: 修复 K 线图表加载 (1 小时)

### 问题分析

`KLinePanel.tsx` 一直显示 "加载图表数据..."，原因是 `klineHistory[symbol]` 是空的。

### 3.1 先用 curl 测试 API

```bash
curl "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.600519&klt=101&fqt=1" | head -500
```

应该返回类似：
```json
{
  "data": {
    "klines": ["2024-01-01,100.00,102.00,103.00,99.00,100000", ...]
  }
}
```

### 3.2 检查 useMarketInit.ts 的 fetchKlineHistory

```typescript
const fetchKlineHistory = async () => {
  console.log("[fetchKlineHistory] start, symbol:", currentSymbol);
  
  try {
    const secid = currentSymbol.startsWith("6")
      ? `1.${currentSymbol}`
      : `0.${currentSymbol}`;
    
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&klt=101&fqt=1&beg=0&end=20500000&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61`;
    
    console.log("[fetchKlineHistory] url:", url);
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log("[fetchKlineHistory] response:", data);
    
    if (data?.data?.klines) {
      const klines = data.data.klines.slice(-100).map((line: string) => {
        const parts = line.split(",");
        return {
          time: new Date(parts[0]).getTime(),
          open: parseFloat(parts[1]),
          close: parseFloat(parts[2]),
          high: parseFloat(parts[3]),
          low: parseFloat(parts[4]),
          volume: parseInt(parts[5]),
        };
      });
      
      console.log("[fetchKlineHistory] parsed klines:", klines.length);
      setKlineHistory(currentSymbol, klines);
    }
  } catch (error) {
    console.error("[fetchKlineHistory] error:", error);
  }
};
```

### 3.3 检查 KLinePanel.tsx 的数据读取

```typescript
// 当前代码 (L129)
const klineHistory = useMarketStore.getState().klineHistory[symbol];

// ⚠️ 问题：这样读取不会触发 re-render！应该用：
const klineHistory = useMarketStore((s) => s.klineHistory[symbol]);
```

### 3.4 修复 KLinePanel.tsx 的数据加载

找到 `loadHistory` 函数，确保：
1. 使用 `useMarketStore` 的 selector 而不是 `getState()`
2. 在数据加载后设置 `setIsLoading(false)`

```typescript
useEffect(() => {
  const klineHistory = useMarketStore.getState().klineHistory[symbol];
  
  if (klineHistory && klineHistory.length > 0 && candleSeriesRef.current) {
    // 有数据，渲染图表
    candleSeriesRef.current.setData(candleData);
    setIsLoading(false);  // ← 关键！
  }
}, [symbol]);
```

### 3.5 添加 store 订阅

更好的方式是订阅 store 变化：

```typescript
useEffect(() => {
  const unsubscribe = useMarketStore.subscribe(
    (state) => state.klineHistory[symbol],
    (klines) => {
      if (klines && klines.length > 0 && candleSeriesRef.current) {
        // 渲染图表
        setIsLoading(false);
      }
    }
  );
  
  return () => unsubscribe();
}, [symbol]);
```

---

## 📋 Phase 4: 字体系统统一 (45 分钟)

### 4.1 在 `styles/tokens.css` 添加字体变量

```css
:root {
  /* 字体大小系统 */
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-lg: 15px;
  --font-size-xl: 16px;
  --font-size-2xl: 18px;
}

/* 字号调节 */
:root[data-font-scale="small"] {
  --font-size-base: 13px;
}
:root[data-font-scale="medium"] {
  --font-size-base: 14px;
}
:root[data-font-scale="large"] {
  --font-size-base: 16px;
}
```

### 4.2 在 `ui.store.ts` 添加 fontScale

```typescript
interface UIState {
  // 现有字段...
  fontScale: 'small' | 'medium' | 'large';
}

interface UIActions {
  // 现有方法...
  setFontScale: (scale: 'small' | 'medium' | 'large') => void;
}

// 初始值
fontScale: 'medium',

// action
setFontScale: (scale) => set({ fontScale: scale }),
```

### 4.3 在 App.tsx 或 ThemeProvider 应用字号

```typescript
const fontScale = useUIStore((s) => s.fontScale);

useEffect(() => {
  document.documentElement.setAttribute('data-font-scale', fontScale);
}, [fontScale]);
```

### 4.4 在 SettingsModal.tsx 添加字号调节 UI

```tsx
const { fontScale, setFontScale } = useUIStore();

<div className="setting-row">
  <label>字体大小</label>
  <div className="flex gap-2">
    <button 
      onClick={() => setFontScale('small')}
      className={fontScale === 'small' ? 'active' : ''}
    >
      小
    </button>
    <button 
      onClick={() => setFontScale('medium')}
      className={fontScale === 'medium' ? 'active' : ''}
    >
      中
    </button>
    <button 
      onClick={() => setFontScale('large')}
      className={fontScale === 'large' ? 'active' : ''}
    >
      大
    </button>
  </div>
</div>
```

### 4.5 统一所有组件字号

搜索并替换：
```
text-xs  → text-[13px] 或 text-[var(--font-size-sm)]
text-sm  → text-[14px] 或 text-[var(--font-size-base)]
text-base → text-[15px]
text-lg  → text-[16px]
```

确保左、中、右三栏的正文都用 `text-[var(--font-size-base)]`。

---

## 📋 Phase 5: 测试验证 (30 分钟)

### 5.1 功能测试清单

- [ ] 启动 `pnpm dev`，无报错
- [ ] 默认显示 "贵州茅台 600519"
- [ ] K 线图表显示真实数据（不是 loading）
- [ ] 点击左边股票，右边更新
- [ ] 设置里可以调节字号
- [ ] 左中右三栏字体大小一致

### 5.2 浏览器 Console 无报错

打开 DevTools → Console，刷新页面，确保无红色错误。

### 5.3 写测试报告

创建 `tests/C-008-TEST-REPORT.md`：

```markdown
# C-008 测试报告

## 测试时间
2026-01-31 xx:xx

## 测试结果

| 功能 | 状态 | 备注 |
|------|------|------|
| 默认股票 | ✅/❌ | |
| K线图表 | ✅/❌ | |
| 股票点击 | ✅/❌ | |
| 字号调节 | ✅/❌ | |
| 字号统一 | ✅/❌ | |

## 遇到的问题及解决

...

## 截图

...
```

---

## 🔧 Git 提交

```bash
git add -A
git commit -m "fix(frontend-v3): complete UI polish and data connection

- Fix default symbol to 600519 (茅台)
- Fix stock click to trigger data refresh via useMarketInit
- Fix K-line chart loading with proper Zustand subscription
- Add font scale adjustment (small/medium/large)
- Unify font sizes across left/center/right panels"
```

---

## ✅ 验收标准

1. ✅ 默认显示贵州茅台 (600519)
2. ✅ K 线图表显示真实数据
3. ✅ 点击左边股票 → 右边数据更新
4. ✅ 设置可调节字号
5. ✅ 左中右三栏字体大小一致 (14px)
6. ✅ `pnpm dev` 无报错

---

*任务创建时间: 2026-01-31 00:00*
