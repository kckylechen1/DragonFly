# L-018: Warp 风格主题引擎集成

## 负责人: 🌌 Antigravity (You)
## 状态
- ⏱️ 开始时间: 待定
- ✅ 结束时间: 

---

## 📋 任务概述

在 Droid 完成前端基础抛光 (L-017) 后，由我亲自接手实现高级 **Warp 风格主题引擎**。这包括动态背景图片支持、全局玻璃拟态 (Glassmorphism)、以及从现有 `ThemeSwitcher` 迁移并增强的主题切换逻辑。

---

## 步骤

### Step 1: 升级 Theme Store

修改 `client/src/refactor_v2/stores/theme.store.ts` 和 `types/theme.ts`:
- 扩展 `Theme` 接口，增加：
  - `bgImage?: string` (背景图片 URL)
  - `glassOpacity?: number` (玻璃透明度 0-1)
  - `blur?: string` (背景模糊度, e.g., "blur-xl")
- 预设 Warp 风格主题数据：
  - **Canyon**: 红色岩石纹理
  - **Snow**: 雪山纹理
  - **Koi**: 锦鲤池塘
  - **Cyber**: 赛博朋克霓虹

### Step 2: 改造 MainLayout 实现全屏背景

修改 `client/src/refactor_v2/components/layout/MainLayout.tsx`:
- 添加 `z-0` 全屏背景层 (`fixed inset-0`)。
- 确保所有子面板 (Sidebar, Chat, Stock) 的背景变为半透明 (`bg-gray-950/80` -> `bg-gray-950/var(--glass-opacity)`).
- 移除物理分割线，使用 `backdrop-blur` 和 `border-white/10` 划分区域。

### Step 3: 实现高级主题切换器

创建或升级 `client/src/refactor_v2/components/ThemeSettings.tsx`:
- 模仿 Warp 的主题选择界面：
  - 显示主题缩略图 (卡片式)。
  - 点击即时预览。
- 集成到 `SettingsModal` 或 `Sidebar` 底部。

### Step 4: 细节调优
- 确保文字在不同背景下的对比度 (特别是浅色背景)。
- 优化拖拽手柄 (`PanelResizeHandle`) 的视觉效果，使其在玻璃背景上更自然。

---

## 验收标准
- [ ] 能在 Default (纯黑) 和 Warp (图片背景) 主题间流畅切换。
- [ ] 玻璃拟态效果自然，文字清晰可读。
- [ ] 窗口缩放时背景图片适配良好 (`bg-cover`).
- [ ] 性能达标，背景切换不卡顿。

## 产出文件
```
client/src/refactor_v2/stores/theme.store.ts
client/src/refactor_v2/types/theme.ts
client/src/refactor_v2/themes.ts
client/src/refactor_v2/components/layout/MainLayout.tsx
client/src/refactor_v2/components/ThemeSettings.tsx
```
