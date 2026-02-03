# 🔵 GLM 任务清单: Frontend Cleanup

> **负责 Agent**: 🔵 GLM  
> **Epic**: frontend-cleanup  
> **预估用时**: 25-30 分钟  
> **参考文档**: [FRONTEND-CLEANUP-ANALYSIS.md](file:///Users/kc/Documents/trae_projects/DragonFly_Restructure/docs/FRONTEND-CLEANUP-ANALYSIS.md)

---

## ⚠️ 开始前必读

1. **打卡要求**: 每个任务开始和结束时打卡
2. **遇阻即停**: 如有问题，停下来描述问题，等待指示
3. **TDD 原则**: 删除后验证，确保不破坏构建
4. **备份优先**: 务必先完成 T1 备份再执行删除

---

## 🕐 Clock-In

```
🕐 Clock-In: [时间]
任务: Frontend Cleanup T1-T6
```

---

## T1: Git 准备 (2分钟)

### 目标
- [x] 确保工作区干净
- [ ] 创建备份标签
- [ ] 创建清理分支

### 步骤

**Step 1.1: 检查工作区状态**
```bash
cd /Users/kc/Documents/trae_projects/DragonFly_Restructure
git status
```
> 如果有未提交的更改，先提交或 stash

**Step 1.2: 创建备份标签**
```bash
git tag before-remove-legacy-frontend
```

**Step 1.3: 创建清理分支**
```bash
git checkout -b chore/remove-legacy-frontend
```

### ✅ 完成标准
- `git tag -l | grep before-remove-legacy-frontend` 有输出
- `git branch --show-current` 显示 `chore/remove-legacy-frontend`

---

## T2: 删除 P0 旧前端代码 (5分钟)

### 目标
- [ ] 删除旧入口 App.tsx
- [ ] 删除旧 pages/
- [ ] 删除旧 components/
- [ ] 删除旧 contexts/
- [ ] 删除旧 hooks/
- [ ] 删除旧 _core/
- [ ] 删除旧 __dev__/
- [ ] 删除 lib/utils.ts

### 步骤

**Step 2.1: 删除旧入口**
```bash
rm client/src/App.tsx
```

**Step 2.2: 删除旧目录**
```bash
rm -rf client/src/pages
rm -rf client/src/components
rm -rf client/src/contexts
rm -rf client/src/hooks
rm -rf client/src/_core
rm -rf client/src/__dev__
```

**Step 2.3: 删除旧工具函数**
```bash
rm client/src/lib/utils.ts
```

**Step 2.4: 快速验证**
```bash
ls client/src/
# 期望只剩: const.ts, index.css, main.tsx, lib/, refactor_v2/
```

### ✅ 完成标准
- `ls client/src/` 只显示：const.ts, index.css, lib, main.tsx, refactor_v2

---

## T3: 删除 P1 根目录杂项 (2分钟)

### 目标
- [ ] 删除 AI 输出日志
- [ ] 删除清理追踪文档
- [ ] 删除构建产物
- [ ] 删除旧代码存档

### 步骤

**Step 3.1: 删除 AI 输出日志**
```bash
rm -f grok-detailed-output.md
rm -f grok-changcheng-output.md
```

**Step 3.2: 删除已完成的清理文档**
```bash
rm -f CLEANUP-TRACKER.md
rm -f CLEANUP-SUMMARY.md
```

**Step 3.3: 删除构建产物和存档**
```bash
rm -rf dist
rm -rf archives
```

**Step 3.4: 验证**
```bash
ls -la | grep -E "(grok|CLEANUP|dist|archives)"
# 期望无输出
```

### ✅ 完成标准
- 上述 grep 命令无输出

---

## T4: 更新 .gitignore (3分钟)

### 目标
- [ ] 添加实验代码排除规则
- [ ] 添加临时文档排除规则
- [ ] 添加归档目录排除规则

### 步骤

**Step 4.1: 在 .gitignore 末尾添加以下内容**

打开 `.gitignore` 文件，在末尾追加：

```gitignore
# ===========================================
# 实验性代码
# ===========================================

# 实验脚本（不需要版本控制）
server/experiments/

# ===========================================
# 临时文档和输出
# ===========================================

# AI 临时输出
grok-*.md
*-output.md
*-detailed-output.md

# 已完成的清理/任务文档
CLEANUP-*.md

# 任务归档
tasks/archive/
tasks/**/DONE-*.md
tasks/**/COMPLETED-*.md

# ===========================================
# 归档目录
# ===========================================

# 旧代码存档（如需保留历史用 git tag）
archives/

# 文档归档
docs/archive/
```

### ✅ 完成标准
- `grep "server/experiments" .gitignore` 有输出

---

## T5: 验证构建 (5分钟)

### 目标
- [ ] TypeScript 检查通过
- [ ] 构建成功
- [ ] 开发服务器可启动

### 步骤

**Step 5.1: TypeScript 检查**
```bash
pnpm check
```
> 期望: 无错误

**Step 5.2: 生产构建**
```bash
pnpm build
```
> 期望: 构建成功

**Step 5.3: 启动开发服务器（快速验证后 Ctrl+C 退出）**
```bash
timeout 10 pnpm dev || true
```
> 期望: 服务器正常启动，10秒后自动退出

### ⚠️ 如果 T5 失败

1. **不要继续** - 停下来分析错误
2. 记录错误信息
3. 可能需要恢复某些文件
4. 报告问题并等待指示

### ✅ 完成标准
- `pnpm check` 返回 0
- `pnpm build` 返回 0

---

## T6: 依赖审计 P2 (10分钟)

### 目标
- [ ] 确认 wouter 不再被使用
- [ ] 移除 wouter 依赖
- [ ] 删除 wouter 补丁文件
- [ ] 清理 package.json patchedDependencies

### 步骤

**Step 6.1: 搜索 wouter 引用**
```bash
grep -r "wouter" client/src/
```
> 期望: 无输出（如有输出，记录位置，不要删除）

**Step 6.2: 如果无 wouter 引用，移除依赖**
```bash
pnpm remove wouter
```

**Step 6.3: 删除 wouter 补丁**
```bash
rm -f patches/wouter@3.7.1.patch
```

**Step 6.4: 检查 package.json 是否有 patchedDependencies**
```bash
grep -A2 "patchedDependencies" package.json
```
> 如果有 wouter 相关条目，需要手动编辑移除

**Step 6.5: 重新验证**
```bash
pnpm install
pnpm check
pnpm build
```

### ✅ 完成标准
- `grep -r "wouter" client/src/` 无输出
- `pnpm check && pnpm build` 成功

---

## T7: 提交更改

### 步骤

**Step 7.1: 添加所有更改**
```bash
git add -A
```

**Step 7.2: 提交**
```bash
git commit -m "chore: remove legacy frontend code

Removed:
- Old wouter-based App.tsx and routing
- Old pages/ directory (Home, StockDetail, NotFound)
- Old components/ directory (ui, stock, market, ai, layout)
- Old contexts/ and hooks/ directories
- Old _core/ and __dev__/ directories
- Cleanup tracking documents
- Archives and dist directories
- wouter dependency and patch

Kept:
- refactor_v2/ as the new frontend
- main.tsx, const.ts, lib/trpc.ts, index.css

Updated:
- .gitignore with experiment and temp file exclusions

BREAKING CHANGE: Legacy frontend removed"
```

---

## 🕐 Clock-Out

```
🕐 Clock-Out: [时间]
完成: T1-T7
用时: [X] 分钟
```

---

## 📝 完成报告

完成后创建报告文件: `output/COMPLETION-REPORT-GLM-YYYY-MM-DD.md`

```markdown
# 完成报告

**Agent**: GLM
**日期**: YYYY-MM-DD
**Clock-In**: HH:MM
**Clock-Out**: HH:MM
**用时**: XX 分钟

## 完成任务

| ID | 任务 | 状态 |
|----|------|------|
| T1 | Git 准备 | ✅ / ❌ |
| T2 | 删除 P0 代码 | ✅ / ❌ |
| T3 | 删除 P1 杂项 | ✅ / ❌ |
| T4 | 更新 .gitignore | ✅ / ❌ |
| T5 | 验证构建 | ✅ / ❌ |
| T6 | 依赖审计 | ✅ / ❌ |
| T7 | 提交更改 | ✅ / ❌ |

## 验证结果

pnpm check: ✅ / ❌
pnpm build: ✅ / ❌

## 删除统计

- 删除文件数: XX
- 删除目录数: XX
- 移除依赖: wouter

## 备注

[遇到的问题或值得注意的事项]
```

---

## ⚠️ 回退方案

如需回退：
```bash
# 方法 1：回退到备份标签
git checkout before-remove-legacy-frontend

# 方法 2：恢复特定目录
git checkout before-remove-legacy-frontend -- client/src/components/

# 方法 3：回退最后一次提交
git revert HEAD
```
