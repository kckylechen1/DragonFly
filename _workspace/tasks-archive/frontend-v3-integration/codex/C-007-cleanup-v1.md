# C-007: V1 Code Cleanup & Refactor_v2 Promotion

## 负责 Agent: 🟢 Codex (GPT-5.2)

## 目标

清理前端旧代码，将 `refactor_v2/` 提升为主目录结构。

---

## 📋 任务概述

当前 `client/src/` 目录下有大量 v1 旧代码和 v2 新代码混杂。需要：
1. 删除不再使用的 v1 代码
2. 保留 `refactor_v2/` 作为主代码
3. 更新导入路径

### ⚠️ 文件所有权警告

**禁止修改以下文件** (Amp 负责):
- `client/src/refactor_v2/hooks/*`
- `client/src/refactor_v2/stores/*`
- `client/src/refactor_v2/services/*`
- `server/_core/*`

---

## 步骤

### Step 1: 分析当前目录结构 (5 分钟)

```bash
# 查看 client/src 目录结构
ls -la client/src/

# 预期结果:
# ├── refactor_v2/    ← 保留 (新代码)
# ├── lib/            ← 保留 (工具函数)
# ├── const.ts        ← 保留
# ├── main.tsx        ← 修改 (入口)
# ├── index.css       ← 保留
# ├── components/     ← 删除 (v1)
# ├── pages/          ← 删除 (v1)
# ├── hooks/          ← 删除 (v1, 已迁移到 refactor_v2)
# ├── stores/         ← 删除 (v1, 已迁移到 refactor_v2)
# └── ...
```

### Step 2: 确认入口文件 (5 分钟)

检查 `client/src/main.tsx` 的导入路径：

```typescript
// 确保 main.tsx 导入的是 refactor_v2
import App from './refactor_v2/App';
// 或
import { HomePage } from './refactor_v2/pages/HomePage';
```

### Step 3: 识别可删除文件 (10 分钟)

```bash
# 列出 v1 目录
find client/src -maxdepth 1 -type d | grep -v refactor_v2 | grep -v lib

# 检查这些目录是否被 refactor_v2 引用
grep -r "from '\.\./components" client/src/refactor_v2/ || echo "No v1 component imports"
grep -r "from '\.\./pages" client/src/refactor_v2/ || echo "No v1 page imports"
grep -r "from '\.\./hooks" client/src/refactor_v2/ || echo "No v1 hook imports"
```

### Step 4: 删除 V1 代码 (10 分钟)

**只删除确认不被使用的目录**:

```bash
# 安全删除 (先确认 git status 干净)
rm -rf client/src/components/   # v1 组件
rm -rf client/src/pages/        # v1 页面
rm -rf client/src/hooks/        # v1 hooks (已迁移)
rm -rf client/src/stores/       # v1 stores (已迁移)
rm -rf client/src/contexts/     # v1 contexts (如果存在)
rm -rf client/src/types/        # v1 types (检查是否被 refactor_v2 使用)
```

### Step 5: 验证构建 (5 分钟)

```bash
cd client
pnpm check
pnpm build
```

如果有错误，检查缺失的导入并修复。

### Step 6: 提交 (2 分钟)

```bash
git add -A
git commit -m "chore: remove v1 frontend code, keep refactor_v2"
```

---

## 验收标准

- [ ] `client/src/` 目录清洁，只保留必要文件
- [ ] `pnpm check` 无错误
- [ ] `pnpm build` 成功
- [ ] 应用正常启动

---

## 产出

```
删除:
- client/src/components/ (v1)
- client/src/pages/ (v1)
- client/src/hooks/ (v1, 如果已迁移)
- client/src/stores/ (v1, 如果已迁移)

保留:
- client/src/refactor_v2/
- client/src/lib/
- client/src/main.tsx
- client/src/index.css
- client/src/const.ts
```

---

## 回滚方式

```bash
git checkout v0.9-pre-cleanup -- client/src/
```
