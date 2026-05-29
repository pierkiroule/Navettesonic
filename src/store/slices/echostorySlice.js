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
      timelineCursor: 0,
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
      timelineCursor: 0,
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
        stars: createWaveStars(safeIndex, 15),
        constellationLinks: [],
      },
    };
  }),
  collectEchostoryStar: (id) => set((state) => ({ echostory: collectStar(state.echostory, id) })),
  addTrailItem: (item) => set((state) => {
    if (!item?.id) return {};
    const echostory = state.echostory || {};
    const trailItems = Array.isArray(echostory.trailItems) ? echostory.trailItems : [];
    if (trailItems.some((entry) => entry?.id === item.id)) return {};
    return { echostory: { ...echostory, trailItems: [...trailItems, item] } };
  }),
  clearTrailItems: () => set((state) => ({
    echostory: { ...(state.echostory || {}), trailItems: [] },
  })),
  threadEchostoryStar: (id) => set((state) => {
    const echostory = state.echostory || {};
    if (!id) return { echostory };
    const currentCollected = echostory.collectedStars || [];
    if (currentCollected.length >= 15) return { echostory };
    if (currentCollected.some((star) => star?.id === id)) return { echostory };
    const source = (echostory.stars || []).find((star) => star?.id === id);
    if (!source) return { echostory };
    return {
      echostory: {
        ...echostory,
        collectedStars: [...currentCollected, { ...source, collected: true }].slice(0, 15),
      },
    };
  }),
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

    return {
      echostory: {
        ...advanced,
        storyTimeline: generatedStory.map((line, index) => ({
          id: line.id,
          text: line.text,
          index,
        })),
        timelineCursor: 0,
      },
    };
  }),
});
