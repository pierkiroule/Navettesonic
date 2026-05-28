import { loadState } from "../core/storage.js";
import { getFishNavigableRadius } from "../core/constants.js";
import { SOON_MODE_COMPO, normalizeSoonMode } from "../core/uiState.js";
import { buildMazeByArena, generateLabybulle, getArenaLevelFromId, validateWorldGraph } from "../core/labybulleWorld.js";
import { createArenaBlob } from "../core/blobArena.js";
import { resetEchostoryState } from "../core/echostory/echostoryEngine.js";

export const saved = loadState();
export const labybulleWorld = generateLabybulle(saved?.labybulleSeed ?? 1);
export const worldErrors = validateWorldGraph(labybulleWorld);
export const mazeByArena = buildMazeByArena(labybulleWorld);
if (worldErrors.length) {
  console.warn("[labybulle] invalid generated world", worldErrors);
}

export const DEFAULT_ARENA_RADIUS = 1200;
export const DEFAULT_FISH_NAV_RADIUS = getFishNavigableRadius(DEFAULT_ARENA_RADIUS);
export const MAX_ARENA_LEVEL = 2;

export const defaultFish = {
  x: 0, y: -180, vx: 0, vy: 0, targetX: 0, targetY: -180, angle: -Math.PI / 2,
  swimPhase: 0, maxTrail: 90, maxSpeed: 3.1, depth: 1, mouthPull: 0,
  turnAmount: 0, turnVelocity: 0, arenaLevel: 0, wallHitCount: 0, lastWallHitAt: 0,
  breachOpen: false, breachAngle: null, breachOpenedAt: null, breachState: "closed",
  breachExpiresAt: null, breachUsed: false, hasQuill: false, membraneSide: "inside",
};

function normalizeBubble(rawBubble, index = 0) {
  const fallbackAngle = (Math.PI * 2 * index) / 5;
  const fallbackRadius = 720;
  const fallbackX = Math.cos(fallbackAngle) * fallbackRadius;
  const fallbackY = Math.sin(fallbackAngle) * fallbackRadius;
  const x = Number(rawBubble?.x);
  const y = Number(rawBubble?.y);
  const normalizedX = Number.isFinite(x) ? x : fallbackX;
  const normalizedY = Number.isFinite(y) ? y : fallbackY;
  const radius = Number(rawBubble?.r);
  const hue = Number(rawBubble?.hue);
  const depth = Number(rawBubble?.depth);
  return {
    ...rawBubble,
    x: normalizedX,
    y: normalizedY,
    r: Number.isFinite(radius) && radius > 0 ? radius : 72,
    hue: Number.isFinite(hue) ? hue : 190,
    depth: Number.isFinite(depth) ? depth : 1,
  };
}

function normalizeBubbles(list = []) {
  return (Array.isArray(list) ? list : []).map((bubble, index) => normalizeBubble(bubble, index));
}

const initialArenaId = saved?.currentArenaId || labybulleWorld.startArenaId;
const sourceBubbles = [];
const normalizedInitialBubbles = normalizeBubbles(sourceBubbles);
const normalizedArenaBubblesById = {
  [initialArenaId]: [],
};

export const initialEchostory = resetEchostoryState();
export const initialState = {
  mode: normalizeSoonMode(saved?.mode, SOON_MODE_COMPO),
  bubbles: normalizedInitialBubbles.map((bubble) => ({ ...bubble })),
  fish: {
    ...defaultFish,
    ...(saved?.fish || {}),
    arenaLevel: getArenaLevelFromId(initialArenaId),
  },
  fishTrail: saved?.fishTrail || [],
  selectedBubbleId: null,
  odysseoPath: [], odysseoDepthMarkers: [], odysseoPathIndex: 0, odysseoDirection: 1, odysseoTool: "draw",
  traceCircuit: [],
  selectedBeaconId: null,
  circuitAutopilot: false, circuitSegmentIndex: 0, circuitSegmentT: 0,
  path: saved?.path || [],
  eyesClosed: false,
  labybulleSeed: saved?.labybulleSeed ?? 1,
  worldGraph: labybulleWorld,
  currentArenaId: initialArenaId,
  mazeByArena,
  arenaBubblesById: normalizedArenaBubblesById,
  arenaBlob: createArenaBlob(96, DEFAULT_ARENA_RADIUS),
  gamePaused: false,
  pendingBlobAction: null,
  echostory: { ...initialEchostory },
};
