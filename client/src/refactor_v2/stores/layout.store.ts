import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CENTER_BOTTOM_MIN_SIZE,
  CENTER_TOP_DEFAULT_SIZE,
  CENTER_TOP_MIN_SIZE,
} from "@/refactor_v2/constants/layout";

interface LayoutState {
  leftPanelSize: number; // percentage (0-100)
  centerTopSize: number; // percentage (0-100)
  rightPanelOpen: boolean;
}

interface LayoutActions {
  setLeftPanelSize: (size: number) => void;
  setCenterTopSize: (size: number) => void;
  setRightPanelOpen: (open: boolean) => void;
  openRightPanel: () => void;
  closeRightPanel: () => void;
  toggleRightPanel: () => void;
  resetLayout: () => void;
}

export type LayoutStore = LayoutState & LayoutActions;

const initialState: LayoutState = {
  leftPanelSize: 20,
  centerTopSize: CENTER_TOP_DEFAULT_SIZE,
  rightPanelOpen: false,
};

const centerTopMaxSize = 100 - CENTER_BOTTOM_MIN_SIZE;

export const useLayoutStore = create<LayoutStore>()(
  persist(
    set => ({
      ...initialState,

      setLeftPanelSize: size =>
        set({ leftPanelSize: Math.min(Math.max(size, 10), 35) }),

      setCenterTopSize: size =>
        set({
          centerTopSize: Math.min(
            Math.max(size, CENTER_TOP_MIN_SIZE),
            centerTopMaxSize
          ),
        }),

      setRightPanelOpen: open => set({ rightPanelOpen: open }),

      openRightPanel: () => set({ rightPanelOpen: true }),

      closeRightPanel: () => set({ rightPanelOpen: false }),

      toggleRightPanel: () =>
        set(state => ({ rightPanelOpen: !state.rightPanelOpen })),

      resetLayout: () => set(initialState),
    }),
    { name: "layout-store" }
  )
);
