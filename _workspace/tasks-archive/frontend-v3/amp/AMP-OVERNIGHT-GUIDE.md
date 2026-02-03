# 🟣 Amp 过夜审查指南

> **Epic**: frontend-v3  
> **负责阶段**: Wave 4 / 验收阶段  
> **核心职责**: 质量守门人

---

## 📋 审查任务

| 顺序 | 任务 | 文件 |
|-----|------|------|
| 1 | A-001 | A-001-spec-review.md |
| 2 | A-002 | A-002-quality-review.md |

---

## 🛠️ 审查规则

1. **记录时间** - ⚠️ 记录 Review 的 `开始时间` 和 `结束时间`
2. **必须运行 `pnpm check`** - 任何类型错误都视为不通过。
3. **必须运行 `pnpm build`** - 确保 Bundle 切割正常。
4. **对照 `FRONTEND_REFACTOR_REVIEW.md`** - 逐条检查 15 个优化项是否落实。
5. **性能验证** - 查看 `tickBuffer` 是否被正确使用。
