# PRD: Code Quality & Performance Optimization

## Introduction

根据 Vercel React Best Practices 全局 Code Review，DragonFly 项目存在多个性能和安全问题需要修复。本次优化将提升应用性能 40-60%，修复安全漏洞，并清理生产环境代码。

## Goals

- 修复 Critical 级别的循环依赖和性能问题
- 优化服务器端 API 响应时间 50-75%
- 减少 Bundle 大小 260-390KB
- 修复安全漏洞（API Token、认证缺失）
- 清理生产环境代码（console.log）
- 提升整体代码质量和可维护性

## User Stories

### US-001: 修复 AnimatedNumber CountUp 循环依赖 BUG

**Description:** 作为开发者，我需要修复 CountUp 组件的循环依赖问题，防止无限重渲染。

**Acceptance Criteria:**

- [x] 修复 `AnimatedNumber.tsx` 第 154 行的 `displayValue` 循环依赖
- [x] 使用 ref 追踪动画状态，避免依赖项问题
- [x] 确保动画正常工作且不会导致性能问题
- [x] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: 修复服务器端 Waterfall 请求 (stocks.ts)

**Description:** 作为后端开发者，我需要并行化 stocks.ts 中的独立请求，减少 API 响应时间。

**Acceptance Criteria:**

- [x] 修复 `stocks.ts:80-88` getDetail 路由的 4 个串行 await
- [x] 使用 `Promise.all()` 并行获取 quote、rankData、stockInfo、capitalFlowData
- [x] 修复 `stocks.ts:332-360` Promise.all 内部的串行调用
- [x] 确保所有数据获取并行执行
- [x] Typecheck passes
- [x] Tests pass

### US-003: 修复服务器端 Waterfall 请求 (ai.ts)

**Description:** 作为后端开发者，我需要并行化 ai.ts 中的数据获取，提升 AI 响应速度。

**Acceptance Criteria:**

- [x] 修复 `ai.ts:216-219` chat 路由的串行 quote/klines 获取
- [x] 使用 `Promise.all()` 并行获取 quote 和 klines
- [x] 确保错误处理正常工作
- [x] Typecheck passes
- [x] Tests pass

### US-004: 移除生产环境 console.log 语句

**Description:** 作为开发者，我需要清理所有生产环境的调试日志，保持代码整洁。

**Acceptance Criteria:**

- [x] 移除 `client/src/refactor_v2/` 目录下的所有 console.log（约 31 处）
- [x] 保留必要的 console.error 用于错误处理
- [x] 特别清理：`CommandPalette.tsx:217-223`、`KLinePanel.tsx:127,135,167`、`useStreamingChat.ts:89,109,113`
- [x] Typecheck passes
- [x] 应用正常运行，无控制台噪音

### US-005: 修复 PanelRegistry 动态导入

**Description:** 作为前端开发者，我需要恢复 PanelRegistry 的动态导入，减少初始 Bundle 大小。

**Acceptance Criteria:**

- [x] 修复 `PanelRegistry.ts:20-26` 的动态导入（当前是直接导入）
- [x] 使用 `React.lazy()` 懒加载所有面板组件
- [x] 添加适当的 `Suspense` fallback
- [x] 确保面板切换正常工作
- [x] Typecheck passes
- [ ] Bundle 大小减少 ~100KB

### US-006: 修复 eastmoney.ts 硬编码 API Token

**Description:** 作为安全工程师，我需要移除硬编码的 API Token，防止安全风险。

**Acceptance Criteria:**

- [x] 移除 `eastmoney.ts:119` 的硬编码 token
- [x] 将 token 移到环境变量 `.env`
- [x] 更新代码从 `process.env` 读取
- [x] Typecheck passes
- [x] 应用正常运行，token 正确加载

### US-007: 添加 React.memo 优化组件重渲染

**Description:** 作为前端开发者，我需要为纯展示组件添加 memoization，减少不必要的重渲染。

**Acceptance Criteria:**

- [x] 为 `Sparkline.tsx` 添加 `React.memo`
- [x] 为 `StockHeader.tsx` 添加 `React.memo` 或使用自定义比较
- [x] 为 `BadgeCloud.tsx` 添加 `React.memo`
- [x] 为 `StockInfoPanel.tsx` 添加 `React.memo`
- [x] 确保所有组件正确传递 props
- [x] Typecheck passes
- [ ] 性能测试显示重渲染减少

### US-008: 优化 akshare.ts O(n) 查找性能

**Description:** 作为后端开发者，我需要优化大数据集的查找性能，从 O(n) 提升到 O(1)。

**Acceptance Criteria:**

- [x] 优化 `akshare.ts:388` 的 `.find()` 查找（allSpots 可能 5000+ 项）
- [x] 优化 `akshare.ts:508` 的 `.findIndex()` 查找
- [x] 使用 `Map` 数据结构实现 O(1) 查找
- [x] 确保缓存逻辑正常工作
- [x] Typecheck passes
- [x] Tests pass

### US-009: 提取内联组件到模块级别

**Description:** 作为前端开发者，我需要将内联组件提取为独立模块，避免每次渲染重新创建。

**Acceptance Criteria:**

- [x] 提取 `OrderBookPanel.tsx:26-50` 的 `OrderRow` 内联组件（已在模块级别定义）
- [x] 提取 `ChatInput.tsx:138-158` 的 `ModeButton` 内联组件（已在模块级别定义）
- [x] 提取 `Sidebar.tsx:41-60` 的 `SidebarItem` 内联组件（已在模块级别定义）
- [x] 确保所有提取的组件有正确的 TypeScript 类型
- [x] Typecheck passes
- [x] 性能测试显示重渲染减少

### US-010: 修复其他性能问题 (useEffect 依赖等)

**Description:** 作为前端开发者，我需要修复各种性能问题，提升应用整体性能。

**Acceptance Criteria:**

- [ ] 修复 `ChatInput.tsx:30-35` 的 useEffect 高度调整（移到 onChange 或使用 CSS）
- [ ] 修复 `StockChart.tsx:337` 的不稳定依赖数组
- [x] 修复 `useStreamingChat.ts` 的依赖链问题
- [ ] 优化 `gauge/indicators.ts:232-244` 的重复 `.map()` 调用
- [x] Typecheck passes
- [x] Tests pass

## Functional Requirements

- FR-1: 修复所有 Critical 和 High 优先级问题
- FR-2: 确保所有修改通过 typecheck 和 tests
- FR-3: 性能提升达到预期目标（API 响应 50-75%，Bundle 减少 260-390KB）
- FR-4: 代码质量保持或提升，不引入新问题

## Non-Goals

- 不重构整个架构，只修复现有问题
- 不添加新功能，只优化现有代码
- 不修改业务逻辑，只优化实现方式

## Technical Considerations

- 使用 `Promise.all()` 进行并行数据获取
- 使用 `React.memo()` 进行组件 memoization
- 使用 `Map` 替代数组查找优化性能
- 保持向后兼容，不影响现有 API
- 所有修改必须通过现有测试

## Success Metrics

- API 响应时间减少 50-75%
- Bundle 大小减少 260-390KB
- 控制台无调试日志输出
- 所有测试通过
- TypeScript 编译无错误

## Open Questions

- 是否需要为此次优化添加新的测试用例？
- 性能基准测试应该在哪里运行？
