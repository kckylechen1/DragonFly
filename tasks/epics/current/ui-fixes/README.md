# 🎯 Epic: UI 功能修复与迁移

> **状态**: 🆕 新建
> **优先级**: P0

## 📝 简述
修复 refactor_v2 前端的 UI 问题，包括股票名称显示、自选删除功能、AI 聊天功能迁移、股票信息面板迁移。

## ✅ Done Definition
- [ ] 股票头部显示中文名称而非代码
- [ ] 自选股可以通过拖拽/滑动删除
- [ ] AI 聊天支持流式响应和工具调用
- [ ] 股票信息面板显示完整数据 (资金流向、交易数据)
- [ ] 数字滚动动画效果生效
- [ ] `pnpm check` 通过
- [ ] 无控制台错误

## 📸 参考截图
详见 Codex 任务指南中的截图对比:
- [旧版股票面板 1](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/tasks/epics/current/ui-fixes/old-ui-stock-panel-1.png)
- [旧版股票面板 2](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/tasks/epics/current/ui-fixes/old-ui-stock-panel-2.png)
- [新版问题截图](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/tasks/epics/current/ui-fixes/new-ui-stock-code-only.png)
- [AI 聊天问题](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/tasks/epics/current/ui-fixes/ai-chat-basic.png)

## 📊 子任务分配

| 任务 | Agent | 描述 |
|------|-------|------|
| CDX-UI-001 | 🟢 Codex | 修复股票名称显示 |
| CDX-UI-002 | 🟢 Codex | 添加自选股拖拽删除功能 |
| CDX-UI-003 | 🟢 Codex | 迁移 AI 聊天高级功能 (流式、工具调用、深度模式) |
| CDX-UI-004 | 🟢 Codex | 迁移股票信息面板 (资金流向、数字动画) |

## 🔄 执行顺序

### Phase 1: 基础修复
- CDX-UI-001: 股票名称显示

### Phase 2: 功能添加
- CDX-UI-002: 自选删除

### Phase 3: 核心迁移
- CDX-UI-003: AI 聊天 (优先级最高，功能退化严重)
- CDX-UI-004: 股票信息面板

### Phase 4: 审查 (Amp)
- 🟣 Amp Code Review (Spec 合规 + 代码质量)

## 🔙 回滚点

```bash
# 如果 Codex 改坏了，可回滚到此 commit:
git reset --hard HEAD~1
# commit message: checkpoint: pre-Codex UI fixes
```

## 📁 任务文件

| Agent | 任务文件 |
|-------|----------|
| 🟢 Codex | [`codex/CODEX-UI-FIX-GUIDE.md`](./codex/CODEX-UI-FIX-GUIDE.md) |

## 🔧 关键旧组件参考

| 组件 | 路径 | 说明 |
|------|------|------|
| AIChatPanel | `components/ai/AIChatPanel.tsx` | 457行，流式 API + 工具调用 |
| StockDetailPanel | `components/stock/StockDetailPanel.tsx` | 611行，资金流向 + 交易数据 |
| AnimatedNumber | `components/ui/AnimatedNumber.tsx` | 数字滚动动画 |
| PresetPrompts | `components/PresetPrompts.tsx` | 预设提示按钮 |
| TaskExecutionPanel | `components/ai/TaskExecutionPanel.tsx` | 工具执行进度 |
| ChatHistoryList | `components/ai/ChatHistoryList.tsx` | 历史对话列表 |
