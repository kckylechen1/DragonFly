# TASK-003: 修复股票图表显示问题

## 负责 Agent: 🟢 Codex

## 问题描述

右侧的股票图表无法正常显示，可能原因：
- 数据未加载
- 图表组件渲染问题
- API 调用失败

## 目标

- [ ] 定位图表不显示的根因
- [ ] 修复数据获取逻辑
- [ ] 确保图表正常渲染

## 调研方向

1. 检查 `client/src/components/panels/ChartPanel.tsx`
2. 检查 `client/src/hooks/useMarketInit.ts` 市场数据初始化
3. 查看网络请求是否有报错
4. 检查图表库 (lightweight-charts) 是否正确初始化

## 相关文件

| 操作 | 文件路径 |
|------|----------|
| CHECK | `client/src/components/panels/ChartPanel.tsx` |
| CHECK | `client/src/hooks/useMarketInit.ts` |
| CHECK | `client/src/stores/market.store.ts` |
| CHECK | `server/routers/stocks.ts` |

## Done Definition

- [ ] 股票图表能正常加载
- [ ] K线/分时数据正确显示
- [ ] 无控制台报错
