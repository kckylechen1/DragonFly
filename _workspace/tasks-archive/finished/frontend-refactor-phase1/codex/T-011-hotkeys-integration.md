# T-011: 快捷键集成到 App 层

## 负责 Agent: 🟢 Codex

## 前置依赖
- T-010 (useHotkeys hook 已创建)

## 目标
- [ ] 在 App/页面级别集成快捷键
- [ ] FloatingAIChatInput 暴露 ref 供聚焦
- [ ] 验证所有快捷键正常工作

---

## 步骤

### Step 1: 更新 FloatingAIChatInput 支持 ref

```typescript
// client/src/refactor_v2/components/FloatingAIChatInput.tsx

import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Sparkles, Send, Lightbulb } from "lucide-react";
import { useAIChatStore, useAIPanelControl } from "@/refactor_v2/stores/aiChat.store";

export interface FloatingAIChatInputHandle {
  focus: () => void;
}

export const FloatingAIChatInput = forwardRef<FloatingAIChatInputHandle, {}>(
  (_, ref) => {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const { addMessage } = useAIChatStore();
    const { open, close } = useAIPanelControl();

    // Expose focus method
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const handleSend = () => {
      if (!input.trim()) return;

      addMessage({
        role: "user",
        content: input,
      });

      // Mock AI response
      setTimeout(() => {
        addMessage({
          role: "assistant",
          content: "这是 AI 的示例回答。在实际实现中，这里会调用 AI API。",
        });
      }, 1000);

      setInput("");
      open();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        close();
        inputRef.current?.blur();
      }
    };

    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[768px] z-10">
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)] backdrop-blur-sm border border-[var(--panel-border)] rounded-lg px-3 py-2 shadow-lg">
          <Sparkles className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="问 AI 关于这只股票的问题... (⌘K 聚焦)"
            className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
          <button
            onClick={() => {
              /* TODO: 示例问题下拉 */
            }}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
            title="示例问题"
          >
            <Lightbulb className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={handleSend}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
            title="发送 (Enter)"
          >
            <Send className="w-5 h-5 text-[var(--accent-primary)]" />
          </button>
        </div>
        
        {/* Hotkey hints */}
        <div className="flex justify-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
          <span>⌘K 聚焦</span>
          <span>⌘I 切换面板</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    );
  }
);

FloatingAIChatInput.displayName = "FloatingAIChatInput";
```

### Step 2: 创建 App 入口组件或页面组件

创建一个整合所有内容的页面组件：

```typescript
// client/src/refactor_v2/pages/HomePage.tsx

import React, { useRef } from "react";
import { LayoutShell } from "@/refactor_v2/components/LayoutShell";
import { LeftPane } from "@/refactor_v2/components/LeftPane";
import { CenterTop } from "@/refactor_v2/components/CenterTop";
import { CenterBottom } from "@/refactor_v2/components/CenterBottom";
import { AIChatPanel } from "@/refactor_v2/components/AIChatPanel";
import {
  FloatingAIChatInput,
  FloatingAIChatInputHandle,
} from "@/refactor_v2/components/FloatingAIChatInput";
import { useAppHotkeys } from "@/refactor_v2/hooks";

export const HomePage: React.FC = () => {
  const aiInputRef = useRef<FloatingAIChatInputHandle>(null);

  // Register app-level hotkeys
  useAppHotkeys({
    aiInputRef: aiInputRef as React.RefObject<HTMLInputElement>,
  });

  return (
    <LayoutShell
      left={<LeftPane />}
      centerTop={<CenterTop />}
      centerBottom={<CenterBottom />}
      right={<AIChatPanel />}
      floatingElement={<FloatingAIChatInput ref={aiInputRef} />}
    />
  );
};
```

Wait, there's a type mismatch. Let me fix useAppHotkeys:

### Step 3: 修复 useAppHotkeys 的类型

```typescript
// client/src/refactor_v2/hooks/useAppHotkeys.ts

import { useCallback, RefObject } from "react";
import { useHotkeys, parseHotkeyString } from "./useHotkeys";
import { useLayoutStore } from "@/refactor_v2/stores/layout.store";
import { HOTKEYS } from "@/refactor_v2/constants/layout";

// Generic handle type that has a focus method
interface Focusable {
  focus: () => void;
}

interface UseAppHotkeysOptions {
  aiInputRef?: RefObject<Focusable | null>;
}

export function useAppHotkeys({ aiInputRef }: UseAppHotkeysOptions = {}) {
  const { closeRightPanel, toggleRightPanel, rightPanelOpen } = useLayoutStore();

  const focusAIInput = useCallback(() => {
    aiInputRef?.current?.focus();
  }, [aiInputRef]);

  const handleClosePanel = useCallback(() => {
    if (rightPanelOpen) {
      closeRightPanel();
    }
  }, [closeRightPanel, rightPanelOpen]);

  const handleTogglePanel = useCallback(() => {
    toggleRightPanel();
  }, [toggleRightPanel]);

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

### Step 4: 更新 HomePage 使用正确的类型

```typescript
// client/src/refactor_v2/pages/HomePage.tsx

import React, { useRef } from "react";
import { LayoutShell } from "@/refactor_v2/components/LayoutShell";
import { LeftPane } from "@/refactor_v2/components/LeftPane";
import { CenterTop } from "@/refactor_v2/components/CenterTop";
import { CenterBottom } from "@/refactor_v2/components/CenterBottom";
import { AIChatPanel } from "@/refactor_v2/components/AIChatPanel";
import {
  FloatingAIChatInput,
  FloatingAIChatInputHandle,
} from "@/refactor_v2/components/FloatingAIChatInput";
import { useAppHotkeys } from "@/refactor_v2/hooks";

export const HomePage: React.FC = () => {
  const aiInputRef = useRef<FloatingAIChatInputHandle>(null);

  useAppHotkeys({ aiInputRef });

  return (
    <LayoutShell
      left={<LeftPane />}
      centerTop={<CenterTop />}
      centerBottom={<CenterBottom />}
      right={<AIChatPanel />}
      floatingElement={<FloatingAIChatInput ref={aiInputRef} />}
    />
  );
};

export default HomePage;
```

### Step 5: 创建 pages/index.ts

```typescript
// client/src/refactor_v2/pages/index.ts

export * from "./HomePage";
```

### Step 6: 验证

```bash
pnpm check
```

手动验证：
1. ⌘/Ctrl + K：聚焦 AI 输入框
2. ⌘/Ctrl + I：切换 AI 面板
3. Escape：关闭 AI 面板
4. 在输入框内输入时，⌘K 等不应干扰

---

## 验收标准

- [ ] FloatingAIChatInput 支持 ref
- [ ] useAppHotkeys 在页面级别工作
- [ ] ⌘/Ctrl+K 聚焦输入框
- [ ] ⌘/Ctrl+I 切换面板
- [ ] Escape 关闭面板
- [ ] 快捷键提示显示在 UI 上
- [ ] `pnpm check` 通过

---

## 产出文件

- `client/src/refactor_v2/components/FloatingAIChatInput.tsx` (更新)
- `client/src/refactor_v2/hooks/useAppHotkeys.ts` (更新)
- `client/src/refactor_v2/pages/HomePage.tsx` (新增)
- `client/src/refactor_v2/pages/index.ts` (新增)
