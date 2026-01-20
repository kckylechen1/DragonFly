import type { Theme } from "@/refactor_v2/types/theme";

export const cyberpunkTheme: Theme = {
  id: "cyberpunk",
  name: "Cyberpunk",
  label: "赛博朋克",
  category: "custom",
  description: "霓虹灯风格，高对比度，极客感十足",

  colors: {
    primary: "#ff006e",
    secondary: "#00f5ff",
    success: "#39ff14",
    danger: "#ff006e",
    warning: "#ffbe0b",
    info: "#00f5ff",

    background: "#0d0221",
    surface: "#1f0747",
    text: {
      primary: "#ff006e",
      secondary: "#00f5ff",
      muted: "#8338ec",
    },

    border: "#ff006e",
    divider: "#00f5ff",

    up: "#ff006e",
    down: "#39ff14",
    neutral: "#ffbe0b",

    rgb: {
      primary: "255, 0, 110",
      secondary: "0, 245, 255",
      up: "255, 0, 110",
      down: "57, 255, 20",
    },
  },

  typography: {
    fontFamily: {
      base: "'Orbitron', 'Courier New', monospace",
      mono: "'Space Mono', monospace",
      display: "'Orbitron', monospace",
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
      semibold: 700,
      bold: 900,
    },
    lineHeight: {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6,
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
    sm: "0",
    md: "2px",
    lg: "4px",
    full: "0",
  },

  shadows: {
    none: "none",
    sm: "0 0 10px rgba(255, 0, 110, 0.3)",
    md: "0 0 20px rgba(0, 245, 255, 0.3)",
    lg: "0 0 40px rgba(255, 0, 110, 0.5)",
    xl: "0 0 60px rgba(0, 245, 255, 0.6)",
  },

  animations: {
    duration: {
      fast: "0.08s",
      normal: "0.2s",
      slow: "0.4s",
    },
    easing: {
      linear: "linear",
      ease: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      easeIn: "cubic-bezier(0.42, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.58, 1)",
      easeInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
    },
  },

  extras: {
    glowEffect: "text-shadow: 0 0 10px",
    borderStyle: "solid",
  },
};
