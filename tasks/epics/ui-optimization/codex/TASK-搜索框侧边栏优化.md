# 搜索框优化 + 侧边栏收缩功能

## 负责 Agent: 🟢 Codex

## 问题清单

### 1. 搜索框太大
当前搜索框的高度和 padding 偏大，占用空间过多

### 2. 缺少侧边栏收缩功能
建议添加一个拉伸/收缩按钮，让用户可以折叠侧边栏

---

## 修改方案

### 1. 紧凑化搜索框

文件：`client/src/components/stock/SearchSection.tsx`

目标：
- 减小搜索框高度（约 36px）
- 减小 padding
- 减小圆角

### 2. 添加侧边栏收缩按钮

文件：`client/src/components/stock/WatchlistSidebar.tsx`

功能：
- 在侧边栏顶部或边缘添加一个收缩/展开按钮
- 点击后侧边栏折叠为一个窄条（约 48px）
- 再次点击展开

实现参考：
```tsx
const [collapsed, setCollapsed] = useState(false);

// 折叠状态只显示图标
if (collapsed) {
  return (
    <div className="w-12 h-full border-r flex flex-col items-center py-2">
      <button onClick={() => setCollapsed(false)}>
        <ChevronRight />
      </button>
    </div>
  );
}

// 正常状态
return (
  <div className="w-56 ...">
    <button onClick={() => setCollapsed(true)}>
      <ChevronLeft />
    </button>
    {/* 其余内容 */}
  </div>
);
```

---

## 验证

- [ ] 搜索框高度约 36px，紧凑不臃肿
- [ ] 侧边栏有收缩按钮
- [ ] 点击收缩后侧边栏变窄
- [ ] 再次点击可以展开
