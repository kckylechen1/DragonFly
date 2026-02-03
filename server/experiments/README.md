# 实验性代码存档

⚠️ **注意**：此目录包含实验性代码，不保证可运行

## 说明

这些文件是开发过程中的实验版本，保留用于：

- 参考历史实现
- 对比不同方案
- 学习特定算法

## 文件清单

### AI Agent 实验

- `ai_agent_mini.ts` - 最小化 Agent 测试
- `ai_agent_small.ts` - 小规模测试
- `ai_agent_quick.ts` - 快速测试
- `ai_agent_20_stocks_optimized.ts` - 20 股优化版

### 分析脚本实验

- `analyze_980112_v1.ts` - 980112 原始版本
- `analyze_980112_simple.ts` - 简化版本
- `analyze_ai_sector_v1.ts` - AI 板块原始版本
- `analyze_ai_sector_simple.ts` - 简化版本

### 测试实验

- `test_basic_agent.ts` - 基础 Agent 测试
- `test_smart_agent.ts` - 智能 Agent 测试
- `test_detailed_responses.ts` - 详细响应测试
- `test_launch_gain.ts` - 启动收益测试

## 定期清理

建议每 6 个月审查一次，删除不再需要的文件。

## 当前状态

- **最后审查日期**: 2026-01-20
- **保留原因**: 代码重组时保留实验性实现以备参考
- **下一步操作**: 根据实际使用情况决定保留或删除

## 相关文件

实验版本的最终实现已移至 `server/scripts/` 和 `server/__tests__/`：

- `scripts/analysis/analyze_980112.ts` (最终版本)
- `scripts/analysis/analyze_ai_sector.ts` (完整版本)
- `__tests__/ai_agents/` (主要测试文件)
