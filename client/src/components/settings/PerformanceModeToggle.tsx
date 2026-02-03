/**
 * D-000: Performance Mode Toggle Component
 * 开始时间: 2026-01-30 00:37:14
 */

import { Zap, ZapOff, Sparkles } from "lucide-react";
import { usePerformanceStore, PerformanceMode } from "../../stores/performance.store";

export const PerformanceModeToggle: React.FC = () => {
  const { performanceMode, setPerformanceMode } = usePerformanceStore();

  const modes: { id: PerformanceMode; label: string; icon: typeof Sparkles; desc: string }[] = [
    { id: 'full', label: '极致', icon: Sparkles, desc: '开启所有毛玻璃和霓虹效果' },
    { id: 'reduced', label: '均衡', icon: Zap, desc: '禁用高负载滤镜，保持动画' },
    { id: 'minimal', label: '性能', icon: ZapOff, desc: '禁用所有特效，极致响应' },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-gray-400">渲染性能模式</h4>
      <div className="grid grid-cols-3 gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setPerformanceMode(m.id)}
            className={`
              flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
              ${performanceMode === m.id
                ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-900/20"
                : "bg-gray-800/50 border-gray-800 text-gray-500 hover:border-gray-700"}
            `}
          >
            <m.icon size={18} />
            <div className="text-[11px] font-bold">{m.label}</div>
            <div className="text-[9px] opacity-40 text-center leading-tight">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PerformanceModeToggle;
