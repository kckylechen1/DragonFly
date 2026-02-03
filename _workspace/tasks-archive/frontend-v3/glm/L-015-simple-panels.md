# L-015: 简单面板实现 (x5)

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- L-013 (Panel Registry)

## 目标
- [ ] 实现 `IntradayPanel.tsx` (分时)
- [ ] 实现 `OrderBookPanel.tsx` (盘口)
- [ ] 实现 `IndicatorsPanel.tsx` (指标)
- [ ] 实现 `AdvicePanel.tsx` (建议)
- [ ] 实现 `NewsPanel.tsx` (资讯)

---

## 步骤

### Step 1: 创建 IntradayPanel.tsx

使用占位渲染，Codex 的 KLineLogic 可作为参考。

```typescript
// client/src/refactor_v2/components/panels/IntradayPanel.tsx
import React from "react";
import type { PanelProps } from "../../types/panel";

const IntradayPanel: React.FC<PanelProps> = ({ symbol }) => (
  <div className="p-4 text-gray-500 flex items-center justify-center h-full font-mono text-xs">
    INTRADAY CHART FOR {symbol} (PLANNED)
  </div>
);
export default IntradayPanel;
```

### Step 2: 创建 OrderBookPanel.tsx (使用虚拟列表)

```typescript
// client/src/refactor_v2/components/panels/OrderBookPanel.tsx
import React from "react";
import type { PanelProps } from "../../types/panel";
import { useMarketStore } from "../../stores/market.store";

const OrderBookPanel: React.FC<PanelProps> = ({ symbol }) => {
  const orderbook = useMarketStore((s) => s.orderbook[symbol]);

  return (
    <div className="p-4 flex flex-col h-full bg-black/20 font-mono text-sm">
      <div className="text-xs text-gray-500 mb-2 border-b border-gray-800 pb-1">LEVEL 2 QUOTES</div>
      {/* 卖盘 */}
      <div className="flex flex-col-reverse mb-2">
        {orderbook?.asks.map(([p, v], i) => (
          <div key={i} className="flex justify-between py-0.5 hover:bg-red-500/10 transition-colors">
            <span className="text-red-400">卖 {5-i}</span>
            <span className="text-gray-300">{p.toFixed(2)}</span>
            <span className="text-gray-500">{v}</span>
          </div>
        ))}
      </div>
      <div className="h-[1px] bg-gray-800 my-2" />
      {/* 买盘 */}
      <div className="flex flex-col">
        {orderbook?.bids.map(([p, v], i) => (
          <div key={i} className="flex justify-between py-0.5 hover:bg-green-500/10 transition-colors">
            <span className="text-green-400">买 {i+1}</span>
            <span className="text-gray-300">{p.toFixed(2)}</span>
            <span className="text-gray-500">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default OrderBookPanel;
```

### Step 3: 创建 IndicatorsPanel.tsx

```typescript
// client/src/refactor_v2/components/panels/IndicatorsPanel.tsx
import React from "react";
import type { PanelProps } from "../../types/panel";
import { useMarketStore } from "../../stores/market.store";

const IndicatorsPanel: React.FC<PanelProps> = ({ symbol }) => {
  const info = useMarketStore((s) => s.stockInfo[symbol]);
  return (
    <div className="p-6 grid grid-cols-2 gap-4">
      <StatCard label="P/E (TTM)" value={info?.pe?.toFixed(2) || "--"} />
      <StatCard label="P/B" value={info?.pb?.toFixed(2) || "--"} />
      <StatCard label="Market Cap" value={info?.marketCap ? `${(info.marketCap / 1e8).toFixed(1)}亿` : "--"} />
      <StatCard label="Industry" value={info?.industry || "--"} />
    </div>
  );
};

const StatCard = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-sm font-bold text-gray-200">{value}</div>
  </div>
);
export default IndicatorsPanel;
```

### Step 4: 创建 AdvicePanel.tsx & NewsPanel.tsx (占位)

```typescript
// client/src/refactor_v2/components/panels/AdvicePanel.tsx
// client/src/refactor_v2/components/panels/NewsPanel.tsx
// 同上，创建基础占位
```

### Step 5: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] 5 个面板文件均已创建
- [ ] 导出方式符合 `PanelRegistry` 的 `import()` 预期 (使用 `export default`)
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/panels/IntradayPanel.tsx`
- `client/src/refactor_v2/components/panels/OrderBookPanel.tsx`
- `client/src/refactor_v2/components/panels/IndicatorsPanel.tsx`
- `client/src/refactor_v2/components/panels/AdvicePanel.tsx`
- `client/src/refactor_v2/components/panels/NewsPanel.tsx`
