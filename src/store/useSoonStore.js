import { create } from "zustand";
import { saveState } from "../core/storage.js";
import { initialState } from "./soonInitialState.js";
import { createWorldSlice } from "./slices/worldSlice.js";
import { createOdysseoSlice } from "./slices/odysseoSlice.js";
import { createFishSlice } from "./slices/fishSlice.js";
import { createCircuitSlice } from "./slices/circuitSlice.js";
import { createBubbleSlice } from "./slices/bubbleSlice.js";
import { createPackSlice } from "./slices/packSlice.js";
import { createEchostorySlice } from "./slices/echostorySlice.js";

export const useSoonStore = create((set, get) => ({
  ...initialState,
  setMode: (mode) => {
    set({ mode, eyesClosed: false, selectedBubbleId: null, odysseoPath: [], odysseoDepthMarkers: [], odysseoPathIndex: 0, odysseoDirection: 1, odysseoTool: "draw", selectedBeaconId: null, circuitAutopilot: get().circuitAutopilot });
    saveState(get());
  },
  toggleEyesClosed: () => { set((state) => ({ eyesClosed: !state.eyesClosed })); saveState(get()); },
  ...createWorldSlice(set, get),
  ...createOdysseoSlice(set, get),
  ...createFishSlice(set, get),
  ...createCircuitSlice(set, get),
  ...createBubbleSlice(set, get),
  ...createPackSlice(set, get),
  ...createEchostorySlice(set, get),
}));
