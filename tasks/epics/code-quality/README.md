# 🎯 Epic: 代码质量提升

> **状态**: ⏳ 待执行  
> **创建时间**: 2026-01-21 09:18  
> **来源**: Codex + Amp Code Review  
> **执行 Agent**: Codex

---

## 📝 简述

基于 Codex 和 Amp 的代码审查，执行一系列代码质量提升任务，按优先级排序：

1. **P0 安全**: CORS 限制 + 输入校验
2. **P1 修复**: Orchestrator 编译错误
3. **P2 性能**: StockChart + Zustand + 批量查询
4. **P3 质量**: 消除 any + 统一 tRPC 校验

---

## ✅ Done Definition

- [ ] `pnpm check` 通过
- [ ] AI SSE 端点有 CORS 限制
- [ ] 输入参数有长度/格式校验
- [ ] StockChart 不重复初始化
- [ ] Zustand 使用 selectors
- [ ] any 类型数量减少 50%

---

## 📊 子任务

| 任务 | 优先级 | 描述 | 工作量 |
|------|--------|------|--------|
| CDX-SEC-001 | P0 | CORS 限制 | 30min |
| CDX-SEC-002 | P0 | 输入校验 | 30min |
| CDX-ORCH-001 | P1 | Orchestrator 修复 | 1h |
| CDX-PERF-001 | P2 | StockChart 优化 | 1.5h |
| CDX-PERF-002 | P2 | Zustand Selectors | 1h |
| CDX-PERF-003 | P2 | 批量查询 | 1h |
| CDX-TS-001 | P3 | 消除 any | 2h |
| CDX-TS-002 | P3 | tRPC 输入统一 | 1h |
| CDX-FIX-001 | P3 | Tooltip 零值 | 15min |

---

## 📂 任务指南

- **Codex 任务指南**: `codex/CODEX-TASK-GUIDE.md`

---

## 🔧 Review 来源

### Codex Review 发现的问题

1. ~~TypeScript 编译失败~~ ✅ 已解决 (tsconfig 已排除)
2. 两个主题系统共存
3. StockChart 重复创建
4. Zustand 未使用 selectors
5. Watchlist N+1 查询问题
6. Tooltip 零值显示问题

### Amp Review 发现的问题

1. Orchestrator 编译错误（重复方法）
2. AI 端点无鉴权/CORS 限制
3. 输入校验不一致
4. 大量 any 类型
5. 批量接口无并发控制
6. 错误处理不统一

---

**维护者**: Antigravity  
**最后更新**: 2026-01-21 09:18
