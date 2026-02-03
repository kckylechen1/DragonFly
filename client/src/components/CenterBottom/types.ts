export type TabId = "news" | "fundamental" | "sentiment" | "technical";

export interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

export const TABS: TabConfig[] = [
  { id: "news", label: "新闻", icon: "📰" },
  { id: "fundamental", label: "基本面", icon: "📊" },
  { id: "sentiment", label: "情绪", icon: "💭" },
  { id: "technical", label: "技术", icon: "📈" },
];
