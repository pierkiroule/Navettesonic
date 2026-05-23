import { advanceWave, collectStar, createWaveStars, getCurrentWaveKey, resetEchostoryState } from "../../core/echostory/echostoryEngine.js";

export const createEchostorySlice = (set) => ({
  triggerEscapeCinematic: () => set((state) => ({
    echostory: state.echostory?.escapeState === "idle"
      ? { ...state.echostory, escapeState: "approach" }
      : state.echostory,
  })),
  setEscapeState: (escapeState) => set((state) => ({
    echostory: { ...state.echostory, escapeState },
  })),
  startEchostoryTraversal: () => set((state) => ({
    echostory: {
      ...state.echostory,
      traversalActive: true,
      traversalFinished: false,
      echostoryPathIndex: 0,
      escapeState: "idle",
    },
  })),
  stopEchostoryTraversal: () => set((state) => ({
    echostory: { ...state.echostory, traversalActive: false },
  })),
  resetEchostoryTraversal: () => set((state) => ({
    echostory: {
      ...state.echostory,
      traversalActive: false,
      traversalFinished: false,
      echostoryPathIndex: 0,
      activeLine: null,
      escapeState: "idle",
    },
  })),
  finishEchostoryTraversal: () => set((state) => ({
    echostory: {
      ...state.echostory,
      traversalActive: false,
      traversalFinished: true,
      escapeState: "approach",
    },
  })),
  setEchostoryActiveLine: (line) => set((state) => ({
    echostory: { ...state.echostory, activeLine: line ?? null },
  })),
  resetEchostory: () => set({ echostory: resetEchostoryState() }),
  startEchostory: () => set({ echostory: resetEchostoryState() }),
  setEchostoryWave: (index) => set((state) => {
    const safeIndex = Number.isFinite(index) ? Math.max(0, Math.min(2, index)) : state.echostory.waveIndex;
    return {
      echostory: {
        ...state.echostory,
        phase: "collect",
        waveIndex: safeIndex,
        stars: createWaveStars(safeIndex, 5),
      },
    };
  }),
  collectEchostoryStar: (id) => set((state) => ({ echostory: collectStar(state.echostory, id) })),
  advanceEchostoryWave: () => set((state) => ({ echostory: advanceWave(state.echostory) })),
  generateEchostoryText: () => set((state) => {
    const advanced = state.echostory;
    if (advanced.phase !== "story") return { echostory: advanced };

    const generatedStory = advanced.collectedStars.slice(0, 15).map((star, index) => ({
      id: `echostory-line-${index + 1}`,
      starId: star.id,
      wave: getCurrentWaveKey(star.wave === "immersion" ? 0 : star.wave === "bascule" ? 1 : 2),
      text: star.text,
    }));
    const storyMarkers = generatedStory.map((line, index) => ({
      id: `echostory-marker-${index + 1}`,
      lineId: line.id,
      index,
    }));

    return {
      echostory: {
        ...advanced,
        generatedStory,
        storyMarkers,
      },
    };
  }),
});
