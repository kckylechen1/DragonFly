import type { Theme } from "@/types/theme";

export const darkTheme: Theme = {
  id: "dark",
  name: "Dark",
  label: "暗黑风",
  category: "dark",
  description: "深色系设计，适合长时间使用",

  colors: {
    primary: "#8b5cf6",
    secondary: "#64748b",
    success: "#34d399",
    danger: "#f87171",
    warning: "#fbbf24",
    info: "#38bdf8",

    background: "#0f172a",
    surface: "#1e293b",
    text: {
      primary: "#f1f5f9",
      secondary: "#cbd5e1",
      muted: "#94a3b8",
    },

    border: "#334155",
    divider: "#334155",

    up: "#f87171",
    down: "#34d399",
    neutral: "#fbbf24",

    rgb: {
      primary: "139, 92, 246",
      secondary: "100, 116, 139",
      up: "248, 113, 113",
      down: "52, 211, 153",
    },
  },

  typography: {
    fontFamily: {
      base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
      display:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    fontSize: {
      xs: "12px",
      sm: "13px",
      base: "14px",
      lg: "16px",
      xl: "18px",
      "2xl": "20px",
      "3xl": "24px",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
  },

  radius: {
    none: "0",
    sm: "4px",
    md: "8px",
    lg: "12px",
    full: "9999px",
  },

  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.6)",
  },

  animations: {
    duration: {
      fast: "0.15s",
      normal: "0.25s",
      slow: "0.35s",
    },
    easing: {
      linear: "linear",
      ease: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
};
