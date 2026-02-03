# L-016: 切换至 Frontend V3 核心布局

## 负责人: 🟠 Droid
## 状态
- ⏱️ 开始时间: 2026-01-30 10:30
- ✅ 结束时间: 2026-01-30 10:35 

---

## 📋 任务概述

将 `HomePage.tsx` 从旧的 `LayoutShell` 切换到 GLM 和 Droid 之前完成的 `MainLayout` (3 栏结构)。同时整合 `SettingsModal` 到页面根部，并保留热键逻辑。

## 步骤

### Step 1: 更新 HomePage.tsx

```tsx
// client/src/refactor_v2/pages/HomePage.tsx
import React, { useRef } from "react";
import { MainLayout } from "@/refactor_v2/components/layout/MainLayout";
import { SettingsModal } from "@/refactor_v2/components/settings/SettingsModal";
import { 
  FloatingAIChatInput, 
  FloatingAIChatInputHandle 
} from "@/refactor_v2/components/FloatingAIChatInput";
import { useAppHotkeys } from "@/refactor_v2/hooks";

export const HomePage: React.FC = () => {
  const aiInputRef = useRef<FloatingAIChatInputHandle>(null);

  // 保留全局快捷键支持 (Cmd+K 等)
  useAppHotkeys({ aiInputRef });

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 1. 主 3 栏布局 (Sidebar | Chat | Stock) */}
      <MainLayout />

      {/* 2. 全局设置弹窗 (由 ui.store 控制) */}
      <SettingsModal />

      {/* 3. 悬浮 AI 输入框 (可选，由快捷键触发) */}
      <FloatingAIChatInput ref={aiInputRef} />
    </div>
  );
};

export default HomePage;
```

---

## 验收标准
- [ ] `HomePage.tsx` 成功导入并使用 `MainLayout`
- [ ] 页面显示 3 栏结构 (Sidebar 在最左侧)
- [ ] `SettingsModal` 已添加到 DOM 中
- [ ] 点击 Sidebar 底部的 "设置" 按钮能弹出设置界面
- [ ] `pnpm check` 类型检查通过

## 产出文件
```
client/src/refactor_v2/pages/HomePage.tsx
```
