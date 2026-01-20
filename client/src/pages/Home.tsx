import React, { useEffect } from "react";
import { AIChatPanel } from "@/refactor_v2/components/AIChatPanel";
import { CenterBottom } from "@/refactor_v2/components/CenterBottom";
import { CenterTop } from "@/refactor_v2/components/CenterTop";
import { FloatingAIChatInput } from "@/refactor_v2/components/FloatingAIChatInput";
import { LayoutShell } from "@/refactor_v2/components/LayoutShell";
import { LeftPane } from "@/refactor_v2/components/LeftPane";
import { useLayoutStore } from "@/refactor_v2/stores/layout.store";

export default function Home() {
  const { rightPanelOpen, closeRightPanel } = useLayoutStore();

  useEffect(() => {
    // 快捷键：Ctrl/Cmd + K 聚焦输入框
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector(
          'input[placeholder*="问 AI"]'
        ) as HTMLInputElement;
        input?.focus();
      }
      // Esc 关闭 AI 面板
      if (e.key === "Escape") {
        closeRightPanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeRightPanel]);

  return (
    <LayoutShell
      left={<LeftPane />}
      centerTop={<CenterTop />}
      centerBottom={<CenterBottom />}
      right={rightPanelOpen ? <AIChatPanel /> : null}
      floatingElement={<FloatingAIChatInput />}
    />
  );
}
