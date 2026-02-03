import React, { useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useAppHotkeys } from "@/hooks";
import { useMarketInit } from "@/hooks/useMarketInit";

export const HomePage: React.FC = () => {
  // 初始化市场数据
  useMarketInit();

  // 保留全局快捷键支持 (Cmd+K 等) - 暂时保留 Hook即使没有 ref，或者如果 hook 需要 ref 则需相应调整
  useAppHotkeys({});

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 1. 主 3 栏布局 (Sidebar | Chat | Stock) */}
      <MainLayout />

      {/* 2. 全局设置弹窗 (由 ui.store 控制) */}
      <SettingsModal />
    </div>
  );
};

export default HomePage;
