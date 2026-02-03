# L-007: 响应式 Layout Hook

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## 前置依赖
- L-004 (Stores)

## 目标
- [ ] 创建 `hooks/useResponsiveLayout.ts`
- [ ] 实现 4 档断点检测
- [ ] 同步布局状态到 UI Store

---

## 参考文档

- `FRONTEND_REFACTOR_REVIEW.md` 第 251-288 行

---

## 步骤

### Step 1: 创建 hooks/useResponsiveLayout.ts

```typescript
// client/src/refactor_v2/hooks/useResponsiveLayout.ts

import { useEffect, useState } from "react";
import { useUIStore } from "../stores/ui.store";

/**
 * 响应式布局断点
 */
export const BREAKPOINTS = {
  TABLET: 1024,
  MOBILE: 768,
  WIDE: 1440,
};

/**
 * 响应式布局 Hook
 * 
 * 作用：检测窗口宽度并同步到全局 UI 状态
 */
export function useResponsiveLayout() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWidth(newWidth);

      // ⚠️ 自动折叠侧边栏逻辑
      if (newWidth < BREAKPOINTS.TABLET) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    // 初始化执行一次
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed]);

  return {
    width,
    isMobile: width < BREAKPOINTS.MOBILE,
    isTablet: width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET,
    isDesktop: width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.WIDE,
    isWide: width >= BREAKPOINTS.WIDE,
  };
}
```

### Step 2: 更新 hooks/index.ts

```typescript
// client/src/refactor_v2/hooks/index.ts

export * from "./useResponsiveLayout";
```

### Step 3: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `useResponsiveLayout.ts` 已创建
- [ ] 导出 `BREAKPOINTS` 常量
- [ ] 在窗口小于 1024px 时自动折叠侧边栏
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/hooks/useResponsiveLayout.ts`
- `client/src/refactor_v2/hooks/index.ts`
