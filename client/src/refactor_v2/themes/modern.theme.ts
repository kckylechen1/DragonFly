import type { Theme } from "@/refactor_v2/types/theme";

export const modernTheme: Theme = {
  id: "modern",
  name: "Modern",
  label: "现代风",
  category: "modern",
  description: "简洁现代设计，强调功能性和易用性",

  colors: {
    primary: "#3b82f6",
    secondary: "#06b6d4",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    info: "#06b6d4",

    background: "#ffffff",
    surface: "#f9fafb",
    text: {
      primary: "#111827",
      secondary: "#6b7280",
      muted: "#9ca3af",
    },

    border: "#e5e7eb",
    divider: "#e5e7eb",

    up: "#ef4444",
    down: "#10b981",
    neutral: "#f59e0b",

    rgb: {
      primary: "59, 130, 246",
      secondary: "6, 182, 212",
      up: "239, 68, 68",
      down: "16, 185, 129",
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
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
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
