# A-001: 架构与契约审查 (Spec Review)

## 负责人: 🟣 Amp
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 目标
- [ ] 检查 `types/` 是否严格遵循 `agent-task-spec.md` 的协议。
- [ ] 验证 `PanelRegistry` 是否完整覆盖了 6 个面板。
- [ ] 确认布局嵌套层级是否正确（无过度嵌套）。

---

## 审查重点

- [ ] SSE Event 类型中是否有 `seq`？
- [ ] 工具调用状态是否有 `thinking` 步骤映射？
