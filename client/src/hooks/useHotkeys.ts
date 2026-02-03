import { useEffect, useRef } from "react";

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

  useEffect(() => {
    callbacksRef.current = hotkeys;
  }, [hotkeys]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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

        const modifiers = hotkey.modifiers || [];
        const needsAlt = modifiers.includes("alt");
        const needsShift = modifiers.includes("shift");
        const needsMod =
          modifiers.includes("ctrl") || modifiers.includes("meta");
        const hasMod = event.ctrlKey || event.metaKey;

        const modifiersMatch =
          (needsMod ? hasMod : true) &&
          (!needsAlt || event.altKey) &&
          (!needsShift || event.shiftKey);

        if (!modifiersMatch) continue;

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

export function useHotkey(
  key: string,
  callback: HotkeyCallback,
  modifiers: ModifierKey[] = [],
  enabled = true
) {
  useHotkeys([{ key, modifiers, callback, enabled }], { enabled });
}

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
