# L-006: MainLayout + 拖拽分割

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- L-005 (Sidebar)

## 目标
- [ ] 创建 MainLayout 组件
- [ ] 使用 react-resizable-panels 实现拖拽分割
- [ ] 支持自动持久化宽度
- [ ] 霓虹拖拽手柄样式

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 152-247 行

---

## 步骤

### Step 1: 创建 MainLayout.tsx

```typescript
// client/src/refactor_v2/components/layout/MainLayout.tsx

import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Sidebar } from "./Sidebar";
import { ChatWorkspace } from "../chat/ChatWorkspace";
import { StockWorkspace } from "../panels/StockWorkspace";

/**
 * 主布局组件
 * 三栏结构：Sidebar | Chat Workspace | Stock Workspace
 * 对话区和股票区之间可拖拽调整宽度
 */
export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen flex bg-gray-950">
      {/* 可折叠侧边栏 */}
      <Sidebar />

      {/* 主内容区：可拖拽分割 */}
      <PanelGroup
        direction="horizontal"
        autoSaveId="dragonfly-main-layout" // 自动持久化到 localStorage
        className="flex-1"
      >
        {/* 对话工作区 */}
        <Panel
          id="chat-panel"
          defaultSize={50}
          minSize={30}
          maxSize={70}
          className="flex flex-col bg-gray-900"
        >
          <ChatWorkspace />
        </Panel>

        {/* 拖拽手柄 */}
        <PanelResizeHandle className="w-1.5 bg-gray-800 hover:bg-cyan-500/50 transition-colors cursor-col-resize group relative">
          {/* 霓虹发光效果 */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-cyan-400/20 blur-sm transition-opacity" />
          {/* 中心指示器 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-600 group-hover:bg-cyan-400 rounded-full transition-colors" />
        </PanelResizeHandle>

        {/* 股票工作区 */}
        <Panel
          id="stock-panel"
          defaultSize={50}
          minSize={25}
          maxSize={60}
          className="flex flex-col bg-gray-900"
        >
          <StockWorkspace />
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default MainLayout;
```

### Step 2: 创建占位组件（避免导入错误）

如果 ChatWorkspace 和 StockWorkspace 还不存在，先创建占位：

```typescript
// client/src/refactor_v2/components/chat/ChatWorkspace.tsx

import React from "react";

export const ChatWorkspace: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      Chat Workspace (TODO)
    </div>
  );
};

export default ChatWorkspace;
```

```typescript
// client/src/refactor_v2/components/panels/StockWorkspace.tsx

import React from "react";

export const StockWorkspace: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      Stock Workspace (TODO)
    </div>
  );
};

export default StockWorkspace;
```

### Step 3: 更新 layout/index.ts

```typescript
// client/src/refactor_v2/components/layout/index.ts

export { Sidebar } from "./Sidebar";
export { MainLayout } from "./MainLayout";
```

### Step 4: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `MainLayout.tsx` 已创建
- [ ] 使用 `react-resizable-panels`
- [ ] 有 `autoSaveId` 实现持久化
- [ ] 拖拽手柄有霓虹发光效果
- [ ] 设置了 minSize 和 maxSize
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/layout/MainLayout.tsx`
- `client/src/refactor_v2/components/layout/index.ts` (更新)
- `client/src/refactor_v2/components/chat/ChatWorkspace.tsx` (占位)
- `client/src/refactor_v2/components/panels/StockWorkspace.tsx` (占位)
