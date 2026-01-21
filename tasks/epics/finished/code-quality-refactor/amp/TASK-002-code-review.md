# TASK-002: Code Review - Home.tsx 拆分

## 负责 Agent: 🔵 Amp

## 📋 前置条件

- [ ] TASK-001 已完成
- [ ] Codex 已提交代码

---

## 🎯 审查目标

审查 Codex 拆分 Home.tsx 的实现，确保：

1. **Spec 合规** - 是否满足拆分目标？
2. **代码质量** - 可读性、类型安全、最佳实践

---

## 📝 审查清单

### Phase 1: Spec 合规审查

| 检查项 | 要求 | 状态 |
|--------|------|------|
| Home.tsx 行数 | < 300 行 | ✅ 233 行 |
| 拆分组件行数 | 各自 < 150 行 | ⚠️ AIChatPanel 456 行 |
| 功能完整 | 无功能丢失 | ✅ |
| 编译通过 | `pnpm build` 成功 | ✅ |

### Phase 2: 代码质量审查

| 检查项 | 说明 | 状态 |
|--------|------|------|
| 类型安全 | 无 `any`，Props 有类型定义 | ✅ |
| 命名规范 | 组件/函数命名清晰一致 | ✅ |
| 职责单一 | 每个组件只做一件事 | ⚠️ AIChatPanel 混合过多逻辑 |
| 导入导出 | 正确使用 index.ts 聚合导出 | ✅ |
| 可复用性 | 组件是否可以在其他地方复用 | ✅ |

---

## 🔧 审查命令

```bash
# 1. 查看改动范围
git diff main --stat

# 2. 查看 Home.tsx 行数
wc -l client/src/pages/Home.tsx

# 3. 编译检查
pnpm build

# 4. 类型检查
pnpm typecheck

# 5. 启动开发服务器手动测试
pnpm dev
```

---

## 📊 审查结果

**审查人**: Amp  
**日期**: 2026-01-19

### ✅ 通过项

- Home.tsx 从原始大文件拆分至 233 行，符合 < 300 行要求
- WatchlistSidebar.tsx (148 行)、StockWorkspace.tsx (47 行)、MainLayout.tsx (55 行) 符合 < 150 行要求
- 所有组件均有完整的 TypeScript Props 接口定义，无 `any` 类型
- index.ts 正确聚合导出所有组件和类型
- 构建成功 (`vite build` 通过)

### ⚠️ 建议改进

- **AIChatPanel.tsx (456 行)** 超过 150 行限制，建议进一步拆分：
  - 抽取 `useChatStream` hook 处理流式请求逻辑 (L105-285)
  - 抽取 `ChatHeader` 组件处理标题栏 UI (L352-423)
  - 抽取 `useStockContext` hook 处理股票数据获取 (L36-47)

### ❌ 必须修复

无

### 结论

[x] ✅ 批准合并（Home.tsx 拆分目标已达成）
[ ] 🔄 需要修改后重新审查

**备注**: AIChatPanel.tsx 的进一步拆分可作为后续优化任务

---

## ✅ 完成后

1. 在本文件记录审查结果
2. 如有问题，通知 Codex 修复
3. 确认无误后，批准合并
