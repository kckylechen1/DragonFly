# DragonFly v2 迁移追踪

**迁移开始**：2026-01-20
**当前状态**：Phase 1 进行中
**预计完成**：Phase 1 - 2026-01-25

## 架构对比

### 旧架构（将废弃）

```
client/src/
├── App.tsx                 # 旧路由配置
├── pages/
│   ├── Home.tsx           # ⚠️ 600+ 行，急需重构
│   ├── StockDetail.tsx
│   └── ComponentShowcase.tsx
└── components/
    ├── AIChatBox.tsx
    ├── DashboardLayout.tsx
    └── ...（13+ 个组件）
```

### 新架构（refactor_v2）

```
client/src/refactor_v2/
├── App.tsx                 # 新路由（未激活）
├── components/
│   ├── LayoutShell.tsx    # 四区域布局
│   ├── LeftPane.tsx       # 自选股列表
│   ├── CenterTop.tsx      # K 线图
│   ├── CenterBottom.tsx   # Info Tab
│   └── RightPane.tsx      # AI 面板
├── stores/                # Zustand 状态管理
│   ├── watchlist.store.ts
│   ├── layout.store.ts
│   └── aiChat.store.ts
└── themes/                # 多主题系统
    ├── perplexity-dark.css
    └── ...
```

## 迁移进度

### Phase 1：布局框架 + 主题（进行中）

| 组件                | 状态      | 负责人 | 完成日期   |
| ------------------- | --------- | ------ | ---------- |
| LayoutShell         | ✅ 完成   | GLM    | 2026-01-19 |
| 主题系统            | ✅ 完成   | GLM    | 2026-01-19 |
| LeftPane            | 🔄 进行中 | Codex  | -          |
| CenterTop           | 🔄 进行中 | Codex  | -          |
| AIChatPanel         | 🔄 进行中 | GLM    | 2026-01-20 |
| FloatingAIChatInput | 🔄 进行中 | GLM    | 2026-01-20 |
| AIChatStore         | ✅ 完成   | GLM    | 2026-01-20 |

### Phase 2：左侧分组自选股（未开始）

### Phase 3：底部 Tab 内容（未开始）

### Phase 4：响应式布局（未开始）

### Phase 5：文档与打磨（未开始）

## 激活新架构步骤

1. **完成 Phase 1 所有组件**
2. **修改入口文件**：
   ```typescript
   // client/src/main.tsx
   - import App from './App'
   + import App from './refactor_v2/App'
   ```
3. **测试功能完整性**
4. **删除旧代码**

## 旧代码处理

### 暂时保留（功能参考）

- `client/src/pages/Home.tsx` - 业务逻辑参考
- `client/src/components/AIChatBox.tsx` - AI 交互逻辑参考

### 可立即处理

- `client/src/pages/ComponentShowcase.tsx` - 移至开发环境专用（计划下一步）

### 计划删除时间

- Phase 1 完成后删除旧 `pages/` 和 `components/`

## 风险与回退方案

如需回退到旧版本：

```bash
git revert <commit-hash>
# 或恢复 main.tsx 的导入
```

## 已完成的工作

### 2026-01-20 GLM 任务完成

**GLM-001: FloatingAIChatInput 连接真实 API**

- ✅ 移除 mock setTimeout 代码
- ✅ 导入并使用 useSendMessage hook
- ✅ 更新 handleSend 函数调用真实 API
- ✅ 添加加载状态管理 (setIsLoading)
- ✅ 添加错误处理和状态 (setError)
- ✅ pnpm check 通过

**GLM-002: AIChatPanel 加载状态和错误处理**

- ✅ 更新 aiChat.store.ts 类型定义，添加 error 状态
- ✅ 添加 setLoading 和 setError 方法到 store
- ✅ 在 AIChatPanel.tsx 添加加载动画 UI
- ✅ 在 AIChatPanel.tsx 添加错误提示 UI
- ✅ 更新 FloatingAIChatInput.tsx 使用新的错误状态
- ✅ pnpm check 通过

**GLM-004: StockAnalysisFramework 6步骨架**

- ✅ 创建 server/\_core/analysis/ 目录
- ✅ 创建 stock-analysis-framework.ts 包含完整的 6 步分析框架结构
- ✅ 创建 server/\_core/memory/simplemem.types.ts 占位类型文件
- ✅ 创建 server/\_core/analysis/index.ts 导出文件
- ✅ pnpm check 通过

**GLM-003: Orchestrator 模型选择增强**

- ⚠️ 阻塞：model-router.ts 文件不存在（Codex 责任）

### 2026-01-20 代码清理完成

**Phase 0: 准备工作**

- ✅ 创建备份分支 refactor/code-cleanup-2026-01-20
- ✅ 创建备份标签 backup-before-cleanup-20260120
- ✅ 创建清理追踪文档 CLEANUP-TRACKER.md

**Phase 1: 删除明确废弃文件**

- ✅ 删除 server/indicators.ts.deprecated (7.2 KB)
- ✅ 删除 server/analyze_ai_final.js (7.9 KB) - JS 重复
- ✅ 删除 server/analyze_ai_sector.js (7.6 KB) - JS 重复
- ✅ 删除 server/test-market-breadth.js (1.5 KB) - JS 重复

**Phase 2: 整理 Server 测试文件**

- ✅ 创建 server/**tests**/ai_agents/ 目录
- ✅ 创建 server/**tests**/integration/ 目录
- ✅ 创建 server/**tests**/unit/ 目录
- ✅ 创建 server/scripts/analysis/ 目录
- ✅ 创建 server/scripts/backtest/ 目录
- ✅ 创建 server/experiments/ 目录
- ✅ 移动 AI Agent 测试文件（3 个保留 + 4 个实验）
- ✅ 移动分析脚本（4 个 scripts + 4 个实验）
- ✅ 移动通用测试文件（14 个 **tests** + 4 个实验）
- ✅ 创建 3 个 README.md（**tests**, scripts, experiments）
- ✅ pnpm check 通过

## 当前状态

**服务器端**：

- ✅ 目录结构已优化
- ✅ 测试文件已按类型分类
- ✅ 脚本工具已组织
- ✅ 实验代码已隔离

**客户端**：

- ✅ AIChatPanel 和 FloatingAIChatInput 已完成
- 📋 ComponentShowcase.tsx 待处理（移至 dev 或保留）
- 📋 Map.tsx 待审查使用情况
- 📋 旧 pages/ 和 components/ 待删除（Phase 1 完成后）

**下一步**：

1. 处理 ComponentShowcase.tsx（移至 **dev**/ 或删除）
2. 审查 Map.tsx 使用情况
3. 运行验证测试
4. 更新 CLEANUP-SUMMARY.md 和 README.md
