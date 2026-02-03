# L-000: 性能模式 Store

## 负责人: 🔵 GLM
## 状态
- ⏱️ 开始时间: 
- ✅ 结束时间: 

## ⚠️ Oracle P0 护栏 - 性能分级支持

## 目标
- [ ] 创建 `stores/performance.store.ts`
- [ ] 实现性能分级：`full` | `reduced` | `minimal`
- [ ] 自动检测 `prefers-reduced-motion`
- [ ] 提供基于性能等级的计算属性（shouldAnimate, shouldBlur, shouldGlow）

---

## 参考文档

- `tasks/epics/frontend-v3/ORACLE_REVIEW.md` 第 258-305 行

---

## 步骤

### Step 1: 创建 performance.store.ts

```typescript
// client/src/refactor_v2/stores/performance.store.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PerformanceMode = 'full' | 'reduced' | 'minimal';

interface PerformanceState {
  performanceMode: PerformanceMode;
  prefersReducedMotion: boolean;
  
  // Actions
  setPerformanceMode: (mode: PerformanceMode) => void;
  
  // Selectors/Computed (手动实现)
  getShouldAnimate: () => boolean;
  getShouldBlur: () => boolean;
  getShouldGlow: () => boolean;
}

/**
 * 性能偏好 Store
 * 
 * 作用：统一管理视觉特效的降级逻辑。
 */
export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      performanceMode: 'full',
      prefersReducedMotion: 
        typeof window !== 'undefined' 
          ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
          : false,
      
      setPerformanceMode: (mode) => set({ performanceMode: mode }),

      getShouldAnimate: () => {
        const { performanceMode, prefersReducedMotion } = get();
        return performanceMode === 'full' && !prefersReducedMotion;
      },

      getShouldBlur: () => {
        return get().performanceMode === 'full';
      },

      getShouldGlow: () => {
        return get().performanceMode !== 'minimal';
      }
    }),
    {
      name: 'dragonfly-performance-state'
    }
  )
);
```

### Step 2: 注册到 stores/index.ts

```typescript
// client/src/refactor_v2/stores/index.ts
// 如果文件夹不存在请先创建

export { usePerformanceStore } from "./performance.store";
```

### Step 3: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] `performance.store.ts` 已创建
- [ ] 支持持久化 (persist)
- [ ] 计算属性逻辑正确
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/stores/performance.store.ts`
