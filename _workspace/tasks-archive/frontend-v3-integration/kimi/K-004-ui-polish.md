# K-004: 前端 UI 优化 - 字体、样式、TradingView

## 概述

前端存在多个 UI 问题需要修复，包括字体大小不一致、背景样式不统一、TradingView 图表未显示等。

## 问题截图

参考用户提供的截图：
- 左侧 Sidebar 样式正常
- 右侧主内容区域背景色与左侧不一致
- TradingView widget 显示为空白
- 字体大小不统一，普遍偏小

## 任务清单

### Phase 1: 字体统一化 (30 分钟)

- [ ] 1.1 检查 `themes.ts` 中的字体设置
- [ ] 1.2 统一基础字体大小
  ```css
  /* 建议调整 */
  body { font-size: 14px; }  /* 基础 */
  .sidebar { font-size: 13px; }
  .main-content { font-size: 14px; }
  .stock-name { font-size: 16px; }
  ```
- [ ] 1.3 确保所有组件使用主题变量而非硬编码字体

### Phase 2: 背景样式统一 (30 分钟)

- [ ] 2.1 检查 `MainLayout.tsx` 和 `StockWorkspace.tsx` 的背景设置
- [ ] 2.2 确保右侧区域使用与左侧一致的主题背景
  ```typescript
  // 应使用
  background: theme.colors.background
  // 而非硬编码
  background: '#1a1a2e'
  ```
- [ ] 2.3 修复可能的 CSS 覆盖问题

### Phase 3: K线图表数据加载修复 (45 分钟)

**重要**: 保持使用 Lightweight Charts，问题在数据源而非图表库

- [ ] 3.1 检查 `marketClient.ts` WebSocket 连接状态
  ```typescript
  // 确认连接成功
  ws://localhost:6888/ws
  ```
- [ ] 3.2 验证 K 线历史数据 API
  ```typescript
  // 检查 /api/market/kline 返回格式
  { time, open, high, low, close, volume }
  ```
- [ ] 3.3 修复 `symbol` 格式
  ```typescript
  // 当前显示 AAPL，应该改成 A股格式
  symbol: "600519"  // 贵州茅台
  symbol: "600879"  // 航天电子
  ```
- [ ] 3.4 添加数据加载调试日志
- [ ] 3.5 确保 `klineHistory[symbol]` 有数据后图表显示

### Phase 4: AI 聊天功能验证 (30 分钟)

- [ ] 4.1 检查 `useStreamingChat.ts` 的 SSE 连接
- [ ] 4.2 验证消息发送和接收
- [ ] 4.3 确保 AI 响应正确显示在界面

## 关键文件

| 文件 | 用途 |
|------|------|
| `client/src/refactor_v2/themes.ts` | 主题定义 |
| `client/src/refactor_v2/components/layout/MainLayout.tsx` | 主布局 |
| `client/src/refactor_v2/components/panels/StockWorkspace.tsx` | 股票工作区 |
| `client/src/refactor_v2/components/charts/TradingViewChart.tsx` | K线图表 |
| `client/src/refactor_v2/hooks/useStreamingChat.ts` | AI 聊天 |

## 验收标准

1. **字体**: 全局字体大小统一，至少 14px
2. **背景**: 左右两侧背景颜色一致
3. **图表**: TradingView 正常显示 K 线
4. **AI**: 聊天消息可发送和接收

## 参考截图

问题截图已保存：
- Sidebar 样式 (左侧正常)
- 主内容区 (右侧背景不一致，TradingView 空白)

## 提交规范

```
fix(ui): unify font sizes and fix background styles

- Set consistent font-size: 14px base
- Apply theme background to all panels
- Fix TradingView widget loading
- Verify AI chat connection
```

---

*任务分配: Kimi*
*优先级: P1*
*预计耗时: 2 小时*
