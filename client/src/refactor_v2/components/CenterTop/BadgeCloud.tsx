import React from "react";
import { Flame, type LucideIcon, Zap } from "lucide-react";

interface Badge {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
}

interface BadgeCloudProps {
  badges: Badge[];
  maxVisible?: number;
}

export const BadgeCloud: React.FC<BadgeCloudProps> = ({
  badges,
  maxVisible = 6,
}) => {
  const visibleBadges = badges.slice(0, maxVisible);

  if (visibleBadges.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {visibleBadges.map(badge => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.id}
            className={`flex items-center gap-1 px-3 py-1 rounded bg-[var(--bg-secondary)] text-sm ${badge.color}`}
          >
            <Icon className="w-4 h-4" />
            <span>{badge.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export function generateBadges(quote: { mainFlow: number }): Badge[] {
  const badges: Badge[] = [];

  const mainFlowInBillion = quote.mainFlow / 100000000;
  if (Math.abs(mainFlowInBillion) > 0.01) {
    badges.push({
      id: "main-flow",
      icon: Zap,
      label:
        mainFlowInBillion > 0
          ? `主力净流入 ¥${mainFlowInBillion.toFixed(2)}亿`
          : `主力净流出 ¥${Math.abs(mainFlowInBillion).toFixed(2)}亿`,
      color:
        mainFlowInBillion > 0
          ? "text-[var(--color-up)]"
          : "text-[var(--color-down)]",
    });
  }

  if (Math.random() > 0.5) {
    badges.push({
      id: "popularity",
      icon: Flame,
      label: "人气 #165",
      color: "text-orange-500",
    });
  }

  return badges;
}
