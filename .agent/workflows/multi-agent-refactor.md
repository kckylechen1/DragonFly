---
description: [Multi-Agent Code Refactoring & Task Delegation Workflow]
---

# Multi-Agent Refactoring & Task Delegation Workflow

// turbo-all

这个 Workflow 总结了从代码重构规划、任务拆分、分配给不同 Agent (Codex/GLM/Amp)、执行监控到最终交付的完整流程。适用于大型功能重构或模块化开发。

## 1. 🔍 初始评估与规划 (Planning Phase)
**执行者**: Antigravity (Project Lead)

在开始任何代码修改之前，你需要对当前项目状态进行彻底的评估。

1.  **全局扫描**: 浏览项目结构，阅读 README 和核心文档。
    *   `list_dir` 根目录和 `src`
    *   `view_file_outline` 核心入口文件
2.  **需求分析**: 明确重构目标（例如：UI 翻新、API 对接、性能优化）。
3.  **制定计划**: 创建或更新 `implementation_plan.md`。
    *   列出关键模块和组件
    *   识别技术难点
    *   制定分阶段里程碑

## 2. 🧩 任务拆分与 Agent 角色分配 (Task Delegation)
**执行者**: Antigravity

根据 Agent 的特长，将 `implemenation_plan.md` 转换具体的可执行任务文件。

### 角色定义
*   **Codex (OpenAI)**: **核心实施者**。负责逻辑复杂、需要高精度的代码编写（如业务逻辑、组件实现、API 对接）。
*   **GLM (Zhipu)**: **大规模生成者**。负责大批量、模式化的代码生成（如创建多个类似的 UI 组件、类型定义、Mock 数据）。
*   **Amp (Claude)**: **代码审查者**。负责 Code Review，检查潜在 Bug、类型安全和最佳实践。
*   **Grok (xAI)**: **技术调研/文档编写**。负责查找最新资料、编写复杂的文档或调研技术方案。

### 任务文件创建
在 `tasks/epics/<feature-name>/<agent-name>/` 下创建任务文件（如 `tasks/epics/frontend-refactor/codex/TASK-001-chart-ui.md`）。

**任务文件模板**:
```markdown
# 任务: [任务名称]

## 目标
简明扼要地描述要做什么。

## 环境
- 核心文件路径: ...
- 相关文档: ...

## 详细步骤
1. [ ] 修改文件 A，实现功能 X
2. [ ] 在文件 B 中添加类型定义
3. [ ] ...

## 参考代码
(可选) 提供示例代码或关键片段。

## 验证要求
- [ ] 类型检查通过 (`pnpm check`)
- [ ] 关键功能手动验证点
```

## 3. 🤖 任务分发与并行执行 (Execution Phase)
**执行者**: Antigravity (Dispatcher) -> Sub-agents

1.  **启动并行任务**: 使用 `dispatching-parallel-agents` 技能（如果有）或手动分配。
2.  **创建指令**: 明确告知 Agent 读取哪个任务文件。
    *   *示例*: "Codex，请读取并执行 `tasks/epics/ui-polish/codex/TASK-001.md`，完成后请报告。"
3.  **监控进度**: 定期检查 Agent 的输出，确认它们是否理解了任务。

## 4. 🕵️‍♂️ 代码审查与验收 (Review & QA)
**执行者**: Antigravity / Amp

当 Sub-agent (Codex/GLM) 完成任务后：

1.  **代码审查**:
    *   检查修改的文件列表。
    *   `view_file` 查看关键逻辑变更。
    *   (可选) 委托 Amp 进行深度 Review。
2.  **功能验证**:
    *   运行类型检查: `pnpm check`
    *   运行自动化测试: `pnpm test`
    *   (关键) **视觉验证**: 要求 Codex/Agent 截图或由 Antigravity 启动服务器自行验证。
3.  **反馈修正**: 如果发现问题，创建新的 "Fix Task" 文件（如 `FIX-001-chart-bug.md`），再次分配给原 Agent 修复。不要试图自己修所有小修小补，保持 Project Lead 身份。

## 5. 📦 代码提交与交付 (Delivery Phase)
**执行者**: Antigravity

1.  **整理代码库**:
    *   清理日志文件、临时文件。
    *   确保文档结构清晰 (`docs/`)。
2.  **更新文档**: 更新 `README.md` 和 `walkthrough.md`，记录本次变动。
3.  **提交代码**:
    *   `git add .`
    *   `git commit -m "feat: ..."` (使用 Conventional Commits)
    *   **安全检查**: 确保没有 API Key 泄露（使用 `git filter-repo` 如果需要）。
4.  **推送到仓库**: `git push origin main`。

## 6. 🎉 总结与复盘
**执行者**: Antigravity

*   更新 `task.md` 标记完成。
*   通知用户当前进度和成果。

---
**核心原则**:
1.  **文档驱动**: 一切任务先写文档，再执行。
2.  **各司其职**: 把合适的任务给合适的模型。
3.  **持续验证**: 每一步都要有反馈回路（Check -> Fix）。
