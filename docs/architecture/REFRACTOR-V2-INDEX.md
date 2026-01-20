# Refactor v2（新设计）索引

本文件用于快速定位“新设计（v2）”相关代码，避免和现有组件/业务实现混在一起。

## 目录位置

新设计代码统一放在：

- `client/src/refactor_v2/`
  - `components/`：新布局与 UI 组件
  - `stores/`：新设计对应的 Zustand 状态

## 入口/使用方式

- 当前预览入口页：`/` 路由的 [Home](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/pages/Home.tsx)
- Home 直接使用 v2 组件：
  - `@/refactor_v2/components/*`
  - `@/refactor_v2/stores/*`

## 组件清单（v2）

位于 `client/src/refactor_v2/components/`：

- [LayoutShell](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/components/LayoutShell.tsx)：左/中/右三栏壳；右侧 AI 面板滑入/滑出；中心区随 AI 面板腾挪
- [LeftPane](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/components/LeftPane.tsx)：自选股列表 + 搜索 + 主题切换入口
- [CenterTop](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/components/CenterTop.tsx)：顶部信息栏 + Perplexity 风格工具栏 + 资金栏 + 图表区
- [StockChart](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/components/StockChart.tsx)：`lightweight-charts` 图表封装（含 tooltip、成交量、图表右上角截图/全屏按钮）
- [CenterBottom](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/components/CenterBottom.tsx)：底部 InfoTabPanel（新闻/基本面/情绪/技术）占位实现
- [FloatingAIChatInput](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/components/FloatingAIChatInput.tsx)：底部悬浮 AI 输入框（Enter 发送，Esc 关闭 AI 面板）
- [AIChatPanel](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/components/AIChatPanel.tsx)：右侧 AI 消息列表/清空按钮（占位交互）

## Store 清单（v2）

位于 `client/src/refactor_v2/stores/`：

- [watchlist.store](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/stores/watchlist.store.ts)：`currentSymbol` + watchlist mock
- [layout.store](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/stores/layout.store.ts)：布局宽高/右侧面板开关
- [aiChat.store](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/client/src/refactor_v2/stores/aiChat.store.ts)：对话消息/面板开关/清空

## 建议的重构推进方式（下一步）

对照 [DRAGONFLY-REFACTOR](file:///Users/kc/Documents/trae_projects/DRAGONFLY-REFACTOR.md) 的 Phase 规划，推荐把 v2 当作“可运行的 UI 参照实现”，逐步替换旧逻辑：

- Phase 1：保持当前 v2 壳 + 逐步把 mock 数据替换为现有 tRPC 数据源
- Phase 2：把 LeftPane 的 watchlist mock 替换为 `trpc.watchlist.list` + 分组能力（store 结构先定契约）
- Phase 3：把 CenterBottom 的 4 个 Tab 替换为真实面板组件（先做数据契约与 loading/empty/error 状态）
- Phase 4：响应式（移动端抽屉、平板折叠、AI 全屏 sheet）

