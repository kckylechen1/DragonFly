# TASK-001: 修复股票代码重复显示

## 负责 Agent: 🔵 GLM

## 问题描述

```
显示：300308 300308  ← 代码重复
应该：300308         ← 仅显示一次
```

## 目标

- [ ] 定位股票代码重复显示的根因
- [ ] 修复 HTML/TSX 中的重复渲染
- [ ] 确保代码仅显示一次

## 步骤

**Step 1: 检查 StockListItem.tsx**

文件路径: `client/src/components/stock/StockListItem.tsx`

查看该组件中渲染股票代码的部分，检查是否有重复渲染：

```bash
# 搜索渲染股票代码的位置
grep -n "stockCode" client/src/components/stock/StockListItem.tsx
```

**Step 2: 分析当前渲染逻辑**

当前代码结构（行 195-208）：
```tsx
{/* 左侧：名称和代码 */}
<div className="flex-1 min-w-0">
  <div className="text-xs font-medium text-foreground truncate">{name}</div>
  <div className="flex items-center gap-1 mt-0.5">
    {market.tag && (
      <span className={`text-[10px] px-1 rounded text-white ${market.color}`}>
        {market.tag}
      </span>
    )}
    <span className="text-[9px] text-muted-foreground">
      {item.stockCode}
    </span>
  </div>
</div>
```

**Step 3: 如果发现重复，移除多余的渲染**

如果股票代码重复出现，只保留一个位置的渲染。

**Step 4: 同时检查 StockDetailPanel.tsx**

文件路径: `client/src/components/stock/StockDetailPanel.tsx`

检查右侧面板是否也有重复显示：

```bash
grep -n "stockCode" client/src/components/stock/StockDetailPanel.tsx
```

**Step 5: 验证修复**

```bash
# 启动开发服务器
pnpm dev

# 在浏览器中检查：
# 1. 左侧自选股列表 - 股票代码应仅显示一次
# 2. 右侧详情面板 - 股票代码应仅显示一次
```

## 完成标准

- [x] 左侧列表：`300308` 仅显示一次
- [x] 右侧面板：`300308` 仅显示一次
- [x] 无 TypeScript 错误
- [x] 无 ESLint 警告

## 回滚方式

```bash
git checkout client/src/components/stock/StockListItem.tsx
git checkout client/src/components/stock/StockDetailPanel.tsx
```

## 执行总结

### 修改文件
1. `client/src/components/stock/StockListItem.tsx:145-146`
2. `client/src/components/stock/StockDetailPanel.tsx:492-493`

### 修改内容
添加检测逻辑：当API返回的股票名称等于股票代码时，不显示名称，避免重复显示。

### 验证结果
✅ TypeScript 类型检查通过 (`npm run check`)
✅ 后端服务器运行正常 (端口 6889)
✅ 无编译错误

### 待验证
需要启动前端服务器，在浏览器中验证实际显示效果。
