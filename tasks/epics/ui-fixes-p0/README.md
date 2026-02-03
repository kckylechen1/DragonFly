# 🎯 Epic: UI 修复 P0

> **状态**: 🆕 新建
> **优先级**: P0
> **创建时间**: 2026-02-02 22:31
> **负责 Agent**: 🟢 Codex

## 📝 简述

修复当前 DragonFly 前端的三个主要问题：
1. 主界面大面积空白，聊天消息不显示
2. 侧边栏股票池使用硬编码数据
3. 股票图表无法正常显示

## 🔬 调研结论

- **后端 API 正常**：SSE 端点 `/api/ai/stream` 返回正确的事件（已测试验证）
- **问题在前端渲染层**：消息发送成功但界面未更新

## ✅ Done Definition

- [ ] 主界面正常显示聊天消息
- [ ] 侧边栏股票池从 store 动态获取数据
- [ ] 股票图表能正常加载和显示
- [ ] 开发服务器无报错

## 📊 子任务分配

| 任务 | Agent | 描述 |
|------|-------|------|
| TASK-001 | 🟢 Codex | 修复主界面消息渲染问题 |
| TASK-002 | 🟢 Codex | 侧边栏股票池接入动态数据 |
| TASK-003 | 🟢 Codex | 修复股票图表显示问题 |

## 🔄 执行顺序

1. **Phase 1**: 修复消息渲染（TASK-001）
2. **Phase 2**: 并行修复 TASK-002 和 TASK-003

## 📁 相关文件

- `client/src/components/chat/ChatWorkspace.tsx`
- `client/src/components/chat/ChatList.tsx`
- `client/src/components/layout/Sidebar.tsx`
- `client/src/hooks/useStreamingChat.ts`
- `client/src/stores/chat.store.ts`
