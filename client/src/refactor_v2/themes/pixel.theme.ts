import type { Theme } from "@/refactor_v2/types/theme";

export const pixelTheme: Theme = {
  id: "pixel",
  name: "Pixel",
  label: "像素风",
  category: "pixel",
  description: "复古像素艺术风格，8-16位美学结合现代设计",

  colors: {
    primary: "#6d2d95",
    secondary: "#00d4ff",
    success: "#00ff00",
    danger: "#ff0055",
    warning: "#ffff00",
    info: "#00d4ff",

    background: "#0a0e27",
    surface: "#1a1f3a",
    text: {
      primary: "#ffffff",
      secondary: "#8896b8",
      muted: "#5a6580",
    },

    border: "#3a4560",
    divider: "#3a4560",

    up: "#ff0055",
    down: "#00ff00",
    neutral: "#ffff00",

    rgb: {
      primary: "109, 45, 149",
      secondary: "0, 212, 255",
      up: "255, 0, 85",
      down: "0, 255, 0",
    },
  },

  typography: {
    fontFamily: {
      base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'Courier New', 'IBM Plex Mono', monospace",
      display: "'Press Start 2P', monospace",
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
      tight: 1.2,
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
    sm: "2px",
    md: "4px",
    lg: "6px",
    full: "9999px",
  },

  shadows: {
    none: "none",
    sm: "1px 1px 0px rgba(0, 0, 0, 0.2)",
    md: "2px 2px 0px rgba(0, 212, 255, 0.3)",
    lg: "4px 4px 0px rgba(109, 45, 149, 0.2)",
    xl: "6px 6px 0px rgba(0, 0, 0, 0.3)",
  },

  animations: {
    duration: {
      fast: "0.1s",
      normal: "0.3s",
      slow: "0.5s",
    },
    easing: {
      linear: "linear",
      ease: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  extras: {
    pixelBorder: "2px solid",
    pixelShadow: "2px 2px 0px",
    scanlineOpacity: "0.15",
  },
};
