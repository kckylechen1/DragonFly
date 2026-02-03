import React, { memo } from "react";
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

const badgeStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "11px",
  fontWeight: 500,
  background: "var(--bg-tertiary)",
  border: "1px solid var(--panel-border)",
  transition: "all 0.15s ease",
  cursor: "default",
};

const badgeHoverStyles: React.CSSProperties = {
  filter: "brightness(1.1)",
  borderColor: "var(--text-tertiary)",
};

const BadgeCloud: React.FC<BadgeCloudProps> = memo(function BadgeCloud({
  badges,
  maxVisible = 6,
}) {
  const visibleBadges = badges.slice(0, maxVisible);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  if (visibleBadges.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {visibleBadges.map(badge => {
        const Icon = badge.icon;
        const isHovered = hoveredId === badge.id;
        return (
          <div
            key={badge.id}
            style={{
              ...badgeStyles,
              ...(isHovered ? badgeHoverStyles : {}),
            }}
            className={badge.color}
            onMouseEnter={() => setHoveredId(badge.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Icon style={{ width: "12px", height: "12px" }} />
            <span>{badge.label}</span>
          </div>
        );
      })}
    </div>
  );
});

export { BadgeCloud };

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
