import { useCallback, RefObject } from "react";
import { HOTKEYS } from "@/constants/layout";
import { useLayoutStore } from "@/stores/layout.store";
import { parseHotkeyString, useHotkeys } from "./useHotkeys";

interface Focusable {
  focus: () => void;
}

interface UseAppHotkeysOptions {
  aiInputRef?: RefObject<Focusable | null>;
}

export function useAppHotkeys({ aiInputRef }: UseAppHotkeysOptions = {}) {
  const { closeRightPanel, toggleRightPanel, rightPanelOpen } =
    useLayoutStore();

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
