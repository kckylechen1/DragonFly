# T-010: 全局快捷键 Hook (useHotkeys)

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-002 (layout.store 有 toggle/close actions)

## 目标
- [ ] 创建 useHotkeys hook
- [ ] 支持 ⌘/Ctrl + K 聚焦 AI 输入框
- [ ] 支持 Escape 关闭 AI 面板
- [ ] 支持 ⌘/Ctrl + I 切换 AI 面板

---

## 步骤

### Step 1: 创建 hooks 目录和 useHotkeys hook

```typescript
// client/src/refactor_v2/hooks/useHotkeys.ts

import { useEffect, useCallback, useRef } from "react";

type ModifierKey = "ctrl" | "alt" | "shift" | "meta";
type HotkeyCallback = (event: KeyboardEvent) => void;

interface HotkeyConfig {
  key: string;
  modifiers?: ModifierKey[];
  callback: HotkeyCallback;
  enabled?: boolean;
  preventDefault?: boolean;
}

interface UseHotkeysOptions {
  enabled?: boolean;
}

export function useHotkeys(
  hotkeys: HotkeyConfig[],
  options: UseHotkeysOptions = {}
) {
  const { enabled = true } = options;
  const callbacksRef = useRef(hotkeys);

  // Keep callbacks up to date
  useEffect(() => {
    callbacksRef.current = hotkeys;
  }, [hotkeys]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea (unless it's Escape)
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const hotkey of callbacksRef.current) {
        if (hotkey.enabled === false) continue;

        const keyMatches =
          event.key.toLowerCase() === hotkey.key.toLowerCase() ||
          event.code.toLowerCase() === hotkey.key.toLowerCase();

        if (!keyMatches) continue;

        // Check modifiers
        const modifiers = hotkey.modifiers || [];
        const needsCtrl = modifiers.includes("ctrl");
        const needsMeta = modifiers.includes("meta");
        const needsAlt = modifiers.includes("alt");
        const needsShift = modifiers.includes("shift");

        // "mod" means Ctrl on Windows/Linux, Meta on Mac
        const needsMod = modifiers.includes("ctrl") || modifiers.includes("meta");
        const hasMod = event.ctrlKey || event.metaKey;

        const modifiersMatch =
          (needsMod ? hasMod : true) &&
          (!needsAlt || event.altKey) &&
          (!needsShift || event.shiftKey);

        if (!modifiersMatch) continue;

        // For Escape, always allow even when typing
        // For other shortcuts, skip if typing
        if (hotkey.key.toLowerCase() !== "escape" && isTyping) continue;

        if (hotkey.preventDefault !== false) {
          event.preventDefault();
        }

        hotkey.callback(event);
        break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}

// Convenience hook for a single hotkey
export function useHotkey(
  key: string,
  callback: HotkeyCallback,
  modifiers: ModifierKey[] = [],
  enabled = true
) {
  useHotkeys(
    [{ key, modifiers, callback, enabled }],
    { enabled }
  );
}

// Parse hotkey string like "mod+k" into config
export function parseHotkeyString(hotkeyStr: string): {
  key: string;
  modifiers: ModifierKey[];
} {
  const parts = hotkeyStr.toLowerCase().split("+");
  const key = parts.pop() || "";
  const modifiers: ModifierKey[] = [];

  for (const part of parts) {
    if (part === "mod" || part === "ctrl" || part === "cmd") {
      modifiers.push("ctrl");
      modifiers.push("meta");
    } else if (part === "alt" || part === "option") {
      modifiers.push("alt");
    } else if (part === "shift") {
      modifiers.push("shift");
    }
  }

  return { key, modifiers };
}
```

### Step 2: 创建 App 级别的快捷键 Provider

```typescript
// client/src/refactor_v2/hooks/useAppHotkeys.ts

import { useCallback, RefObject } from "react";
import { useHotkeys, parseHotkeyString } from "./useHotkeys";
import { useLayoutStore } from "@/refactor_v2/stores/layout.store";
import { HOTKEYS } from "@/refactor_v2/constants/layout";

interface UseAppHotkeysOptions {
  aiInputRef?: RefObject<HTMLInputElement>;
}

export function useAppHotkeys({ aiInputRef }: UseAppHotkeysOptions = {}) {
  const { closeRightPanel, toggleRightPanel, rightPanelOpen } = useLayoutStore();

  const focusAIInput = useCallback(() => {
    if (aiInputRef?.current) {
      aiInputRef.current.focus();
    }
  }, [aiInputRef]);

  const handleClosePanel = useCallback(() => {
    if (rightPanelOpen) {
      closeRightPanel();
    }
  }, [closeRightPanel, rightPanelOpen]);

  const handleTogglePanel = useCallback(() => {
    toggleRightPanel();
  }, [toggleRightPanel]);

  // Parse hotkey strings
  const focusKey = parseHotkeyString(HOTKEYS.FOCUS_AI_INPUT);
  const toggleKey = parseHotkeyString(HOTKEYS.TOGGLE_AI_PANEL);

  useHotkeys([
    {
      key: focusKey.key,
      modifiers: focusKey.modifiers,
      callback: focusAIInput,
    },
    {
      key: "escape",
      modifiers: [],
      callback: handleClosePanel,
    },
    {
      key: toggleKey.key,
      modifiers: toggleKey.modifiers,
      callback: handleTogglePanel,
    },
  ]);
}
```

### Step 3: 创建 hooks/index.ts 导出

```typescript
// client/src/refactor_v2/hooks/index.ts

export * from "./useHotkeys";
export * from "./useAppHotkeys";
```

### Step 4: 验证

```bash
pnpm check
```

---

## 验收标准

- [ ] useHotkeys hook 支持多个快捷键配置
- [ ] 支持 modifier keys (ctrl, meta, alt, shift)
- [ ] 支持 "mod" 作为跨平台修饰键
- [ ] 输入框内不触发非 Escape 快捷键
- [ ] useAppHotkeys 封装了所有应用级快捷键
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/hooks/useHotkeys.ts`
- `client/src/refactor_v2/hooks/useAppHotkeys.ts`
- `client/src/refactor_v2/hooks/index.ts`
