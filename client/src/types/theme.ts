/**
 * Theme type definitions
 * Provides comprehensive type system for theme management
 */

/**
 * Single theme complete definition
 */
export interface Theme {
  id: string;
  name: string;
  label: string;
  description?: string;
  category: "pixel" | "modern" | "dark" | "custom";

  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    info: string;

    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };

    border: string;
    divider: string;

    up: string;
    down: string;
    neutral: string;

    rgb: {
      primary: string;
      secondary: string;
      up: string;
      down: string;
    };
    overlay?: string;
  };

  typography: {
    fontFamily: {
      base: string;
      mono: string;
      display: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };

  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };

  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };

  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };

  // Warp Engine Properties
  bgImage?: string;
  glassOpacity?: number;
  blur?: string; // e.g. "backdrop-blur-xl"
  type?: 'light' | 'dark';

  extras?: {
    [key: string]: any;
  };
}

/**
 * Theme metadata (for theme selector)
 */
export interface ThemeMetadata {
  id: string;
  name: string;
  label: string;
  category: Theme["category"];
  icon?: string;
  preview?: string;
  author?: string;
}

/**
 * Theme context value
 */
export interface ThemeContextValue {
  currentTheme: Theme;
  themeId: string;
  availableThemes: ThemeMetadata[];
  setTheme: (themeId: string) => void;
  updateThemeVariable: (key: string, value: string) => void;
}
