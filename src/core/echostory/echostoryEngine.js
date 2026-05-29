import { ECHOSTORY_WAVES } from "../../data/echostoryFragments.js";

const WAVE_KEYS = ["immersion", "bascule", "ouverture"];
const MAX_COLLECTED_STARS = 15;
const STAR_PHASE_COUNT = 3;
const STARS_PER_PHASE = 5;
const TOTAL_STARS = STAR_PHASE_COUNT * STARS_PER_PHASE;
const ARENA_RADIUS = 900;
const CONTOUR_RAIL_RADIUS = 1168;
const STAR_RADIUS_MIN = 34;
const STAR_RADIUS_MAX = 48;
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

function createContourRailLayout(count) {
  const safeCount = Math.max(1, count);
  return Array.from({ length: safeCount }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / safeCount;
    return {
      x: Math.cos(angle) * CONTOUR_RAIL_RADIUS,
      y: Math.sin(angle) * CONTOUR_RAIL_RADIUS,
      t: safeCount > 1 ? index / (safeCount - 1) : 0.5,
      phaseIndex: Math.min(STAR_PHASE_COUNT - 1, Math.floor(index / STARS_PER_PHASE)),
      contourAngle: angle,
    };
  });
}

export function getCurrentWaveKey(waveIndex) {
  return WAVE_KEYS[waveIndex] || WAVE_KEYS[0];
}

const PHASE_COLORS = ["#53b9ff", "#ff9f40", "#51d37c"];

export function createWaveStars(waveIndex, count = TOTAL_STARS) {
  const fragments = [];
  for (let phaseIndex = 0; phaseIndex < STAR_PHASE_COUNT; phaseIndex += 1) {
    const wave = getCurrentWaveKey(phaseIndex);
    const bank = ECHOSTORY_WAVES[wave] || [];
    fragments.push(...pickRandomUnique(bank, STARS_PER_PHASE));
  }
  const limited = fragments.slice(0, Math.max(0, Math.min(count, TOTAL_STARS)));
  const pearls = createContourRailLayout(limited.length);

  return limited.map((fragment, index) => ({
    ...fragment,
    id: `${fragment.id}-star-${index + 1}`,
    x: pearls[index]?.x ?? randomInRange(-ARENA_RADIUS, ARENA_RADIUS),
    y: pearls[index]?.y ?? randomInRange(-ARENA_RADIUS, ARENA_RADIUS),
    r: randomInRange(STAR_RADIUS_MIN, STAR_RADIUS_MAX),
    collected: DEV_AUTO_COLLECT_STARS,
    phase: (pearls[index]?.t ?? Math.random()) * Math.PI * 2,
    phaseIndex: pearls[index]?.phaseIndex ?? Math.min(STAR_PHASE_COUNT - 1, Math.floor(index / STARS_PER_PHASE)),
    color: PHASE_COLORS[pearls[index]?.phaseIndex ?? Math.min(STAR_PHASE_COUNT - 1, Math.floor(index / STARS_PER_PHASE))],
    attachedToContour: true,
    contourAngle: pearls[index]?.contourAngle ?? Math.atan2(pearls[index]?.y || 0, pearls[index]?.x || 0),
    pendingBreathChoice: false,
    expiring: false,
    expired: false,
  }));
}

export function canAdvanceWave(echostory) {
  const stars = echostory?.stars || [];
  return stars.length >= TOTAL_STARS && stars.every((star) => star.collected === true);
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

  return {
    ...echostory,
    waveIndex: 0,
    phase: "story",
    stars: [],
    collectedStars: mergedCollectedStars,
  };
}

export function resetEchostoryState() {
  return {
    phase: "collect",
    waveIndex: 0,
    stars: createWaveStars(0, TOTAL_STARS),
    collectedStars: [],
    storyTimeline: [],
    timelineCursor: 0,
    traversalActive: false,
    traversalFinished: false,
    echostoryPathIndex: 0,
    activeLine: null,
    escapeState: "idle",
    trailItems: [],
    constellationLinks: [],
  };
}
