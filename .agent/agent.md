# Multi-Agent 协作框架

> **版本**: v1.0  
> **更新**: 2026-01-26

---

## 🎯 核心原则

**Antigravity = 架构师 + 任务分配者**  
**Codex / GLM / Amp / Grok = 执行者**

```
用户需求 → Antigravity 分析拆解 → 派发任务 → 执行者实现 → Antigravity Review
```

---

## 🤖 Agent 能力矩阵

| Agent | 强项 | 弱项 | 适用场景 | 速度系数 |
|-------|------|------|----------|----------|
| **Antigravity** | 架构设计、问题分析、Code Review、任务拆解 | 重复性劳动 | 规划、审核 | - |
| **Codex** | 批量代码修改、重构、后端逻辑、测试 | 复杂架构决策 | 实现、修 Bug | 1.0x |
| **GLM** | 中文理解、分析报告、前端代码 | 复杂逻辑 | UI、文档 | 0.8x |
| **Amp** | 代码审查、问题发现、全局分析 | 执行速度 | Review | 0.7x |
| **Grok** | 推理、复杂问题、创意方案 | 细节实现 | 设计 | 0.6x |

---

## ⏱️ 时间估算规则

基准时间 × Agent 速度系数 = 实际预估

| 任务类型 | 基准时间 | Codex | GLM | Amp |
|----------|----------|-------|-----|-----|
| 单文件简单修复 | 10min | 10min | 12min | 15min |
| 多文件批量修改 | 30min | 30min | 40min | 45min |
| 新增 API 端点 | 45min | 45min | 60min | - |
| 跨模块重构 | 2h | 2h | 2.5h | - |
| 全栈功能开发 | 4h | 4h | 5h | - |

---

## 📋 任务分配模板

### Codex 任务文档格式

```markdown
# CODEX-[EPIC]-TASKS.md

## 任务清单
| ID | 问题 | 文件 | 修复方案 |
|----|------|------|----------|
| 1 | 描述 | `path/to/file.ts` L行号 | 具体做法 |

## 修复详情
### 任务1: 标题
\`\`\`typescript
// 代码片段
\`\`\`

## 验证命令
\`\`\`bash
pnpm check && pnpm build && pnpm test
\`\`\`
```

---

## 🔄 工作流程

### 1. 需求接收 (Antigravity)
- 理解用户需求
- 分析技术可行性
- 识别相关文件

### 2. 任务拆解 (Antigravity)
- 创建 `CODEX-[EPIC]-TASKS.md`
- 按优先级排序 (P0 → P1 → P2)
- 估算时间

### 3. 任务派发
- Codex: 后端 + 批量修改
- GLM: 前端 UI + 文档
- Amp: Code Review

### 4. 执行 (Codex/GLM)
- 读取任务文档
- 按顺序实现
- 运行验证命令

### 5. 验收 (Antigravity)
- Code Review
- 测试验证
- 合并/反馈

---

## 📂 文件约定

| 类型 | 位置 | 说明 |
|------|------|------|
| Epic 任务 | `tasks/epics/[epic]/` | 大功能任务目录 |
| Codex 任务 | `tasks/epics/[epic]/CODEX-FIX-TASKS.md` | Codex 执行清单 |
| Code Review | `tasks/epics/[epic]/CODE-REVIEW.md` | Review 报告 |
| 日报 | `.agent/workflows/daily-summary-*.md` | 每日工作总结 |

---

## ✅ 当前任务状态

### Agent Optimization Epic

| 任务 | 指派 | 状态 | 预估 |
|------|------|------|------|
| B1: 并发限制 | Codex | 待执行 | 15min |
| B2: 请求超时 | Codex | 待执行 | 15min |
| B5: 模型配置 | Codex | 待执行 | 1h |
| B6: API 安全 | Codex | 待执行 | 30min |
| B8: 并行请求 | Codex | 待执行 | 10min |
| F1: N+1 Watchlist | Codex | 待执行 | 1h |
| F4: 错误处理 | GLM | 待执行 | 45min |
| F5: 状态同步 | GLM | 待执行 | 30min |
| F6: 搜索框响应 | GLM | 待执行 | 15min |

**总预估**: Codex 3h + GLM 1.5h = 4.5h 并行执行

---

## 📝 备注

- Antigravity 不做一个个改的活，太慢
- 任务文档要详细到行号和代码片段
- 执行者完成后必须跑验证命令

---

## ⏰ Clock-In / Clock-Out

**所有 Agent 开始和结束任务时必须打卡**：

```
🕐 Clock-In: 2026-01-26 12:00
任务: CODEX-FIX-TASKS.md
```

```
🕐 Clock-Out: 2026-01-26 12:25
用时: 25min
```

---

## 📄 完成报告

**完成后必须在 `tasks/epics/{epic}/` 写报告**：

文件: `COMPLETION-REPORT-{agent}-{date}.md`

内容包括:
- Clock-In / Clock-Out 时间
- 完成的任务列表
- 验证结果 (pnpm check/build/test)
- 遇到的问题或备注

---

## 📚 完整规范

详见: [docs/ai-collab/AI-COLLAB-PLAYBOOK.md](../docs/ai-collab/AI-COLLAB-PLAYBOOK.md)

