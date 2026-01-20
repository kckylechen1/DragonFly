import React from "react";
import { useWatchlistStore } from "@/refactor_v2/stores/watchlist.store";
import { InfoTabPanel } from "./InfoTabPanel";

export const CenterBottom: React.FC = () => {
  const { currentSymbol } = useWatchlistStore();

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      <InfoTabPanel symbol={currentSymbol} />
    </div>
  );
};

export default CenterBottom;
