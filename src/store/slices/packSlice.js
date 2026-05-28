import { clearState, saveState } from "../../core/storage.js";
import { defaultFish } from "../soonInitialState.js";
import { SOON_MODE_COMPO, normalizeSoonMode } from "../../core/uiState.js";

export const createPackSlice = (set, get) => ({
  addPathPoint: () => {},
  clearPath: () => {
    set({ path: [] });
    saveState(get());
  },
  importSoonData: (data) => {
    if (!data || !Array.isArray(data.bubbles)) return;
    set((state) => ({
      mode: normalizeSoonMode(data.mode, SOON_MODE_COMPO),
      bubbles: [],
      fish: { ...state.fish, ...(data.fish || {}), vx: 0, vy: 0, maxSpeed: state.fish.maxSpeed || 3.1 },
      traceCircuit: [],
      selectedBubbleId: null,
      odysseoPath: [],
      odysseoDepthMarkers: [],
      odysseoPathIndex: 0,
      odysseoDirection: 1,
      odysseoTool: "draw",
      selectedBeaconId: null,
      path: Array.isArray(data.path) ? data.path : [],
      eyesClosed: Boolean(data.eyesClosed),
    }));
    saveState(get());
  },
  reset: () => {
    clearState();
    set({
      mode: SOON_MODE_COMPO,
      bubbles: [],
      fish: { ...defaultFish },
      selectedBubbleId: null,
      odysseoPath: [],
      odysseoDepthMarkers: [],
      odysseoPathIndex: 0,
      odysseoDirection: 1,
      odysseoTool: "draw",
      traceCircuit: [],
      selectedBeaconId: null,
      circuitAutopilot: false,
      circuitSegmentIndex: 0,
      circuitSegmentT: 0,
      path: [],
      eyesClosed: false,
    });
  },
  exportPack: () => {
    const state = get();
    return {
      mode: state.mode,
      bubbles: [],
      fish: state.fish,
      traceCircuit: [],
      path: state.path,
      eyesClosed: state.eyesClosed,
      labybulleSeed: state.labybulleSeed,
      currentArenaId: state.currentArenaId,
    };
  },
  importPack: (data) => get().importSoonData(data),
  resetPack: () => get().reset(),
});
