# L-012: Chat Action Button 意图联动按钮

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 2026-01-30 10:10
- ✅ 结束时间: 2026-01-30 10:13 

## 前置依赖
- L-010 (Message Card)

## 目标
- [ ] 创建 `ActionButton.tsx` 组件
- [ ] 实现意图联动功能（点击按钮切换右侧面板）
- [ ] 支持内置指令如 `[查看 AAPL 的 K线]`

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 11-13 行 (意图驱动面板联动)

---

## 步骤

### Step 1: 创建 ActionButton.tsx

```typescript
// client/src/refactor_v2/components/chat/ActionButton.tsx

import React from "react";
import { Link2 } from "lucide-react";
import { useUIStore } from "../../stores/ui.store";
import type { PanelId } from "../../types/panel";

interface ActionButtonProps {
  label: string;
  symbol: string;
  panelId: PanelId;
}

/**
 * 意图联动按钮组件
 * 
 * 作用：在 AI 对话中提供直接查看特定股票面板的捷径。
 * 点击后会自动更新 UI store 中的当前股票和激活面板，从而联动右侧工作台。
 */
export const ActionButton: React.FC<ActionButtonProps> = ({ label, symbol, panelId }) => {
  const { setCurrentSymbol, setActivePanelId } = useUIStore();

  const handleClick = () => {
    setCurrentSymbol(symbol);
    setActivePanelId(panelId);
    
    // 可以在这里添加一些提示或埋点
    console.log(`Navigating to ${symbol} - ${panelId}`);
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/15 transition-all group active:scale-95"
    >
      <Link2 size={12} className="group-hover:rotate-12 transition-transform" />
      {label}
    </button>
  );
};

export default ActionButton;
```

### Step 2: 验证接入

在 Markdown 渲染中，可以正则匹配特定格式并拦截渲染为 ActionButton（这是一个进阶逻辑，目前先确保组件就绪）。

### Step 3: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `ActionButton.tsx` 已创建
- [ ] 点击按钮能正确调用 `setCurrentSymbol` 和 `setActivePanelId`
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/chat/ActionButton.tsx`
