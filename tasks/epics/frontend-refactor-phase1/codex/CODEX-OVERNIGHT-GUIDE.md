# 🟢 Codex 过夜任务指南

> **Epic**: frontend-refactor-phase1  
> **执行模式**: 模式 C - 过夜执行  
> **预计时间**: ~5.5 小时  
> **开始时间**: 2026-01-20 晚

---

## 📋 任务概述

你需要完成 DragonFly 前端重构的 Phase 1，将 600+ 行的 `Home.tsx` 重构为干净的四区域组件架构。

**工作目录**: `client/src/refactor_v2/`

---

## 🔴 重要规则

1. **按顺序执行任务** - 不要跳过任务，依赖关系很重要
2. **每完成一个任务后尝试运行 `pnpm check`** - 确保无类型错误
3. **遇到阻塞时区分处理**：
   - ⏭️ **环境问题**（pnpm找不到、npm安装失败）：**跳过验证，记录问题，继续写代码**
   - 🛑 **代码问题**（TypeScript错误、导入失败）：**尝试修复，修复不了再记录并继续**
4. **不要修改 refactor_v2 目录外的文件** - 除了入口文件的导入
5. **保持 UI 一致** - 重构后视觉效果应与当前 mock 完全一致
6. **优先完成任务，验证其次** - 过夜任务的目标是完成代码，验证可以明早补

---

## 📚 使用 Context7 MCP 查询文档

在编写代码时，**强烈建议使用 context7 MCP 查询最新文档**。这能帮助你获取正确的 API 用法。

### 常用查询示例

```
# 查询 React 文档
resolve-library-id: "react"
query-docs: libraryId="/facebook/react", query="useCallback hook usage"

# 查询 Zustand 文档
resolve-library-id: "zustand"
query-docs: libraryId="/pmndrs/zustand", query="persist middleware usage"

# 查询 react-resizable-panels 文档
resolve-library-id: "react-resizable-panels"
query-docs: query="PanelGroup resize handle styling"

# 查询 Tailwind CSS v4 文档
resolve-library-id: "tailwindcss"
query-docs: query="CSS variables custom properties"
```

### 推荐查询时机

- 使用不熟悉的库 API 时
- 遇到类型错误时
- 需要了解最佳实践时

---

## 🚨 问题记录模板

如果遇到无法解决的问题，在 `client/src/refactor_v2/REFACTOR-STATUS.md` 中记录：

```markdown
### 🔴 阻塞: T-XXX

**时间**: YYYY-MM-DD HH:MM
**问题描述**: 简述遇到的问题
**错误信息**: 
\`\`\`
粘贴完整错误信息
\`\`\`
**尝试的解决方案**: 
1. ...
2. ...
**建议**: 需要 Amp Review 协助
```

---

## 📊 任务执行顺序

### Phase A: 契约与基础设施（先做这些！）

```
T-001 → T-002 → T-003 → T-004
         ↘
          T-005 → T-006 → T-007
```

| 顺序 | 任务 | 文件 | 预计时间 |
|------|------|------|----------|
| 1 | T-001 | T-001-types-constants.md | 20 min |
| 2 | T-002 | T-002-layout-store-actions.md | 15 min |
| 3 | T-003 | T-003-error-boundary.md | 20 min |
| 4 | T-004 | T-004-error-boundary-integration.md | 15 min |
| 5 | T-005 | T-005-design-tokens.md | 25 min |
| 6 | T-006 | T-006-theme-css-files.md | 20 min |
| 7 | T-007 | T-007-theme-provider.md | 30 min |

### Phase B: 布局与交互

| 顺序 | 任务 | 文件 | 预计时间 |
|------|------|------|----------|
| 8 | T-008 | T-008-resizable-left-right.md | 40 min |
| 9 | T-009 | T-009-resizable-top-bottom.md | 30 min |
| 10 | T-010 | T-010-hotkeys-hook.md | 25 min |
| 11 | T-011 | T-011-hotkeys-integration.md | 15 min |

### Phase C: 组件完善

| 顺序 | 任务 | 文件 | 预计时间 |
|------|------|------|----------|
| 12 | T-012 | T-012-center-top-split.md | 35 min |
| 13 | T-013 | T-013-info-tab-panel.md | 30 min |
| 14 | T-014 | T-014-chart-history-store.md | 15 min |

### Phase D: 收尾

| 顺序 | 任务 | 文件 | 预计时间 |
|------|------|------|----------|
| 15 | T-015 | T-015-final-integration.md | 20 min |

### Phase 1.5: API 对接（可选，基础完成后）

| 顺序 | 任务 | 文件 | 预计时间 |
|------|------|------|----------|
| 16 | T-016 | T-016-api-adapter-layer.md | 60 min |
| 17 | T-017 | T-017-ai-streaming-hook.md | 45 min |

---

## 🛠️ 每个任务的执行步骤

1. **读取任务文件**：`tasks/epics/frontend-refactor-phase1/codex/T-XXX-*.md`
2. **理解目标**：查看任务的目标清单
3. **执行步骤**：按照 Step 1, Step 2... 依次执行
4. **验证**：运行 `pnpm check`
5. **确认验收标准**：检查所有验收项是否满足
6. **进入下一个任务**

---

## 🔧 常用命令

### ⚠️ 首先确保 pnpm 可用

```bash
# 检查 pnpm 是否可用
which pnpm || npm install -g pnpm@10.27.0

# 如果上述命令失败，使用 corepack
corepack enable && corepack prepare pnpm@10.27.0 --activate

# 验证
pnpm --version
```

### 常规命令

```bash
# ⚠️ 只检查 refactor_v2 目录（避免其他文件的类型错误阻塞）
npx tsc --noEmit client/src/refactor_v2/**/*.ts client/src/refactor_v2/**/*.tsx 2>/dev/null || echo "部分类型错误，继续执行"

# 如果上面命令报错太多，直接跳过验证继续下一个任务
# 验证可以明早统一做

# 构建测试（可选）
pnpm build

# 启动开发服务器（可选，用于视觉验证）
pnpm dev

# 查看当前目录结构
ls -la client/src/refactor_v2/
```

> ⚠️ **重要**: `pnpm check` 会检查整个项目，可能被其他文件的错误阻塞。  
> 如果 `pnpm check` 失败且错误不在 `refactor_v2/` 目录下，**跳过验证继续下一个任务**。


---

## 📁 最终目录结构

完成后，`client/src/refactor_v2/` 应该是这样：

```
refactor_v2/
├── App.tsx                    # 入口组件
├── REFACTOR-STATUS.md         # 完成状态
├── components/
│   ├── index.ts               # 组件导出
│   ├── LayoutShell.tsx
│   ├── ErrorBoundary.tsx
│   ├── LeftPane.tsx
│   ├── CenterTop/
│   │   ├── index.tsx
│   │   ├── StockHeader.tsx
│   │   ├── BadgeCloud.tsx
│   │   └── FundsBar.tsx
│   ├── CenterBottom/
│   │   ├── index.tsx
│   │   ├── InfoTabPanel.tsx
│   │   ├── types.ts
│   │   └── tabs/
│   │       ├── index.ts
│   │       ├── NewsTab.tsx
│   │       ├── FundamentalTab.tsx
│   │       ├── SentimentTab.tsx
│   │       └── TechnicalTab.tsx
│   ├── AIChatPanel.tsx
│   ├── FloatingAIChatInput.tsx
│   ├── StockChart.tsx
│   ├── ThemeSwitcher.tsx
│   └── RecentlyViewed.tsx     # 可选
├── stores/
│   ├── index.ts
│   ├── aiChat.store.ts
│   ├── layout.store.ts
│   ├── watchlist.store.ts
│   └── chartHistory.store.ts
├── types/
│   ├── index.ts
│   ├── ai.ts
│   ├── chart.ts
│   └── watchlist.ts
├── constants/
│   └── layout.ts
├── hooks/
│   ├── index.ts
│   ├── useHotkeys.ts
│   └── useAppHotkeys.ts
├── contexts/
│   └── ThemeContext.tsx
├── pages/
│   ├── index.ts
│   └── HomePage.tsx
└── styles/
    ├── tokens.css
    └── themes/
        ├── index.css
        ├── perplexity-dark.css
        ├── zed-dark.css
        ├── cursor.css
        └── light.css
```

---

## 🚨 如果遇到问题

1. **类型错误**：检查是否有拼写错误或缺少导入
2. **找不到模块**：确认 `@/` 路径别名配置正确
3. **组件不显示**：检查导出和导入是否匹配
4. **依赖缺失**：运行 `pnpm add <package>`

**如果问题无法解决**：
1. 在 `REFACTOR-STATUS.md` 中详细记录
2. 继续下一个独立任务（如果可能）
3. 等待 Amp Review 时解决

---

## ✅ 完成后检查清单

- [ ] 所有 15 个任务已完成
- [ ] `pnpm check` 无错误
- [ ] `pnpm build` 成功
- [ ] `REFACTOR-STATUS.md` 已更新
- [ ] 目录结构符合预期

---

**开始执行吧！从 T-001 开始。Good luck! 🚀**
