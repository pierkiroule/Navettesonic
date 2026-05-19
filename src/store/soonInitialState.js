import { defaultPack } from "../data/defaultPack.js";
import { loadState } from "../core/storage.js";
import { createSlalomCircuitFromBubbles } from "../core/traceCircuit.js";
import { getFishNavigableRadius } from "../core/constants.js";
import { SOON_MODE_COMPO, normalizeSoonMode } from "../core/uiState.js";
import { buildMazeByArena, generateLabybulle, getArenaLevelFromId, validateWorldGraph } from "../core/labybulleWorld.js";

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
  x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: -120, angle: -Math.PI / 2,
  swimPhase: 0, maxTrail: 90, maxSpeed: 3.1, depth: 1, mouthPull: 0,
  turnAmount: 0, turnVelocity: 0, arenaLevel: 0, wallHitCount: 0, lastWallHitAt: 0,
  breachOpen: false, breachAngle: null, breachOpenedAt: null, breachState: "closed",
  breachExpiresAt: null, breachUsed: false, hasQuill: false, membraneSide: "inside",
};

export const initialState = {
  mode: normalizeSoonMode(saved?.mode, SOON_MODE_COMPO),
  bubbles: (saved?.arenaBubblesById?.[saved?.currentArenaId || labybulleWorld.startArenaId] || saved?.bubbles || defaultPack.bubbles).map((bubble) => ({ ...bubble })),
  fish: {
    ...defaultFish,
    ...(saved?.fish || {}),
    arenaLevel: getArenaLevelFromId(saved?.currentArenaId || labybulleWorld.startArenaId),
  },
  fishTrail: saved?.fishTrail || [],
  selectedBubbleId: null,
  odysseoPath: [], odysseoDepthMarkers: [], odysseoPathIndex: 0, odysseoDirection: 1, odysseoTool: "draw",
  traceCircuit: saved?.traceCircuit || createSlalomCircuitFromBubbles(saved?.bubbles || defaultPack.bubbles),
  selectedBeaconId: null,
  circuitAutopilot: false, circuitSegmentIndex: 0, circuitSegmentT: 0,
  path: saved?.path || [],
  eyesClosed: false,
  labybulleSeed: saved?.labybulleSeed ?? 1,
  worldGraph: labybulleWorld,
  currentArenaId: saved?.currentArenaId || labybulleWorld.startArenaId,
  mazeByArena,
  arenaBubblesById: saved?.arenaBubblesById || {
    [saved?.currentArenaId || labybulleWorld.startArenaId]: (saved?.bubbles || defaultPack.bubbles).map((bubble) => ({ ...bubble })),
  },
};
