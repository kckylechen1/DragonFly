# D-000: 性能模式切换组件

## 负责人: 🟠 Droid
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## ⚠️ Oracle P0 护栏 - 视觉降级交互

## 目标
- [ ] 创建 `components/settings/PerformanceModeToggle.tsx`
- [ ] 实现三档性能切换的 UI
- [ ] 接入 `usePerformanceStore`

---

## 步骤

### Step 1: 创建 PerformanceModeToggle.tsx

```typescript
// client/src/refactor_v2/components/settings/PerformanceModeToggle.tsx

import React from "react";
import { Zap, ZapOff, Sparkles } from "lucide-react";
import { usePerformanceStore, PerformanceMode } from "../../stores/performance.store";

export const PerformanceModeToggle: React.FC = () => {
  const { performanceMode, setPerformanceMode } = usePerformanceStore();

  const modes: { id: PerformanceMode; label: string; icon: any; desc: string }[] = [
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
```

---

## 验收标准

- [ ] `PerformanceModeToggle.tsx` 已创建
- [ ] 点击按钮能正确更新 `performanceMode`
- [ ] UI 符合整体赛博风格
- [ ] `pnpm check` 通道

---

## 产出文件

- `client/src/refactor_v2/components/settings/PerformanceModeToggle.tsx`
