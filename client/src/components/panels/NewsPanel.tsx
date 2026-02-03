/**
 * L-015: NewsPanel - 资讯面板
 * 开始时间: 2026-01-30 00:45:00
 */

import type { PanelProps } from "../../types/panel";

const NewsPanel: React.FC<PanelProps> = ({ symbol }) => (
  <div className="p-4 text-gray-500 flex items-center justify-center h-full font-mono text-xs">
    NEWS FOR {symbol} (PLANNED)
  </div>
);

export default NewsPanel;
