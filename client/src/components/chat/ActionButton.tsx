/**
 * ActionButton - 意图联动按钮组件
 *
 * 负责人: 🔵 GLM
 * ⏱️ 开始时间: 2026-01-30 10:10
 * ⏱️ 结束时间: 2026-01-30 10:13
 */

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
export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  symbol,
  panelId,
}) => {
  const { setCurrentSymbol, setActivePanelId } = useUIStore();

  const handleClick = () => {
    setCurrentSymbol(symbol);
    setActivePanelId(panelId);
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
