# TASK-001: 修复主界面布局空白问题

## 负责 Agent: 🟢 Codex

## 问题描述

当前主界面大面积空白，只显示底部的输入框。应该显示：
- 欢迎语/提示信息
- 预设提示词按钮
- 或者历史对话内容

## 目标

- [ ] 定位空白问题根因（组件未渲染？数据未加载？CSS问题？）
- [ ] 修复布局使内容正常显示
- [ ] 确保输入框位置合理

## 调研方向

1. 检查 `client/src/components/chat/ChatWorkspace.tsx` 组件
2. 检查 `client/src/App.tsx` 路由配置
3. 查看浏览器控制台是否有报错
4. 检查 CSS 是否有 `display: none` 或 `visibility: hidden`

## 相关文件

| 操作 | 文件路径 |
|------|----------|
| CHECK | `client/src/App.tsx` |
| CHECK | `client/src/components/chat/ChatWorkspace.tsx` |
| CHECK | `client/src/components/FloatingAIChatInput.tsx` |

## Done Definition

- [ ] 主界面有实际内容显示（不再空白）
- [ ] 布局符合设计预期
