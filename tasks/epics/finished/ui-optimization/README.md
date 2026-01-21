# 🎯 Epic: UI 完整优化

> **状态**: ⏳ 进行中
> **创建时间**: 2026-01-19
> **参考文档**: [UI_Complete_Guide.md](../../FutureShop/UI_Complete_Guide.md)

## 📝 简述

根据 UI_Complete_Guide.md 中的 9 个问题清单，系统性优化股票交易界面的 UI/UX，对标 Perplexity Finance 风格。

## ✅ Done Definition

- [ ] P0 问题修复（股票代码不重复）
- [ ] P1 问题修复（6项）
- [ ] P2 问题修复（2项）
- [ ] 浏览器测试通过
- [ ] 代码质量审查通过

## 📊 问题清单

### 🔴 P0 优先级 - 立即修复

| # | 问题 | 状态 | Agent |
|---|------|------|-------|
| 1 | 股票代码重复显示 | ⏳ | 🔵 GLM |

### 🟡 P1 优先级 - 本周实施

| # | 问题 | 状态 | Agent |
|---|------|------|-------|
| 2 | 右侧顶部数字信息"挤在一行" | ⬜ | 🔵 GLM |
| 3 | 标签/徽章样式不统一 | ⬜ | 🔵 GLM |
| 4 | 左侧搜索框仍偏大 | ⬜ | 🔵 GLM |
| 5 | 列表 Sparkline 过抢眼 | ⬜ | 🔵 GLM |
| 6 | 分割线与边框层级过重 | ⬜ | 🔵 GLM |
| 7 | 聊天栏字体/间距不统一 | ⬜ | 🔵 GLM |

### 🟠 P2 优先级 - 后续优化

| # | 问题 | 状态 | Agent |
|---|------|------|-------|
| 8 | 聊天自动滚动打断用户阅读 | ⬜ | 🟢 Codex |
| 9 | 分时图不显示完整全天时间轴 | ⬜ | 🟢 Codex |

## 🔄 执行顺序

### Phase 1: P0 紧急修复（今天）
1. **TASK-001**: 🔵 GLM - 检查并修复股票代码重复显示

### Phase 2: P1 本周实施
2. **TASK-002**: 🔵 GLM - 优化右侧顶部信息展示层级
3. **TASK-003**: 🔵 GLM - 统一徽章与标签组件样式
4. **TASK-004**: 🔵 GLM - 紧凑化左侧搜索框与列表项
5. **TASK-005**: 🔵 GLM - 优化左侧列表 Sparkline
6. **TASK-006**: 🔵 GLM - 优化分割线与边框
7. **TASK-007**: 🔵 GLM - 聊天栏字体与间距统一

### Phase 3: P2 后续优化
8. **TASK-008**: 🟢 Codex - 实现智能聊天滚动逻辑
9. **TASK-009**: 🟢 Codex - 优化分时图完整时间轴显示

### Phase 4: 审查
10. **TASK-010**: 🟣 Amp - 代码质量审查

## 📁 相关文件

### 需要修改的文件
- `client/src/components/stock/StockListItem.tsx` - 左侧列表项（#1, #4, #5）
- `client/src/components/stock/StockDetailPanel.tsx` - 右侧详情面板（#2, #3, #6, #9）
- `client/src/components/ai/AIChatPanel.tsx` - 聊天面板（#7, #8）
- `client/src/index.css` - Design Tokens

### 可能需要新建的文件
- `client/src/components/ui/Badge.tsx` - 统一徽章组件
- `client/src/lib/chatScroller.ts` - 聊天滚动逻辑

## 🧪 验证方法

1. **视觉验证**: 启动 `pnpm dev`，浏览器检查 UI 变化
2. **对标 Perplexity**: 截图对比 Perplexity Finance 风格
3. **响应式测试**: 测试 1280px、1440px、1600px 宽度
4. **代码审查**: Amp 进行代码质量审查

---

> **Agent 符号说明**
> - 🔵 GLM: 便宜、快速、力大飞砖
> - 🟢 Codex: 细致、耐心、适合复杂逻辑
> - 🟣 Amp: 准确、质量把关
