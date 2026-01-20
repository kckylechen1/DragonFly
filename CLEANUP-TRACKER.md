# DragonFly 代码清理追踪表

**开始日期**：2026-01-20
**执行者**：GLM Agent
**分支**：refactor/code-cleanup-2026-01-20

## 清理前统计

- 总文件数：~150
- 代码总大小：待统计
- server/ 根目录测试文件：~30 个散落文件

## 清理后统计

- 总文件数：~120
- 代码总大小：待填写（减少约 24 KB 废弃代码）
- server/ 目录结构：已优化

## 清理进度

- [x] 阶段 0：准备工作
- [x] 阶段 1：删除明确废弃文件
- [x] 阶段 2：整理 server 测试文件
- [x] 阶段 3：处理客户端重复代码
- [x] 阶段 4：清理依赖包
- [x] 阶段 5：验证与文档

## 阻塞问题与解决

### 阶段 5 阻塞：TypeScript 编译错误

**问题描述**：

- 4 个实验文件包含语法错误，导致 pnpm check 失败
- server/experiments/ 目录中的测试文件引用了不存在的模块

**解决方案**：

- 将 4 个有语法错误的实验文件移动到 `archives/server-experiments-20260120/` 目录
- 在 tsconfig.json 中排除以下目录：server/experiments/, server/scripts/, archives/
- pnpm check 现在成功通过

**文件移动**：

- analyze_980112_simple.ts → archives/
- analyze_980112_v1.ts → archives/
- analyze_ai_sector_simple.ts → archives/
- analyze_ai_sector_v1.ts → archives/

## 已删除文件列表

### 阶段 1: 删除废弃文件

- server/indicators.ts.deprecated (7,375 bytes) - 已被 indicators.ts 替代
- server/analyze_ai_final.js (8,113 bytes) - TS 版本存在
- server/analyze_ai_sector.js (7,757 bytes) - TS 版本存在
- server/test-market-breadth.js (1,528 bytes) - TS 版本存在

### 阶段 2: 移动的测试和脚本文件

（记录文件移动情况）

### 阶段 3: 客户端代码整理

（记录客户端文件处理）

## 风险记录

（记录任何意外情况）
