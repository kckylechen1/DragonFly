import React, { useRef } from "react";
import { AIChatPanel } from "@/refactor_v2/components/AIChatPanel";
import { CenterBottom } from "@/refactor_v2/components/CenterBottom";
import { CenterTop } from "@/refactor_v2/components/CenterTop";
import {
  FloatingAIChatInput,
  FloatingAIChatInputHandle,
} from "@/refactor_v2/components/FloatingAIChatInput";
import { LayoutShell } from "@/refactor_v2/components/LayoutShell";
import { LeftPane } from "@/refactor_v2/components/LeftPane";
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
