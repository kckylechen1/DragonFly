# R-001: Code Review（Antigravity 审查任务）

## 负责 Agent: 🔴 Antigravity

## 执行时机
- Codex 今晚（2026-01-20）执行 T-001 ~ T-017
- 明早 Antigravity Review

## 目标
- [ ] 审查所有 Phase 1 产出代码
- [ ] 确认 Spec 合规性
- [ ] 确认代码质量
- [ ] 记录需要修复的问题

---

## 审查范围

### 目录结构检查
```
client/src/refactor_v2/
├── components/          # 检查组件拆分和职责边界
├── stores/              # 检查 Zustand store 设计
├── types/               # 检查类型完整性
├── constants/           # 检查常量使用
├── hooks/               # 检查 hook 设计
├── styles/              # 检查主题和 Token
└── api/                 # 如有 Phase 1.5
```

---

## 审查清单

### 1. Spec 合规审查

- [ ] **布局契约**: 四区域（Left / CenterTop / CenterBottom / Right）实现
- [ ] **主题系统**: Token 三层（Primitive / Semantic / Component）
- [ ] **ErrorBoundary**: 四区域独立包裹
- [ ] **快捷键**: ⌘/Ctrl+K、⌘/Ctrl+I、Esc 实现
- [ ] **持久化**: 布局尺寸、主题选择持久化

### 2. 代码质量审查

- [ ] **类型安全**: 无 `any`，无 `@ts-ignore`
- [ ] **错误处理**: 无静默吞错，用户可见错误有友好提示
- [ ] **命名规范**: 函数、变量、文件命名一致
- [ ] **职责单一**: 每个组件 < 200 行，函数 < 50 行
- [ ] **重复代码**: 无明显 copy-paste
- [ ] **Magic Numbers**: 所有数字来自 constants

### 3. 性能审查

- [ ] **React.memo**: 纯展示组件使用 memo
- [ ] **Zustand selector**: 使用 selector 避免不必要重渲染
- [ ] **lazy loading**: 大组件使用 React.lazy

### 4. 可访问性审查

- [ ] **ARIA 标签**: Tab、Panel 有正确的 role
- [ ] **键盘导航**: Tab/Enter/Esc 可完成主要操作
- [ ] **焦点管理**: 面板打开时焦点正确

---

## 问题分类

| 严重程度 | 描述 | 处理 |
|----------|------|------|
| 🔴 Critical | 功能不可用、安全问题 | 必须修复 |
| 🟠 Major | 不符合 Spec、性能问题 | 应该修复 |
| 🟡 Minor | 代码风格、可读性 | 建议修复 |
| 🟢 Suggestion | 优化建议 | 可选 |

---

## 反馈模板

在 `tasks/epics/frontend-refactor-phase1/amp/REVIEW-FEEDBACK.md` 中记录：

```markdown
# Phase 1 Code Review 反馈

**审查者**: 🟣 Amp
**日期**: YYYY-MM-DD
**状态**: ✅ 通过 / ⚠️ 需修复 / 🔴 拒绝

## 总体评价
...

## 需修复的问题

### 🔴 [文件路径]
- **问题**: ...
- **建议修复**: ...

### 🟠 [文件路径]
- **问题**: ...
- **建议修复**: ...

## 亮点
- ...

## 下一步
- [ ] Codex 修复问题
- [ ] Amp 二次审查
- [ ] 合并到主分支
```

---

## 验证命令

```bash
# 类型检查
pnpm check

# 构建测试
pnpm build

# 运行开发服务器验证 UI
pnpm dev
```

---

## 产出文件

- `tasks/epics/frontend-refactor-phase1/amp/REVIEW-FEEDBACK.md`
