// Panel widths
export const AI_PANEL_WIDTH = 384;
export const LEFT_PANE_DEFAULT_WIDTH = 280;
export const LEFT_PANE_MIN_WIDTH = 200;
export const LEFT_PANE_MAX_WIDTH = 400;

// Panel heights (as percentages for resizable panels)
export const CENTER_TOP_DEFAULT_SIZE = 65;
export const CENTER_BOTTOM_DEFAULT_SIZE = 35;
export const CENTER_TOP_MIN_SIZE = 40;
export const CENTER_BOTTOM_MIN_SIZE = 20;

// Animation durations
export const PANEL_TRANSITION_DURATION = 300; // ms

// Keyboard shortcuts
export const HOTKEYS = {
  FOCUS_AI_INPUT: "mod+k", // ⌘/Ctrl + K
  TOGGLE_AI_PANEL: "mod+i", // ⌘/Ctrl + I
  CLOSE_AI_PANEL: "Escape",
} as const;

// Z-index layers
export const Z_INDEX = {
  FLOATING_INPUT: 10,
  AI_PANEL: 20,
  TOOLTIP: 30,
  MODAL: 40,
} as const;
