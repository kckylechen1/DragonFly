# T-015: 最终集成测试页面

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-001 ~ T-014 全部完成

## 目标
- [ ] 确保所有组件正确集成
- [ ] 创建完整的测试页面
- [ ] 运行 pnpm check 确保无错误
- [ ] 验证所有功能正常

---

## 步骤

### Step 1: 更新组件导出索引

```typescript
// client/src/refactor_v2/components/index.ts

// Layout
export * from "./LayoutShell";
export * from "./ErrorBoundary";

// Panels
export * from "./LeftPane";
export * from "./CenterTop";
export * from "./CenterBottom";
export * from "./AIChatPanel";
export * from "./FloatingAIChatInput";

// Chart
export * from "./StockChart";

// Theme
export * from "./ThemeSwitcher";

// Optional
export * from "./RecentlyViewed";
```

### Step 2: 确保 HomePage 正确组装所有组件

```typescript
// client/src/refactor_v2/pages/HomePage.tsx

import React, { useRef } from "react";
import { LayoutShell } from "@/refactor_v2/components/LayoutShell";
import { LeftPane } from "@/refactor_v2/components/LeftPane";
import { CenterTop } from "@/refactor_v2/components/CenterTop";
import { CenterBottom } from "@/refactor_v2/components/CenterBottom";
import { AIChatPanel } from "@/refactor_v2/components/AIChatPanel";
import {
  FloatingAIChatInput,
  FloatingAIChatInputHandle,
} from "@/refactor_v2/components/FloatingAIChatInput";
import { useAppHotkeys } from "@/refactor_v2/hooks";

export const HomePage: React.FC = () => {
  const aiInputRef = useRef<FloatingAIChatInputHandle>(null);

  // Register app-level hotkeys
  useAppHotkeys({ aiInputRef });

  return (
    <LayoutShell
      left={<LeftPane />}
      centerTop={<CenterTop />}
      centerBottom={<CenterBottom />}
      right={<AIChatPanel />}
      floatingElement={<FloatingAIChatInput ref={aiInputRef} />}
    />
  );
};

export default HomePage;
```

### Step 3: 创建 App 入口包装器

```typescript
// client/src/refactor_v2/App.tsx

import React from "react";
import { ThemeProvider } from "@/refactor_v2/contexts/ThemeContext";
import { HomePage } from "@/refactor_v2/pages/HomePage";

// Import styles
import "@/refactor_v2/styles/tokens.css";
import "@/refactor_v2/styles/themes/index.css";

export const RefactorApp: React.FC = () => {
  return (
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  );
};

export default RefactorApp;
```

### Step 4: 创建测试路由（如果使用 React Router）

如果项目使用 React Router，可以添加一个临时路由来测试重构后的页面：

```typescript
// 在路由配置中添加
// 例如 client/src/routes.tsx 或类似文件

// 添加测试路由
{
  path: "/refactor-test",
  element: <RefactorApp />,
}
```

或者直接在 main.tsx 中临时替换：

```typescript
// client/src/main.tsx (临时测试用)

import React from "react";
import ReactDOM from "react-dom/client";
import { RefactorApp } from "@/refactor_v2/App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RefactorApp />
  </React.StrictMode>
);
```

### Step 5: 运行完整检查

```bash
# 类型检查
pnpm check

# 如果有 lint
pnpm lint

# 尝试构建
pnpm build
```

### Step 6: 手动验证清单

在浏览器中验证以下功能：

**布局功能**
- [ ] 页面正常显示三栏布局
- [ ] 左侧面板可拖拽调整宽度
- [ ] 上下分割线可拖拽
- [ ] 刷新后布局尺寸保持

**主题功能**
- [ ] 主题切换器显示在左上角
- [ ] 可以切换 5 个主题
- [ ] 主题切换即时生效
- [ ] 刷新后主题保持

**AI 功能**
- [ ] 底部 AI 输入框显示
- [ ] 输入内容按 Enter 发送
- [ ] 发送后右侧面板滑出
- [ ] 面板内显示消息
- [ ] 可以关闭面板

**快捷键**
- [ ] ⌘/Ctrl + K 聚焦 AI 输入框
- [ ] ⌘/Ctrl + I 切换 AI 面板
- [ ] Esc 关闭 AI 面板

**Tab 面板**
- [ ] 4 个 Tab 可点击切换
- [ ] Tab 内容正确显示
- [ ] 左右箭头键可切换 Tab

**错误隔离**
- [ ] （可选）人为触发某区域错误，确认其他区域不受影响

### Step 7: 创建完成报告

创建一个简单的完成状态文件：

```markdown
<!-- client/src/refactor_v2/REFACTOR-STATUS.md -->

# 重构 Phase 1 完成状态

## 完成日期
2026-01-20

## 完成任务
- [x] T-001: types & constants 契约
- [x] T-002: layout.store actions
- [x] T-003: ErrorBoundary 组件
- [x] T-004: ErrorBoundary 集成
- [x] T-005: Design Tokens CSS
- [x] T-006: 主题 CSS 文件
- [x] T-007: ThemeProvider
- [x] T-008: 左右 resize
- [x] T-009: 上下 resize
- [x] T-010: useHotkeys hook
- [x] T-011: 快捷键集成
- [x] T-012: CenterTop 拆分
- [x] T-013: InfoTabPanel
- [x] T-014: chartHistory store
- [x] T-015: 最终集成

## 验证结果
- pnpm check: ✅ 通过
- pnpm build: ✅ 通过
- 功能测试: ✅ 通过

## 已知问题
(记录任何发现的问题)

## 下一步
- Phase 2: 左侧分组自选股
- Phase 3: 底部 Tab 真实内容
```

---

## 验收标准

- [ ] 所有组件正确导出
- [ ] HomePage 正确组装
- [ ] RefactorApp 入口可用
- [ ] `pnpm check` 无错误
- [ ] 手动验证所有功能
- [ ] REFACTOR-STATUS.md 已创建

---

## 产出文件

- `client/src/refactor_v2/components/index.ts`
- `client/src/refactor_v2/pages/HomePage.tsx` (确认)
- `client/src/refactor_v2/App.tsx`
- `client/src/refactor_v2/REFACTOR-STATUS.md`

---

## ⚠️ 任务完成后

1. 运行 `pnpm check` 确保无类型错误
2. 运行 `pnpm build` 确保可构建
3. 在 REFACTOR-STATUS.md 中记录所有任务状态
4. 如有任何问题，在该文件中详细记录
5. **等待 Amp 进行 Code Review**
