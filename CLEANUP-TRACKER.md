# DragonFly 代码清理追踪表

**开始日期**：2026-01-20
**执行者**：GLM Agent
**分支**：refactor/code-cleanup-2026-01-20

## 清理前统计

- 总文件数：~150
- 代码总大小：待统计
- server/ 根目录测试文件：~30 个散落文件

## 清理后统计

- 总文件数：待填写
- 代码总大小：待填写
- server/ 目录结构：已优化

## 清理进度

- [x] 阶段 0：准备工作
- [ ] 阶段 1：删除明确废弃文件
- [ ] 阶段 2：整理 server 测试文件
- [ ] 阶段 3：处理客户端重复代码
- [ ] 阶段 4：清理依赖包
- [ ] 阶段 5：验证与文档

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
