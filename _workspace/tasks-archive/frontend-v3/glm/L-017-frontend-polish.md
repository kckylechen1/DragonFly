# L-017: 前端 V3 细节抛光与后端集成

## 负责人: 🟠 Droid
## 状态
- ⏱️ 开始时间: 2026-01-30 11:00
- ✅ 结束时间: 2026-01-30 11:25
- 📊 代码量: +357 / -66

---

## 📋 任务概述

基于用户反馈，对 V3 界面进行以下 4 项优化：
1. **消除间距**: 优化对话框与侧边栏之间的空隙，调整 Chat 内容的对齐方式。
2. **主题切换**: 在侧边栏或设置中加入 Light/Dark 模式按钮。
3. **后端连接**: 将聊天界面与后端 Analysis Agent 联通。
4. **自选股分组**: 在侧边栏增加“自选股分组”和“持仓”入口。

---

## 步骤

### Step 1: 优化间距 & 视觉 (UI/UX Pro Max)

**目标**: 消除不协调的空隙，实现无框沉浸式设计。

修改 `client/src/refactor_v2/components/layout/MainLayout.tsx`:
- 移除 `PanelGroup` 的默认 margin/padding。
- 确保 `Sidebar` 和 `ChatWorkspace` 之间仅通过 `border-r border-white/5` 分隔，无物理空隙。
- **Glassmorphism**: 确保所有面板背景使用 `bg-gray-950` 或 `bg-black`，避免浑浊的灰色。

修改 `client/src/refactor_v2/components/chat/ChatInput.tsx`:
- 遵循 **Floating Navbar** 规则: `bottom-6 left-1/2 -translate-x-1/2` (悬浮居中) 或 `max-w-4xl mx-auto mb-6`。
- **Shadow**: 添加 `shadow-2xl shadow-cyan-900/10` 提升层次感。
- **Backdrop**: 输入框背景使用 `bg-gray-900/80 backdrop-blur-md`。

### Step 2: 侧边栏优化 (Sidebar Polish)

修改 `client/src/refactor_v2/components/layout/Sidebar.tsx`:
- **Theme Toggle**: 在底部设置栏上方添加基础 `Light/Dark` 切换按钮 (参考 `ThemeSwitcher` 实现)。
- **Watchlist**:
    - 使用 **Progressive Disclosure** (手风琴折叠) 展示分组。
    - **Icons**:
        - "自选股" -> `Star`
        - "持仓" -> `Briefcase` (Portfolio)
        - "分组 1/2" -> `Folder`
    - **Visual Indicator**: 持仓股票显示即时盈亏颜色 (红点/绿点)。

### Step 3: 后端集成 (Real Analysis)

修改 `client/src/refactor_v2/components/chat/ChatWorkspace.tsx`:
- 集成 `useStreamingChat`。
- **Loading State**: 在等待 AI 响应时显示 "Thinking..." 骨架屏或波形动画。
- **Error State**: 网络错误时显示优雅的 Toast 提示 (Sonner)。

### Step 4: 自选股分组数据结构

修改 `client/src/refactor_v2/stores/watchlist.store.ts` (如有) 或 mock 数据:
- 结构:
  ```typescript
  interface WatchlistGroup {
    id: string;
    name: string;
    type: 'favorites' | 'portfolio' | 'custom';
    items: string[]; // icons
  }
  ```

---

## 验收标准
- [ ] 间距问题解决：对话内容与边框比例和谐，无突兀空隙。
- [ ] 主题切换可用：点击按钮可实时在深色/浅色间切换。
- [ ] 聊天通了：输入问题能得到 AI 后端的回复。
- [ ] 侧边栏结构更新：显示清晰的分组逻辑。

## 产出文件
```
client/src/refactor_v2/components/layout/Sidebar.tsx
client/src/refactor_v2/components/layout/MainLayout.tsx
client/src/refactor_v2/components/chat/ChatWorkspace.tsx
client/src/refactor_v2/components/chat/ChatInput.tsx
```
