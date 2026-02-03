# L-005: 可折叠 Sidebar（Manus 风格）

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- L-004 (Stores)

## 目标
- [ ] 创建可折叠的侧边栏组件
- [ ] 使用 framer-motion 实现平滑动画
- [ ] 支持 60px ↔ 280px 切换
- [ ] 底部设置按钮

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 29-148 行

---

## 步骤

### Step 1: 创建目录

```bash
mkdir -p client/src/refactor_v2/components/layout
```

### Step 2: 创建 Sidebar.tsx

```typescript
// client/src/refactor_v2/components/layout/Sidebar.tsx

import React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  Search,
  Library,
  Star,
} from "lucide-react";
import { useUIStore } from "../../stores/ui.store";

/**
 * 侧边栏菜单项
 */
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  collapsed,
  onClick,
  active = false,
}) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 
      hover:bg-gray-800 transition-colors
      ${active ? "bg-gray-800 text-cyan-400" : "text-gray-300"}
    `}
    title={collapsed ? label : undefined}
  >
    {icon}
    {!collapsed && <span className="text-sm">{label}</span>}
  </button>
);

/**
 * 可折叠侧边栏（Manus 风格）
 */
export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, openSettings } = useUIStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 60 : 280 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden"
    >
      {/* 顶部 Logo + 折叠按钮 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!sidebarCollapsed && (
          <span className="text-lg font-semibold text-white">DragonFly</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-gray-800 transition-colors"
          aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={20} className="text-gray-400" />
          ) : (
            <ChevronLeft size={20} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-2">
        <SidebarItem
          icon={<Plus size={20} />}
          label="新建对话"
          collapsed={sidebarCollapsed}
        />
        <SidebarItem
          icon={<Search size={20} />}
          label="搜索"
          collapsed={sidebarCollapsed}
        />
        <SidebarItem
          icon={<Library size={20} />}
          label="历史记录"
          collapsed={sidebarCollapsed}
        />

        {/* 自选股列表 - 只在展开时显示 */}
        {!sidebarCollapsed && (
          <div className="mt-4 px-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Star size={12} />
              <span>自选股</span>
            </div>
            <div className="space-y-1">
              {/* 自选股列表项将从 store 获取 */}
              <div className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded cursor-pointer">
                AAPL - 苹果
              </div>
              <div className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded cursor-pointer">
                GOOGL - 谷歌
              </div>
            </div>
          </div>
        )}

        {/* 最近对话 - 只在展开时显示 */}
        {!sidebarCollapsed && (
          <div className="mt-4 px-4">
            <div className="text-xs text-gray-500 mb-2">最近对话</div>
            <div className="space-y-1">
              <div className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded cursor-pointer truncate">
                分析茅台走势...
              </div>
              <div className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded cursor-pointer truncate">
                比较腾讯和阿里...
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 底部设置按钮 */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={openSettings}
          className="w-full flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition-colors text-gray-300"
          aria-label="设置"
        >
          <Settings size={20} />
          {!sidebarCollapsed && <span className="text-sm">设置</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
```

### Step 3: 创建 layout/index.ts

```typescript
// client/src/refactor_v2/components/layout/index.ts

export { Sidebar } from "./Sidebar";
```

### Step 4: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `Sidebar.tsx` 已创建
- [ ] 使用 framer-motion 动画
- [ ] 折叠时宽度 60px，展开时 280px
- [ ] 有底部设置按钮
- [ ] 所有按钮有 aria-label
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/layout/Sidebar.tsx`
- `client/src/refactor_v2/components/layout/index.ts`
