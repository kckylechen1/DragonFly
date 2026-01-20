# 🎯 Epic: 前端重构 Phase 1 - 布局 + 主题 + 基础设施

> **状态**: ⏳ 进行中  
> **创建日期**: 2026-01-20  
> **执行者**: 🟢 Codex (过夜任务)  
> **审查者**: 🔴 Antigravity (明早)

---

## 📝 简述

将 600+ 行的 `Home.tsx` 重构为干净的四区域组件架构，引入主题系统、错误边界、可拖拽布局，并完善 AI 聊天交互。

---

## ✅ Done Definition

- [ ] 所有组件使用统一的类型契约（types/*.ts）
- [ ] Magic numbers 消除，使用 constants/layout.ts
- [ ] 四区域都有 ErrorBoundary 包裹
- [ ] 主题系统可切换（至少 2 个主题）
- [ ] 左右/上下拖拽布局可用（react-resizable-panels）
- [ ] 快捷键可用：⌘/Ctrl+K 聚焦、Esc 关闭、⌘/Ctrl+I toggle
- [ ] `pnpm check` 无错误
- [ ] UI 视觉与当前 mock 一致

---

## 📊 子任务清单

| 序号 | 任务 | Agent | 预计时间 | 依赖 | 状态 |
|------|------|-------|----------|------|------|
| T-001 | 创建 types & constants 契约文件 | 🟢 Codex | 20 min | - | ⬜ |
| T-002 | 完善 layout.store actions | 🟢 Codex | 15 min | T-001 | ⬜ |
| T-003 | 创建 ErrorBoundary 组件 | 🟢 Codex | 20 min | - | ⬜ |
| T-004 | ErrorBoundary 集成到 LayoutShell | 🟢 Codex | 15 min | T-003 | ⬜ |
| T-005 | Design Tokens CSS 文件创建 | 🟢 Codex | 25 min | - | ⬜ |
| T-006 | 主题 CSS 文件（perplexity-dark 等） | 🟢 Codex | 20 min | T-005 | ⬜ |
| T-007 | ThemeProvider 完善与入口接入 | 🟢 Codex | 30 min | T-006 | ⬜ |
| T-008 | react-resizable-panels 左右 split | 🟢 Codex | 40 min | T-002 | ⬜ |
| T-009 | react-resizable-panels 上下 split | 🟢 Codex | 30 min | T-008 | ⬜ |
| T-010 | 全局快捷键 hook (useHotkeys) | 🟢 Codex | 25 min | T-002 | ⬜ |
| T-011 | 快捷键集成到 App 层 | 🟢 Codex | 15 min | T-010 | ⬜ |
| T-012 | CenterTop 拆分子组件 | 🟢 Codex | 35 min | T-001 | ⬜ |
| T-013 | CenterBottom InfoTabPanel 骨架 | 🟢 Codex | 30 min | T-001 | ⬜ |
| T-014 | 创建 chartHistory.store | 🟢 Codex | 15 min | T-001 | ⬜ |
| T-015 | 最终集成测试页面 | 🟢 Codex | 20 min | T-001~T-014 | ⬜ |
| **--- Phase 1.5: API 对接 ---** | | | | | |
| T-016 | API Adapter 层（连接真实后端） | 🟢 Codex | 60 min | T-015 | ⬜ |
| T-017 | AI Streaming Hook | 🟢 Codex | 45 min | T-016 | ⬜ |
| R-001 | Code Review | 🔴 Antigravity | - | T-017 | ⬜ |

**总预计时间**: ~7.5 小时

---

## 🔄 执行顺序

### 🔹 Phase A: 契约与基础设施（必须先完成）
```
T-001 (types & constants)
    │
    ├── T-002 (layout.store actions)
    ├── T-003 (ErrorBoundary) → T-004 (集成)
    └── T-005 (tokens CSS) → T-006 (themes) → T-007 (ThemeProvider)
```

### 🔹 Phase B: 布局与交互（依赖 Phase A）
```
T-008 (左右 resize) → T-009 (上下 resize)
T-010 (hotkeys hook) → T-011 (集成)
```

### 🔹 Phase C: 组件完善（可与 Phase B 并行）
```
T-012 (CenterTop 拆分)
T-013 (InfoTabPanel)
T-014 (chartHistory store)
```

### 🔹 Phase D: 收尾
```
T-015 (集成测试)
```

### 🔹 Phase 1.5: API 对接（可选，基础 UI 完成后）
```
T-016 (API Adapter) → T-017 (AI Streaming)
R-001 (Review)
```

---

## 📁 目标目录结构

```
client/src/refactor_v2/
├── components/
│   ├── LayoutShell.tsx        # 已有，需改造
│   ├── LeftPane.tsx           # 已有
│   ├── CenterTop/             # 拆分
│   │   ├── index.tsx
│   │   ├── StockHeader.tsx
│   │   ├── BadgeCloud.tsx
│   │   └── FundsBar.tsx
│   ├── CenterBottom/          # 拆分
│   │   ├── index.tsx
│   │   └── InfoTabPanel.tsx
│   ├── AIChatPanel.tsx        # 已有
│   ├── FloatingAIChatInput.tsx # 已有
│   ├── StockChart.tsx         # 已有
│   └── ErrorBoundary.tsx      # 新增
├── stores/
│   ├── aiChat.store.ts        # 已有
│   ├── layout.store.ts        # 需完善
│   ├── watchlist.store.ts     # 已有
│   └── chartHistory.store.ts  # 新增
├── types/
│   ├── ai.ts                  # 新增
│   ├── chart.ts               # 新增
│   └── watchlist.ts           # 新增
├── constants/
│   └── layout.ts              # 新增
├── hooks/
│   └── useHotkeys.ts          # 新增
├── styles/
│   ├── tokens.css             # 新增
│   └── themes/
│       ├── perplexity-dark.css
│       ├── zed-dark.css
│       └── cursor.css
└── api/                       # Phase 1.5 新增
    ├── index.ts
    ├── types.ts               # RouterOutputs 类型推导
    ├── stocks.ts              # 股票 API adapter
    ├── watchlist.ts           # 自选股 API adapter
    ├── market.ts              # 市场 API adapter
    ├── ai.ts                  # AI 非流式 API
    └── aiStream.ts            # AI 流式对话 hook
```

---

## ⚠️ 执行注意事项（给 Codex）

1. **遵循 AGENTS.md**：使用 pnpm，遵循代码风格
2. **每完成一个任务后运行**：`pnpm check` 确保类型正确
3. **不要一次性大改**：按任务顺序逐步执行
4. **遇到阻塞立即停止**：在任务文件中记录问题
5. **保持 UI 一致**：重构后视觉效果应与当前 mock 完全一致
6. **Magic numbers 全部替换**：384、280 等数字必须来自 constants

---

## 📋 验收清单

- [ ] `pnpm check` 通过
- [ ] 主题切换有效（深色/浅色）
- [ ] 左侧面板可拖拽调整宽度
- [ ] 上下分割可拖拽
- [ ] ⌘/Ctrl+K 聚焦 AI 输入框
- [ ] Esc 关闭 AI 面板
- [ ] 单个 pane 抛错不影响其他区域
- [ ] 刷新后布局尺寸保持

---

> **文档版本**: v1.0  
> **创建者**: 🟣 Amp  
> **执行模式**: 模式 C - 过夜执行
