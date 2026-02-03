# TradingView Lightweight Charts v5 API 参考

> 官方文档: https://tradingview.github.io/lightweight-charts/docs
> 
> 版本: `lightweight-charts@5.1.0`

---

## 1. 快速开始

### 1.1 安装
```bash
pnpm add lightweight-charts
```

### 1.2 创建图表
```typescript
import { createChart } from 'lightweight-charts';

const chart = createChart(document.getElementById('container'), {
  layout: {
    textColor: 'black',
    background: { type: 'solid', color: 'white' }
  }
});
```

### 1.3 创建 Series（v5 新 API）
```typescript
import { 
  createChart, 
  CandlestickSeries, 
  LineSeries, 
  AreaSeries,
  HistogramSeries,
  BarSeries,
  BaselineSeries
} from 'lightweight-charts';

const chart = createChart(container);

// ✅ v5 正确写法
const candleSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderVisible: false,
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350'
});

// ❌ v4 旧写法 (已废弃)
// const candleSeries = chart.addCandlestickSeries({ ... });
```

---

## 2. Series 类型

### 2.1 CandlestickSeries (K线图)
```typescript
import { CandlestickSeries } from 'lightweight-charts';

const series = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderVisible: false,
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350'
});

// 数据格式
series.setData([
  { time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
  { time: '2018-12-23', open: 45.12, high: 53.90, low: 45.12, close: 48.09 },
]);
```

### 2.2 LineSeries (折线图)
```typescript
import { LineSeries } from 'lightweight-charts';

const series = chart.addSeries(LineSeries, {
  color: '#2962FF',
  lineWidth: 2
});

// 数据格式
series.setData([
  { time: 1642425322, value: 0 },
  { time: 1642511722, value: 8 },
]);
```

### 2.3 AreaSeries (面积图)
```typescript
import { AreaSeries } from 'lightweight-charts';

const series = chart.addSeries(AreaSeries, {
  lineColor: '#2962FF',
  topColor: '#2962FF',
  bottomColor: 'rgba(41, 98, 255, 0.28)'
});
```

### 2.4 HistogramSeries (柱状图 - 成交量)
```typescript
import { HistogramSeries } from 'lightweight-charts';

const volumeSeries = chart.addSeries(HistogramSeries, {
  color: '#26a69a',
  priceFormat: { type: 'volume' },
  priceScaleId: '' // 使用独立的价格轴
});

// 数据格式支持单条颜色
volumeSeries.setData([
  { time: 1642425322, value: 1000000, color: '#26a69a' }, // 涨
  { time: 1642511722, value: 800000, color: '#ef5350' },  // 跌
]);
```

### 2.5 BaselineSeries (基线图)
```typescript
import { BaselineSeries } from 'lightweight-charts';

const series = chart.addSeries(BaselineSeries, {
  baseValue: { type: 'price', price: 25 },
  topLineColor: 'rgba(38, 166, 154, 1)',
  topFillColor1: 'rgba(38, 166, 154, 0.28)',
  topFillColor2: 'rgba(38, 166, 154, 0.05)',
  bottomLineColor: 'rgba(239, 83, 80, 1)',
  bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
  bottomFillColor2: 'rgba(239, 83, 80, 0.28)'
});
```

---

## 3. 数据操作

### 3.1 设置数据
```typescript
// 初始化数据
series.setData([
  { time: '2018-12-22', value: 24.11 },
  { time: '2018-12-23', value: 31.74 },
]);
```

### 3.2 实时更新（推荐）
```typescript
// 更新最后一根 K 线（相同时间 = 更新）
series.update({ time: '2018-12-31', value: 25 });

// 添加新 K 线（新时间 = 新增）
series.update({ time: '2019-01-01', value: 20 });
```

> ⚠️ **性能提示**: 不要用 `setData()` 更新实时数据，会替换所有数据影响性能

### 3.3 历史数据更新
```typescript
// v5 新增：支持更新历史数据点
series.update({ time: '2018-12-25', value: 30 }, true); // 第二参数 historicalUpdate = true
```

### 3.4 删除数据
```typescript
// 删除最后 n 条数据
const removed = series.pop(1);
```

---

## 4. 时间格式

Lightweight Charts 支持三种时间格式:

```typescript
// 1. Unix 时间戳 (秒)
{ time: 1642425322, value: 100 }

// 2. 日期字符串 YYYY-MM-DD
{ time: '2018-12-22', value: 100 }

// 3. Business Day 对象
{ time: { year: 2018, month: 12, day: 22 }, value: 100 }
```

---

## 5. 常用配置

### 5.1 图表配置
```typescript
const chart = createChart(container, {
  width: 800,
  height: 400,
  layout: {
    background: { type: 'solid', color: '#1a1a1a' },
    textColor: '#d1d4dc',
    fontFamily: "'Inter', sans-serif"
  },
  grid: {
    vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
    horzLines: { color: 'rgba(42, 46, 57, 0.5)' }
  },
  crosshair: {
    mode: 0 // CrosshairMode.Normal (不吸附)
  },
  rightPriceScale: {
    visible: true,
    borderColor: 'rgba(197, 203, 206, 0.8)'
  },
  timeScale: {
    borderColor: 'rgba(197, 203, 206, 0.8)',
    timeVisible: true,
    secondsVisible: false
  }
});
```

### 5.2 双价格轴
```typescript
chart.applyOptions({
  rightPriceScale: { visible: true },
  leftPriceScale: { visible: true }
});

// 将某个 series 绑定到左轴
const leftSeries = chart.addSeries(LineSeries, {
  priceScaleId: 'left'
});
```

### 5.3 时间轴适配内容
```typescript
chart.timeScale().fitContent();
```

---

## 6. 价格线 (Price Lines)

```typescript
// 添加水平价格线
const priceLine = series.createPriceLine({
  price: 649.00,
  color: '#ef5350',
  lineWidth: 2,
  lineStyle: 2, // LineStyle.Dashed
  axisLabelVisible: true,
  title: '高点'
});

// 移除价格线
series.removePriceLine(priceLine);

// 隐藏默认的最新价格线
series.applyOptions({
  lastValueVisible: false,
  priceLineVisible: false
});
```

---

## 7. Series Markers (标记)

```typescript
import { createSeriesMarkers } from 'lightweight-charts';

const markers = [
  {
    time: '2018-12-23',
    position: 'aboveBar', // 'belowBar' | 'inBar'
    color: '#f68410',
    shape: 'circle', // 'square' | 'arrowUp' | 'arrowDown'
    text: 'B' // 买入信号
  },
  {
    time: '2018-12-25',
    position: 'belowBar',
    color: '#e91e63',
    shape: 'arrowDown',
    text: 'S' // 卖出信号
  }
];

createSeriesMarkers(series, markers);
```

---

## 8. Tooltip (悬停提示)

```typescript
chart.subscribeCrosshairMove(param => {
  if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
    tooltip.style.display = 'none';
    return;
  }
  
  const data = param.seriesData.get(series);
  if (!data) return;
  
  // 获取价格
  const price = data.value !== undefined ? data.value : data.close;
  
  // 获取数据点的 Y 坐标
  const y = series.priceToCoordinate(price);
  
  tooltip.innerHTML = `<div>${price.toFixed(2)}</div>`;
  tooltip.style.left = param.point.x + 'px';
  tooltip.style.top = y + 'px';
  tooltip.style.display = 'block';
});
```

---

## 9. 图表事件

```typescript
// 十字线移动
chart.subscribeCrosshairMove(param => { ... });
chart.unsubscribeCrosshairMove(handler);

// 点击事件
chart.subscribeClick(param => { ... });
chart.unsubscribeClick(handler);

// 双击事件
chart.subscribeDblClick(param => { ... });
chart.unsubscribeDblClick(handler);
```

---

## 10. IChartApi 常用方法

```typescript
// 应用新配置
chart.applyOptions({ ... });

// 获取当前配置
const options = chart.options();

// 调整尺寸
chart.resize(width, height);

// 获取时间轴 API
const timeScale = chart.timeScale();

// 获取价格轴 API
const priceScale = chart.priceScale('right'); // 'left' | 'right'

// 截图
const canvas = chart.takeScreenshot();

// 销毁图表
chart.remove();
```

---

## 11. ISeriesApi 常用方法

```typescript
// 设置/更新数据
series.setData(data);
series.update(dataPoint);
series.update(dataPoint, true); // 历史更新

// 获取数据
const allData = series.data();
const dataAt = series.dataByIndex(index);

// 配置
series.applyOptions({ ... });
const options = series.options();

// 价格线
const priceLine = series.createPriceLine({ ... });
series.removePriceLine(priceLine);
const priceLines = series.priceLines();

// 坐标转换
const y = series.priceToCoordinate(price);
const price = series.coordinateToPrice(y);

// 获取价格轴
const priceScale = series.priceScale();
```

---

## 12. 我们项目中的使用

### KLinePanel.tsx
```typescript
import { 
  createChart, 
  CandlestickSeries, 
  HistogramSeries,
  ColorType 
} from 'lightweight-charts';

// 创建图表
const chart = createChart(chartRef.current, {
  layout: {
    background: { type: ColorType.Solid, color: 'transparent' },
    textColor: 'var(--text-secondary)'
  }
});

// K线
const candleSeries = chart.addSeries(CandlestickSeries, { ... });

// 成交量
const volumeSeries = chart.addSeries(HistogramSeries, {
  priceScaleId: '',
  priceFormat: { type: 'volume' }
});
```

### IntradayPanel.tsx
```typescript
import { createChart, LineSeries, AreaSeries } from 'lightweight-charts';

// 分时线
const lineSeries = chart.addSeries(LineSeries, {
  color: '#2962FF',
  lineWidth: 2
});
```

---

## 13. v4 → v5 迁移注意

| v4 (废弃) | v5 (新) |
|-----------|---------|
| `chart.addCandlestickSeries()` | `chart.addSeries(CandlestickSeries, options)` |
| `chart.addLineSeries()` | `chart.addSeries(LineSeries, options)` |
| `chart.addAreaSeries()` | `chart.addSeries(AreaSeries, options)` |
| `chart.addHistogramSeries()` | `chart.addSeries(HistogramSeries, options)` |
| `chart.addBarSeries()` | `chart.addSeries(BarSeries, options)` |
| `chart.addBaselineSeries()` | `chart.addSeries(BaselineSeries, options)` |
| `series.setMarkers(markers)` | `createSeriesMarkers(series, markers)` |

---

## 14. 参考链接

- [Getting Started](https://tradingview.github.io/lightweight-charts/docs)
- [API Reference](https://tradingview.github.io/lightweight-charts/docs/api)
- [Series Types](https://tradingview.github.io/lightweight-charts/docs/series-types)
- [Tutorials](https://tradingview.github.io/lightweight-charts/tutorials)
- [GitHub](https://github.com/tradingview/lightweight-charts)

---

## 15. React 集成 (Tutorial)

```tsx
import { AreaSeries, createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export const ChartComponent = ({ data, colors }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    const series = chart.addSeries(AreaSeries, {
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor,
    });
    series.setData(data);
    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove(); // 销毁图表
    };
  }, [data, colors]);

  return <div ref={chartContainerRef} />;
};
```

---

## 16. 价格 + 成交量叠加 (Tutorial)

关键技巧：使用 `priceScaleId: ''` 创建 overlay + `scaleMargins` 控制位置

```typescript
// K 线（主图）
const mainSeries = chart.addSeries(CandlestickSeries, { ... });
mainSeries.priceScale().applyOptions({
  scaleMargins: {
    top: 0.1,    // 顶部留 10%
    bottom: 0.4, // 底部留 40%（给成交量）
  },
});

// 成交量（overlay，独立价格轴）
const volumeSeries = chart.addSeries(HistogramSeries, {
  priceFormat: { type: 'volume' },
  priceScaleId: '', // 设为 overlay
});
volumeSeries.priceScale().applyOptions({
  scaleMargins: {
    top: 0.7,    // 顶部留 70%
    bottom: 0,   // 占底部 30%
  },
});

// 成交量颜色跟随涨跌
volumeSeries.setData([
  { time: '2018-10-19', value: 19103293, color: '#26a69a' }, // 涨
  { time: '2018-10-20', value: 20345000, color: '#ef5350' }, // 跌
]);
```

---

## 17. 图例 Legend (Tutorial)

```typescript
// 创建 Legend HTML 元素
const legend = document.createElement('div');
legend.style.cssText = `
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 1;
  font-size: 14px;
  font-family: sans-serif;
  color: var(--text-primary);
`;
container.appendChild(legend);

// 监听十字线移动更新 Legend
chart.subscribeCrosshairMove(param => {
  let priceFormatted = '';
  if (param.time) {
    const data = param.seriesData.get(series);
    const price = data?.value ?? data?.close;
    priceFormatted = price?.toFixed(2) || '';
  }
  legend.innerHTML = `AAPL <strong>${priceFormatted}</strong>`;
});
```

---

## 18. 实时数据更新 (Tutorial)

```typescript
// 模拟实时数据流
function* getNextRealtimeUpdate(realtimeData) {
  for (const dataPoint of realtimeData) {
    yield dataPoint;
  }
  return null;
}

const streamingDataProvider = getNextRealtimeUpdate(realtimeUpdates);

const intervalID = setInterval(() => {
  const update = streamingDataProvider.next();
  if (update.done) {
    clearInterval(intervalID);
    return;
  }
  series.update(update.value); // 关键：用 update() 而非 setData()
}, 100);

// 按钮：滚动到实时位置
chart.timeScale().scrollToRealTime();
```

---

## 19. 多 Pane 面板 (Tutorial)

```typescript
// 创建 Series 时指定 paneIndex
const volumeSeries = chart.addSeries(HistogramSeries, {
  priceFormat: { type: 'volume' },
}, 1); // paneIndex = 1，创建第二个面板

// 移动 Series 到其他面板
volumeSeries.moveToPane(2);

// 自定义面板分隔线颜色
chart.applyOptions({
  layout: {
    panes: {
      separatorColor: '#333',
      separatorHoverColor: '#555',
      enableResize: true,
    },
  },
});

// 获取面板 API
const panes = chart.panes();
panes[1].setHeight(200);  // 设置高度
panes[1].moveTo(0);       // 移动位置

// 删除面板（也会删除其中的 Series）
chart.removePane(1);
```

---

## 20. 无限历史加载 (Tutorial)

```typescript
class Datafeed {
  private _earliestDate = new Date();
  private _data: CandlestickData[] = [];

  getBars(numberOfExtraBars: number) {
    const historicalData = generateCandleData(numberOfExtraBars, this._earliestDate);
    this._data = [...historicalData, ...this._data];
    this._earliestDate = new Date(historicalData[0].time * 1000);
    return this._data;
  }
}

const datafeed = new Datafeed();
series.setData(datafeed.getBars(200));

// 监听可见范围变化，动态加载历史
chart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
  if (logicalRange.from < 10) {
    // 快滚到左边界了，加载更多历史
    const numberBarsToLoad = 50 - logicalRange.from;
    const data = datafeed.getBars(numberBarsToLoad);
    setTimeout(() => {
      series.setData(data);
    }, 250); // 模拟加载延迟
  }
});
```

---

## 21. 技术指标示例 (Analysis Indicators)

官方提供的技术指标实现参考:
- [Simple Moving Average (SMA)](https://github.com/tradingview/lightweight-charts/tree/master/indicator-examples/src/indicators/moving-average)
- [Momentum](https://github.com/tradingview/lightweight-charts/tree/master/indicator-examples/src/indicators/momentum)
- [Correlation](https://github.com/tradingview/lightweight-charts/tree/master/indicator-examples/src/indicators/correlation)
- [Percent Change](https://github.com/tradingview/lightweight-charts/tree/master/indicator-examples/src/indicators/percent-change)

在线演示: https://tradingview.github.io/lightweight-charts/indicator-examples/
