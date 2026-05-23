import { ECHOSTORY_WAVES } from "../../data/echostoryFragments.js";

const WAVE_KEYS = ["immersion", "bascule", "ouverture"];
const MAX_COLLECTED_STARS = 15;
const STARS_PER_WAVE = 5;
const ARENA_RADIUS = 900;
const DEV_AUTO_COLLECT_STARS = Boolean(import.meta?.env?.DEV);

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandomUnique(items, count) {
  const pool = [...items];
  const picks = [];
  while (pool.length && picks.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }
  return picks;
}

export function getCurrentWaveKey(waveIndex) {
  return WAVE_KEYS[waveIndex] || WAVE_KEYS[0];
}

export function createWaveStars(waveIndex, count = STARS_PER_WAVE) {
  const wave = getCurrentWaveKey(waveIndex);
  const bank = ECHOSTORY_WAVES[wave] || [];
  const fragments = pickRandomUnique(bank, Math.max(0, Math.min(count, STARS_PER_WAVE)));

  return fragments.map((fragment, index) => ({
    ...fragment,
    id: `${fragment.id}-star-${index + 1}`,
    x: randomInRange(-ARENA_RADIUS, ARENA_RADIUS),
    y: randomInRange(-ARENA_RADIUS, ARENA_RADIUS),
    r: randomInRange(14, 26),
    collected: DEV_AUTO_COLLECT_STARS,
    phase: randomInRange(0, Math.PI * 2),
  }));
}

export function canAdvanceWave(echostory) {
  const stars = echostory?.stars || [];
  return stars.length === STARS_PER_WAVE && stars.every((star) => star.collected === true);
}

export function collectStar(echostory, starId) {
  if (!echostory || !starId) return echostory;
  if ((echostory.collectedStars || []).length >= MAX_COLLECTED_STARS) return echostory;

  let collected = null;
  const stars = (echostory.stars || []).map((star) => {
    if (star.id !== starId || star.collected) return star;
    collected = { ...star, collected: true };
    return collected;
  });

  if (!collected) return echostory;

  return {
    ...echostory,
    stars,
    collectedStars: [...(echostory.collectedStars || []), collected].slice(0, MAX_COLLECTED_STARS),
  };
}

export function advanceWave(echostory) {
  if (!echostory) return resetEchostoryState();
  if (!canAdvanceWave(echostory)) return echostory;

  const collectedStars = echostory.collectedStars || [];
  const currentWaveCollected = (echostory.stars || []).filter((star) => star?.collected);
  const knownStarIds = new Set(collectedStars.map((star) => star?.id));
  const mergedCollectedStars = [
    ...collectedStars,
    ...currentWaveCollected.filter((star) => !knownStarIds.has(star?.id)),
  ].slice(0, MAX_COLLECTED_STARS);

  const nextWaveIndex = echostory.waveIndex + 1;
  const hasNextWave = nextWaveIndex < WAVE_KEYS.length;

  return {
    ...echostory,
    waveIndex: hasNextWave ? nextWaveIndex : echostory.waveIndex,
    phase: hasNextWave ? "collect" : "story",
    stars: hasNextWave ? createWaveStars(nextWaveIndex, STARS_PER_WAVE) : [],
    collectedStars: mergedCollectedStars,
  };
}

export function resetEchostoryState() {
  return {
    phase: "collect",
    waveIndex: 0,
    stars: createWaveStars(0, STARS_PER_WAVE),
    collectedStars: [],
    storyTimeline: [],
    timelineCursor: 0,
    traversalActive: false,
    traversalFinished: false,
    echostoryPathIndex: 0,
    activeLine: null,
    escapeState: "idle",
  };
}
