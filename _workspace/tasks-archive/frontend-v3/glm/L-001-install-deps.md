# L-001: 安装依赖

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 目标
- [ ] 安装 framer-motion
- [ ] 安装 react-resizable-panels
- [ ] 安装 cmdk
- [ ] 安装 react-markdown 和 remark-gfm
- [ ] 确认 zustand 已安装

---

## 步骤

### Step 1: 进入项目目录

```bash
cd /Users/kckylechen/Desktop/DragonFly
```

### Step 2: 安装新依赖

```bash
pnpm add framer-motion react-resizable-panels cmdk react-markdown remark-gfm lightweight-charts
pnpm add -D @tanstack/react-virtual
```

### Step 3: 确认 zustand 已安装

```bash
pnpm list zustand
```

如果未安装：
```bash
pnpm add zustand
```

### Step 4: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] 所有依赖安装成功（无报错）
- [ ] `pnpm check` 通过
- [ ] 可以在代码中 `import { motion } from 'framer-motion'`

---

## 产出

- `package.json` 更新（自动）
- `pnpm-lock.yaml` 更新（自动）
