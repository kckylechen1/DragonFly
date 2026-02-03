# L-014: Stock Workspace 股票工作台

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 2026-01-30 10:18
- ✅ 结束时间: 2026-01-30 10:25 

## 前置依赖
- L-013 (Panel Registry)

## 目标
- [ ] 创建 `components/panels/StockWorkspace.tsx`
- [ ] 实现顶部署名搜索和面板切换 Tab
- [ ] 集成 `panelRegistry` 渲染活跃面板

---

## 步骤

### Step 1: 创建 StockWorkspace.tsx

```typescript
// client/src/refactor_v2/components/panels/StockWorkspace.tsx

import React from "react";
import { Search, ChevronDown } from "lucide-react";
import { useUIStore } from "../../stores/ui.store";
import { useMarketStore } from "../../stores/market.store";
import { panelRegistry, getPanels } from "./PanelRegistry";

/**
 * 股票工作台容器
 * 
 * 作用：管理右侧的所有行情和分析面板，包含股票搜索和面板切换。
 */
export const StockWorkspace: React.FC = () => {
  const { currentSymbol, activePanelId, setActivePanelId, setCurrentSymbol } = useUIStore();
  const stockInfo = useMarketStore((s) => s.stockInfo[currentSymbol]);
  const activeTick = useMarketStore((s) => s.data[currentSymbol]);

  const activePanel = panelRegistry[activePanelId];
  const ActiveComponent = activePanel.component;

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-hidden">
      {/* 顶部工具栏：股票信息 + 搜索 */}
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              {stockInfo?.name || "加载中..."}
              <span className="text-[10px] text-gray-500 font-mono font-normal bg-gray-800 px-1.5 py-0.5 rounded">
                {currentSymbol}
              </span>
            </h2>
            <div className={`text-xs font-mono font-medium ${
              (activeTick?.change || 0) >= 0 ? "text-green-400" : "text-red-400"
            }`}>
              {activeTick?.price?.toFixed(2) || "0.00"} 
              <span className="ml-2">
                {activeTick ? `${activeTick.change > 0 ? '+' : ''}${activeTick.change.toFixed(2)} (${activeTick.changePercent.toFixed(2)}%)` : "0.00 (0.00%)"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* 面板选择 Tab */}
      <div className="h-10 border-b border-gray-800 flex items-center px-2 bg-gray-900/30 overflow-x-auto no-scrollbar">
        {getPanels().map((panel) => (
          <button
            key={panel.id}
            onClick={() => setActivePanelId(panel.id)}
            className={`
              flex items-center gap-2 px-3 h-full text-xs font-medium whitespace-nowrap transition-all border-b-2
              ${activePanelId === panel.id 
                ? "text-cyan-400 border-cyan-500 bg-cyan-500/5 shadow-[0_4px_12px_-4px_rgba(6,182,212,0.5)]" 
                : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/50"}
            `}
          >
            {panel.icon}
            {panel.title}
          </button>
        ))}
      </div>

      {/* 活跃面板内容区 */}
      <div className="flex-1 relative overflow-hidden">
        <ActiveComponent symbol={currentSymbol} />
      </div>
    </div>
  );
};

export default StockWorkspace;
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `StockWorkspace.tsx` 已创建
- [ ] 正确显示当前股票的名称、代码和实时价格
- [ ] 按钮能切换 `activePanelId` 并重新渲染对应组件
- [ ] Tab 选中态视觉效果正确（霓虹边框）
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/panels/StockWorkspace.tsx` (更新)
