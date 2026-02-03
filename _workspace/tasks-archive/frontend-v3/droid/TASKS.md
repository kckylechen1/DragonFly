# 🟠 Droid 任务集 - Frontend V3 重构

> **执行时机**: Wave 4（GLM 和 Codex 完成后）  
> **预估时长**: 1.5-2h  
> **角色定位**: 跨端协调（样式调优、响应式测试）  
> **推荐模型**: Gemini 3 Flash 或 Claude Sonnet 4.5

---

## 📚 必读文档（执行前必须阅读）

1. **前端架构指南**  
   路径: `tasks/FutureShop/frontend-architecture-guide.md`  
   重点: 第 900-975 行（Tailwind 配置、主题色彩）

2. **Amp 综合评审报告** ⭐重要  
   路径: `FRONTEND_REFACTOR_REVIEW.md`  
   重点:
   - 第 251-344 行（响应式布局策略、4档断点、移动端布局）
   - 第 366-427 行（设置面板设计）
   - 第 1097-1250 行（UI/UX 设计系统、赛博金融风格）

3. **布局与数据流 SVG**  
   路径: `tasks/FutureShop/layout-and-dataflow.svg`

---

## 🎯 你的核心职责

你负责**用户体验**相关的收尾工作：

1. **响应式布局验证** - 确保 4 档断点正确
2. **设置面板** - 外观/交易/图表/通知/API
3. **样式调优** - 毛玻璃、霓虹效果、动画
4. **无障碍检查** - aria-label、键盘导航

---

## D-001: 响应式布局测试与修复

**任务**: 验证并修复 4 档响应式断点

**参考**: `FRONTEND_REFACTOR_REVIEW.md` 第 254-259 行

**测试清单**:

| 屏幕宽度 | 预期布局 | 验证点 |
|---------|----------|--------|
| ≥1440px (2K+) | 三栏完整 | Sidebar 展开 280px，对话和股票各 50% |
| 1024-1439px | 三栏紧凑 | Sidebar 可折叠，对话 55%，股票 45% |
| 768-1023px | 二栏 | Sidebar 强制折叠，仅显示一个面板 (Tab 切换) |
| <768px | 单栏 | 底部 Tab 切换对话/行情，Sidebar 抽屉式 |

**测试方法**:
1. 打开浏览器 DevTools
2. 切换响应式视图到各断点
3. 截图记录问题
4. 修复发现的布局问题

**输出**: 如发现问题，直接修复 `MainLayout.tsx` 或 `useResponsiveLayout.ts`

---

## D-002: 设置面板

**任务**: 创建设置面板模态框

**参考**: `FRONTEND_REFACTOR_REVIEW.md` 第 366-427 行（完整代码示例）

**输出文件**: `client/src/refactor_v2/components/settings/SettingsModal.tsx`

**设置分类**（从评审报告第 369-391 行）:

```typescript
interface Settings {
  // 外观
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  
  // 交易
  defaultSymbol: string;
  priceColorScheme: 'red-green' | 'green-red'; // 中国/美国配色
  
  // 图表
  chartType: 'candle' | 'line';
  showVolume: boolean;
  indicators: string[];
  
  // 通知
  priceAlerts: boolean;
  soundEnabled: boolean;
  
  // API
  apiKey?: string;
  dataSource: 'mock' | 'live';
}
```

**UI 结构**（从评审报告第 394-427 行）:
- 左侧 Tab 列表：外观 / 交易 / 图表 / 通知 / API
- 右侧内容区：对应设置项

**样式**: 使用毛玻璃效果

```css
.settings-modal {
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 245, 255, 0.1);
}
```

---

## D-003: 毛玻璃效果

**任务**: 为以下组件添加毛玻璃效果

**应用位置**:
1. `Sidebar.tsx` - 背景
2. `SettingsModal.tsx` - 模态框
3. `CommandPalette.tsx` - 命令面板

**CSS 类**:
```css
.glass {
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 245, 255, 0.1);
}

.glass-subtle {
  background: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

**验证**: 在不同背景下查看效果

---

## D-004: 暗色主题验证

**任务**: 验证所有组件在暗色主题下显示正常

**检查清单**:
- [ ] 文字对比度足够（WCAG AA 标准）
- [ ] 涨跌色正确（红涨绿跌 for 中国，绿涨红跌 for 美国）
- [ ] 边框颜色协调
- [ ] 悬停状态可见
- [ ] 禁用状态明显

**颜色规范**（从评审报告第 1129-1131 行）:
```typescript
const colors = {
  up: '#00FF88',    // 霓虹绿
  down: '#FF3366',  // 霓虹红
  neon: {
    cyan: '#00F5FF',    // 主强调
    amber: '#FFB800',   // 警告
    magenta: '#FF00FF', // 极端状态
  },
};
```

---

## D-005: 无障碍检查

**任务**: 确保基本无障碍支持

**检查清单**:
- [ ] 所有按钮有 `aria-label`
- [ ] 模态框有 `role="dialog"` 和 `aria-modal="true"`
- [ ] Tab 可键盘导航
- [ ] 颜色不是信息的唯一传达方式（涨跌有箭头 + 颜色）

**修复示例**:
```tsx
// ❌ 不好
<button onClick={toggleSidebar}>
  <ChevronLeft />
</button>

// ✅ 好
<button 
  onClick={toggleSidebar}
  aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
>
  {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
</button>
```

---

## D-006: 移动端布局（可选）

**任务**: 如果时间允许，实现完整的移动端布局

**参考**: `FRONTEND_REFACTOR_REVIEW.md` 第 292-344 行

**输出文件**:
1. `client/src/refactor_v2/components/layout/MobileLayout.tsx`
2. `client/src/refactor_v2/components/layout/ResponsiveLayout.tsx`（入口）

**结构**:
- 顶部导航
- 主内容区（对话或行情）
- 底部 Tab 切换
- 侧边栏抽屉

---

## ✅ 验收清单

```bash
pnpm check   # 类型检查
pnpm build   # 构建验证
```

**手动验证**:
- [ ] 4 档响应式断点正确
- [ ] 设置面板可打开/关闭/保存
- [ ] 毛玻璃效果在 Chrome/Safari 正常
- [ ] 暗色主题无对比度问题
- [ ] 键盘可完成主要操作

---

## ⚠️ 注意事项

1. **不要修改核心逻辑代码**（那是 GLM/Codex 的工作）
2. **发现 bug 时**，先尝试修复，如果太复杂就记录到 `issues.md`
3. **遇到不确定的地方**，参考 Amp 评审报告中的代码示例
