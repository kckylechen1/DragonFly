import type { Theme, ThemeMetadata } from "@/types/theme";
import { pixelTheme } from "./pixel.theme";
import { modernTheme } from "./modern.theme";
import { darkTheme } from "./dark.theme";
import { cyberpunkTheme } from "./cyberpunk.theme";
import { manusTheme } from "./manus.theme";

export const THEME_REGISTRY = new Map<string, Theme>([
  ["pixel", pixelTheme],
  ["modern", modernTheme],
  ["dark", darkTheme],
  ["cyberpunk", cyberpunkTheme],
  ["manus", manusTheme],
]);

export const getTheme = (id: string): Theme | undefined =>
  THEME_REGISTRY.get(id);

export const getThemeMetadata = (): ThemeMetadata[] => {
  return Array.from(THEME_REGISTRY.values()).map(t => ({
    id: t.id,
    name: t.name,
    label: t.label,
    category: t.category,
  }));
};

export const DEFAULT_THEME_ID = "dark";
