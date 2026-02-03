import type { Theme } from "@/types/theme";

export const manusTheme: Theme = {
  id: "manus",
  name: "Manus",
  label: "Manus",
  category: "modern",
  type: "light",
  description: "Clean, minimal light theme inspired by Manus AI",

  colors: {
    primary: "#3b3b3b",
    secondary: "#525252",
    success: "#16a34a",
    danger: "#dc2626",
    warning: "#d97706",
    info: "#3b82f6",

    background: "#fafafa",
    surface: "#ffffff",
    text: {
      primary: "#171717",
      secondary: "#525252",
      muted: "#737373",
    },

    border: "#e5e5e5",
    divider: "#e5e5e5",

    up: "#16a34a",
    down: "#dc2626",
    neutral: "#525252",

    rgb: {
      primary: "59, 59, 59",
      secondary: "82, 82, 82",
      up: "22, 163, 74",
      down: "220, 38, 38",
    },
  },

  typography: {
    fontFamily: {
      base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
      display:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    fontSize: {
      xs: "11px",
      sm: "12px",
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
      normal: 1.6,
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
    sm: "6px",
    md: "12px",
    lg: "24px",
    full: "9999px",
  },

  shadows: {
    none: "none",
    sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
    md: "0 4px 6px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.08)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.1)",
  },

  animations: {
    duration: {
      fast: "0.15s",
      normal: "0.25s",
      slow: "0.3s",
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
