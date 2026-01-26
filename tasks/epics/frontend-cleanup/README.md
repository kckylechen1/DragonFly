# 🎯 Epic: Frontend Cleanup (前端代码清理)

> **状态**: 🆕 新建  
> **创建日期**: 2026-01-26  
> **分析文档**: [FRONTEND-CLEANUP-ANALYSIS.md](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/docs/FRONTEND-CLEANUP-ANALYSIS.md)

---

## 📝 简述

删除项目中不再使用的旧前端代码，保留 `refactor_v2` 作为唯一前端实现。清理根目录杂项文件，更新 `.gitignore`，移除不再需要的依赖包。

## ✅ Done Definition

- [x] 备份标签已创建 (`before-remove-legacy-frontend`)
- [ ] 旧前端代码已删除 (P0)
- [ ] 根目录杂项已清理 (P1)
- [ ] `.gitignore` 已更新
- [ ] 依赖包已清理 (P2)
- [ ] `pnpm check` 通过
- [ ] `pnpm build` 通过
- [ ] 页面正常访问验证
- [ ] Amp Code Review 完成

---

## 📊 时间估算

基于 Playbook 10.3 速度系数和实际工作量：

| 任务 | 文件数/操作量 | 预估时间 | 说明 |
|------|--------------|----------|------|
| T1: Git 准备 | 3 条命令 | **2 分钟** | 简单 Git 操作 |
| T2: 删除 P0 代码 | ~90 个文件 | **5 分钟** | 批量 rm 命令 |
| T3: 删除 P1 杂项 | ~10 个文件 | **2 分钟** | 简单删除 |
| T4: 更新 .gitignore | 1 个文件 | **3 分钟** | 添加规则 |
| T5: 验证构建 | 3 条命令 | **5 分钟** | check + build + dev |
| T6: 依赖审计 | grep + remove | **10 分钟** | 需要搜索确认 |
| **总计** | | **~27 分钟** | GLM 1.5x 速度系数 |

> **GLM 测试目标**: 验证 GLM 能否独立完成整个 Epic，最少人工干预

---

## 📋 子任务分配

| 任务ID | 任务 | Agent | 文件 | 依赖 |
|--------|------|-------|------|------|
| T1 | Git 准备（备份+分支） | 🔵 GLM | - | 无 |
| T2 | 删除 P0 旧前端代码 | 🔵 GLM | [GLM-TASKS.md](./glm/GLM-TASKS.md) | T1 |
| T3 | 删除 P1 根目录杂项 | 🔵 GLM | 同上 | T2 |
| T4 | 更新 .gitignore | 🔵 GLM | 同上 | T3 |
| T5 | 验证构建 | 🔵 GLM | 同上 | T4 |
| T6 | 依赖审计 (P2) | 🔵 GLM | 同上 | T5 |
| T7 | Code Review | 🟣 Amp | [CODE-REVIEW.md](./amp/CODE-REVIEW.md) | T6 |

---

## 🔄 执行模式

**模式 C: 少值守执行** (用户偏好)

```
用户 → 复制命令给 GLM → GLM 执行 T1-T6 → Amp Review T7
```

**GLM 能力测试重点**：
1. 能否正确理解任务文档
2. 能否独立处理删除+验证循环
3. 遇到问题时的处理方式

---

## 🚦 启动命令

复制以下内容给 GLM：

```
读取 /Users/kc/Documents/trae_projects/DragonFly_Restructure/tasks/epics/frontend-cleanup/glm/GLM-TASKS.md，按顺序执行所有任务（T1-T6），每完成一个任务打卡记录，最后运行 pnpm check && pnpm build 验证，并产出完成报告
```

---

## 📁 目录结构

```
tasks/epics/frontend-cleanup/
├── README.md              # 本文件 - Epic 总览
├── glm/
│   └── GLM-TASKS.md       # GLM 详细任务清单
├── amp/
│   └── CODE-REVIEW.md     # Amp Review 清单（待生成）
└── output/
    └── COMPLETION-REPORT-GLM-*.md  # GLM 完成报告
```
