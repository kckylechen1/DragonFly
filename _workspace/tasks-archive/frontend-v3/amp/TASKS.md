# 🟣 Amp 任务集 - Frontend V3 审查

> **执行时机**: Wave 4（GLM、Codex、Droid 完成后）  
> **预估时长**: 2h  
> **角色定位**: 审查官（两阶段 Code Review）

---

## 📚 必读文档（执行前必须阅读）

1. **前端架构指南**  
   路径: `tasks/FutureShop/frontend-architecture-guide.md`  
   内容: 理解整体架构，用于 Spec 合规审查

2. **Agent 任务规格书**  
   路径: `tasks/FutureShop/agent-task-spec.md`  
   内容: 验收标准（第 400-500 行）

3. **你自己的综合评审报告**  
   路径: `FRONTEND_REFACTOR_REVIEW.md`  
   内容: 确认 CRITICAL 和 HIGH 级别问题已被修复

4. **团队协作规范**  
   路径: `docs/ai-collab/AGENTS.md`  
   内容: 代码风格、命名规范（用于代码质量审查）

---

## 🎯 两阶段审查

### 阶段 1: Spec 合规审查

**目标**: 验证实现是否符合设计规格

**检查文件范围**:
```
client/src/refactor_v2/
├── components/
│   ├── layout/
│   ├── chat/
│   ├── panels/
│   └── settings/
├── hooks/
├── stores/
├── realtime/
└── types/
```

**检查清单**:

| 检查项 | 参考 | 验证方法 |
|--------|------|----------|
| 三栏布局 | `frontend-architecture-guide.md` | 检查 MainLayout.tsx |
| 可折叠侧边栏 | `FRONTEND_REFACTOR_REVIEW.md` 第 29-148 行 | 测试折叠/展开动画 |
| 可拖拽面板 | `FRONTEND_REFACTOR_REVIEW.md` 第 152-247 行 | 测试拖拽调整宽度 |
| 4 档响应式 | `FRONTEND_REFACTOR_REVIEW.md` 第 251-344 行 | DevTools 切换视口 |
| SSE 流式对话 | `frontend-architecture-guide.md` 第 46-348 行 | 检查 useStreamingChat |
| 6 个面板 | `agent-task-spec.md` | 逐个验证面板存在 |
| tick 缓冲层 | `FRONTEND_REFACTOR_REVIEW.md` 第 435-478 行 | 检查 tickBuffer.ts |
| seq 去重 | `FRONTEND_REFACTOR_REVIEW.md` 第 606-626 行 | 检查 useStreamingChat |
| imperative 更新 | `FRONTEND_REFACTOR_REVIEW.md` 第 735-758 行 | 检查 KLinePanel |

**输出**: 问题列表 + 修复建议

---

### 阶段 2: 代码质量审查

**目标**: 确保代码质量符合团队规范

**参考**: `docs/ai-collab/AGENTS.md`

**检查清单**:

| 检查项 | 规范来源 | 严重程度 |
|--------|----------|----------|
| 无 `any` 类型 | AGENTS.md | CRITICAL |
| 正确的错误处理 | AGENTS.md | HIGH |
| useEffect 有 cleanup | React 最佳实践 | HIGH |
| 组件命名 PascalCase | AGENTS.md | MEDIUM |
| 文件命名 kebab-case | AGENTS.md | MEDIUM |
| 函数命名 camelCase | AGENTS.md | MEDIUM |
| 导入分组正确 | AGENTS.md | LOW |
| JSDoc 注释 | AGENTS.md | LOW |

**重点审查**:
1. `realtime/marketClient.ts` - 连接管理是否正确
2. `realtime/tickBuffer.ts` - 缓冲逻辑是否正确
3. `hooks/useStreamingChat.ts` - seq 去重是否有效
4. `components/panels/KLinePanel.tsx` - imperative 更新是否正确

---

## A-001: Spec 合规审查执行

**步骤**:

1. 阅读所有参考文档
2. 按检查清单逐项验证
3. 记录不符合项
4. 提出修复建议

**输出文件**: `tasks/epics/frontend-v3/amp/spec-review.md`

---

## A-002: 代码质量审查执行

**步骤**:

1. 阅读 AGENTS.md 确认规范
2. 使用 grep 搜索 `: any`
   ```bash
   grep -r ": any" client/src/refactor_v2/
   ```
3. 检查 useEffect cleanup
   ```bash
   # 搜索没有 return 的 useEffect
   ```
4. 检查命名规范
5. 记录问题

**输出文件**: `tasks/epics/frontend-v3/amp/quality-review.md`

---

## A-003: 构建验证

**命令**:
```bash
pnpm check   # 类型检查
pnpm build   # 构建验证
pnpm test    # 运行测试
```

**预期**: 全部通过

如果失败，记录错误并提出修复方案。

---

## A-004: 最终验收

**功能验收**:
1. 打开 http://localhost:5173
2. 验证三栏布局显示
3. 测试侧边栏折叠/展开
4. 测试面板拖拽
5. 输入消息，验证流式输出
6. 切换面板，验证数据刷新

**性能验收**:
- [ ] 首屏加载 < 2.5s
- [ ] K线实时更新无卡顿
- [ ] 60fps 稳定

**结果记录**: `tasks/epics/frontend-v3/amp/final-report.md`

---

## 输出文件汇总

完成后创建以下文件：

1. `tasks/epics/frontend-v3/amp/spec-review.md` - Spec 合规审查结果
2. `tasks/epics/frontend-v3/amp/quality-review.md` - 代码质量审查结果
3. `tasks/epics/frontend-v3/amp/final-report.md` - 最终验收报告

**报告格式**:
```markdown
# [审查类型] 报告

## 审查范围
- ...

## 发现的问题

### CRITICAL
1. [文件:行号] 问题描述 → 修复建议

### HIGH
1. ...

### MEDIUM
1. ...

## 总结
- 通过项: X
- 问题项: Y
- 总体评价: PASS / NEEDS_FIX
```

---

## ⚠️ 注意事项

1. **严格按照两阶段审查**，不要跳过
2. **发现问题时**，优先让原 Agent 修复，而非自己动手
3. **如果问题太多**，标注 NEEDS_FIX 并阻塞发布
