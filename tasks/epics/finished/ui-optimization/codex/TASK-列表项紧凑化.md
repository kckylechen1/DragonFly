# 简单任务：缩小列表项中间留白

## 负责 Agent: 🟢 Codex

## 问题
列表项中间 Sparkline 和涨跌幅徽章之间空白太多

## 修复

文件：`client/src/components/stock/StockListItem.tsx`

**只改一处**（行 219）：
```tsx
// 当前
<div className="w-16 shrink-0 flex justify-center px-1">

// 改为更小的宽度
<div className="w-12 shrink-0 flex justify-center">
```

或者让 Sparkline 更紧凑地靠近右侧的涨跌幅徽章。

## 验证

- [ ] 列表项中间留白减少
- [ ] Sparkline 可见
- [ ] 整体更紧凑
