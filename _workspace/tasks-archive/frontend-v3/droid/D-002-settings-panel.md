# D-002: 设置面板实现

## 负责人: 🟠 Droid
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 目标
- [ ] 实现 `components/settings/SettingsModal.tsx`
- [ ] 包含：外观（深浅色）、交易设置、API 配置分栏
- [ ] 对接 `useUIStore` 的 `settingsOpen` 状态

---

## 步骤

### Step 1: 创建 SettingsModal.tsx

```typescript
// client/src/refactor_v2/components/settings/SettingsModal.tsx

import React from "react";
import { X, Moon, Sun, Shield, Cpu, Bell } from "lucide-react";
import { useUIStore } from "../../stores/ui.store";

export const SettingsModal: React.FC = () => {
  const { settingsOpen: open, closeSettings } = useUIStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex h-[500px] overflow-hidden">
        {/* 左侧导航 */}
        <div className="w-48 border-r border-gray-800 bg-gray-900/50 p-4 space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Settings</h3>
          <NavBtn icon={<Monitor size={16} />} label="外观设置" active />
          <NavBtn icon={<Shield size={16} />} label="交易偏好" />
          <NavBtn icon={<Cpu size={16} />} label="API 连接" />
          <NavBtn icon={<Bell size={16} />} label="通知策略" />
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">外观设置</h2>
            <button onClick={closeSettings} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* 主题选择 */}
            <section>
              <h4 className="text-xs font-medium text-gray-400 mb-4">颜色主题</h4>
              <div className="grid grid-cols-2 gap-4">
                <ThemeCard icon={<Moon className="text-cyan-400" />} label="深邃模式" sub="默认暗色" active />
                <ThemeCard icon={<Sun className="text-amber-400" />} label="明亮模式" sub="高对比度" />
              </div>
            </section>

            {/* 界面缩放 */}
            <section>
              <h4 className="text-xs font-medium text-gray-400 mb-4">界面缩放</h4>
              <input type="range" className="w-full accent-cyan-500" />
              <div className="flex justify-between text-[10px] text-gray-600 mt-2">
                 <span>80%</span>
                 <span>100%</span>
                 <span>120%</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavBtn = ({ icon, label, active = false }: any) => (
  <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
    active ? "bg-cyan-500/10 text-cyan-400" : "text-gray-500 hover:bg-gray-800"
  }`}>
    {icon} {label}
  </button>
);

const ThemeCard = ({ icon, label, sub, active = false }: any) => (
  <div className={`p-4 rounded-xl border cursor-pointer transition-all ${
    active ? "bg-cyan-500/5 border-cyan-500/50 shadow-lg" : "bg-gray-800/50 border-gray-800 hover:border-gray-700"
  }`}>
    <div className="mb-2">{icon}</div>
    <div className="text-xs font-semibold text-gray-200">{label}</div>
    <div className="text-[10px] text-gray-500">{sub}</div>
  </div>
);
```

### Step 2: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `SettingsModal.tsx` 已创建
- [ ] 界面符合赛博暗黑风格
- [ ] 导出正确
- [ ] `pnpm check` 通过
