# 图表周期选择器布局修复

## 负责 Agent: 🟢 Codex

## 问题描述

1. 周期选择器（分时/3日/5日/日K/周K/月K）位置不对，应该整合到上面的区域
2. 点击选中后，蓝色指示线会"冲突"到图表区域，导致无法再次点击

## 代码位置

文件：`client/src/components/stock/StockDetailPanel.tsx`
行号：715-743

```tsx
{[
  { key: "timeline", label: "分时" },
  { key: "timeline3d", label: "3日" },
  { key: "timeline5d", label: "5日" },
  { key: "day", label: "日K" },
  { key: "week", label: "周K" },
  { key: "month", label: "月K" },
].map(item => (
  <button
    className={`... ${chartType === item.key
      ? "text-foreground border-t-2 border-primary"
      : "text-muted-foreground hover:text-foreground"
    }`}
  >
```

## 修复方案

1. 检查周期选择器的父容器层级
2. 确保按钮的 z-index 和点击区域正确
3. 可能需要调整 `border-t-2` 的位置或改用其他指示方式

## 验证

- [ ] 选择器可以正常点击切换
- [ ] 选中指示线不会覆盖到图表区域
- [ ] 切换后可以再次点击其他选项
