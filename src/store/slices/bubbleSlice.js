import { clampToCircle } from "../../core/geometry.js";
import { saveState } from "../../core/storage.js";
import { clampDepth } from "../../core/fishBubblePhysics.js";
import { DEFAULT_ARENA_RADIUS } from "../soonInitialState.js";

export const createBubbleSlice = (set, get) => ({
  selectBubble: (id) => set({ selectedBubbleId: id, selectedBeaconId: null }),
  selectBeacon: (id) => set({ selectedBeaconId: id, selectedBubbleId: null }),
  addBubble: () => {
    set({ selectedBubbleId: null });
    saveState(get());
  },
  updateBubble: (id, patch) => {
    set((state) => ({
      bubbles: state.bubbles.map((bubble) => {
        if (bubble.id !== id) return bubble;
        const next = { ...bubble, ...patch };
        if ("depth" in patch) next.depth = clampDepth(patch.depth);
        if ("x" in patch || "y" in patch) {
          const safe = clampToCircle({ x: next.x, y: next.y }, DEFAULT_ARENA_RADIUS * 1.6);
          next.x = safe.x;
          next.y = safe.y;
        }
        return next;
      }),
    }));
    saveState(get());
  },
  deleteBubble: (id) => {
    set((state) => ({
      bubbles: state.bubbles.filter((bubble) => bubble.id !== id),
      selectedBubbleId: state.selectedBubbleId === id ? null : state.selectedBubbleId,
    }));
    saveState(get());
  },
});
