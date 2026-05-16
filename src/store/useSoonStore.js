import { updateSnakeFishToTarget, createInitialSpine } from "../core/fishSnakeMotion.js";
import { create } from "zustand";
import {
  addDepthMarker,
  addOdysseoPathPoint,
  clearOdysseoPath,
  getDepthAtPathIndex,
  stepOdysseoTraversal,
} from "../core/odysseoPath.js";
import { defaultPack } from "../data/defaultPack.js";
import { clearState, loadState, saveState } from "../core/storage.js";
import {
  clampToCircle,
  getBubblePhysicsRadius,
  makeId,
  normalizeDepth,
} from "../core/geometry.js";
import {
  createDefaultTraceCircuit,
  createSlalomCircuitFromBubbles,
  getCircuitSpeedValue,
  smoothLoopPoint,
} from "../core/traceCircuit.js";
import { BREACH_GAP_SPAN, getFishNavigableRadius, MEMBRANE_LEVEL_MULTIPLIERS } from "../core/constants.js";
import { SOON_MODE_COMPO, normalizeSoonMode } from "../core/uiState.js";
import { buildMazeByArena, buildWorldDebugSnapshot, clampPointToMaze, generateLabybulle, getPortalArrivalPosition, validateWorldGraph } from "../core/labybulleWorld.js";

const saved = loadState();
const labybulleWorld = generateLabybulle(saved?.labybulleSeed ?? 1);
const worldErrors = validateWorldGraph(labybulleWorld);
const mazeByArena = buildMazeByArena(labybulleWorld);
if (worldErrors.length) {
  console.warn("[labybulle] invalid generated world", worldErrors);
}

const DEFAULT_ARENA_RADIUS = 1200;
const DEFAULT_FISH_NAV_RADIUS = getFishNavigableRadius(DEFAULT_ARENA_RADIUS);
const MAX_ARENA_LEVEL = 2;


const ARENA_OPENING_ANGLES = [-Math.PI / 2, 0, Math.PI];
const ARENA_OPENING_HALF_SPAN = 0.22;

function angleDistance(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function isNearOpening(angle, level) {
  const opening = ARENA_OPENING_ANGLES[Math.max(0, Math.min(MAX_ARENA_LEVEL, level))] ?? ARENA_OPENING_ANGLES[0];
  return Math.abs(angleDistance(angle, opening)) <= ARENA_OPENING_HALF_SPAN;
}

function getArenaIdForLevel(level = 0) {
  const normalized = Math.max(0, Math.min(MAX_ARENA_LEVEL, Number.isFinite(level) ? level : 0));
  if (normalized === 0) return "arena-1";
  if (normalized === 1) return "mega-1";
  return "giga-1";
}

function getArenaLevelFromId(arenaId = "") {
  if (arenaId === "giga-1") return 2;
  if (arenaId === "mega-1") return 1;
  return 0;
}

function getFishMovementRadius(arenaRadius) {
  return getRuntimeFishNavRadius(arenaRadius);
}

function getRuntimeFishNavRadius(arenaRadius) {
  if (Number.isFinite(arenaRadius) && arenaRadius > 0) {
    return getFishNavigableRadius(arenaRadius);
  }
  return DEFAULT_FISH_NAV_RADIUS;
}

function getMembraneRadiusForLevel(arenaRadius, arenaLevel = 0) {
  const base = getRuntimeFishNavRadius(arenaRadius);
  const level = Math.max(0, Math.min(MAX_ARENA_LEVEL, Number.isFinite(arenaLevel) ? arenaLevel : 0));
  const multiplier = MEMBRANE_LEVEL_MULTIPLIERS[level] ?? MEMBRANE_LEVEL_MULTIPLIERS[0];
  return base * multiplier;
}


function clampDepth(depth) {
  return normalizeDepth(depth);
}

function clampFishToArenaLabyrinth(point, mazeByArenaMap, arenaId) {
  const maze = mazeByArenaMap?.[arenaId];
  if (!maze) return point;
  return clampPointToMaze({ x: point.x, y: point.y, maze });
}

function clampToRing(point, minRadius, maxRadius) {
  const x = point?.x || 0;
  const y = point?.y || 0;
  const d = Math.hypot(x, y) || 0.0001;
  if (d > maxRadius) {
    const k = maxRadius / d;
    return { x: x * k, y: y * k };
  }
  if (d < minRadius) {
    const k = minRadius / d;
    return { x: x * k, y: y * k };
  }
  return { x, y };
}

export function pushBubblesFromFish(bubbles = [], fish = {}, fishDepth = 1) {
  const depth = clampDepth(fishDepth);
  const fishX = fish.x || 0;
  const fishY = fish.y || 0;
  const fishAngle = Number.isFinite(fish.angle) ? fish.angle : -Math.PI / 2;
  const head = {
    x: fishX + Math.cos(fishAngle) * 36,
    y: fishY + Math.sin(fishAngle) * 36,
    radius: 34,
  };
  const body = {
    x: fishX - Math.cos(fishAngle) * 10,
    y: fishY - Math.sin(fishAngle) * 10,
    radius: 40,
  };

  return bubbles.map((bubble) => {
    if (clampDepth(bubble.depth) !== depth) return bubble;
    const bubbleRadius = getBubblePhysicsRadius(bubble);
    const collideWith = [head, body];
    let pushX = 0;
    let pushY = 0;

    collideWith.forEach((zone) => {
      const dx = (bubble.x || 0) - zone.x;
      const dy = (bubble.y || 0) - zone.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const overlap = zone.radius + bubbleRadius - d;
      if (overlap <= 0) return;
      const push = overlap * 0.2;
      pushX += (dx / d) * push;
      pushY += (dy / d) * push;
    });

    if (pushX === 0 && pushY === 0) return bubble;

    const safe = clampToCircle(
      { x: (bubble.x || 0) + pushX, y: (bubble.y || 0) + pushY },
      DEFAULT_ARENA_RADIUS * 1.6
    );

    return { ...bubble, x: safe.x, y: safe.y };
  });
}

function separateBubblesByDepth(bubbles = []) {
  const next = bubbles.map((bubble) => ({ ...bubble }));
  for (let iteration = 0; iteration < 2; iteration += 1) {
    for (let i = 0; i < next.length; i += 1) {
      for (let j = i + 1; j < next.length; j += 1) {
        const a = next[i];
        const b = next[j];
        if (clampDepth(a.depth) !== clampDepth(b.depth)) continue;
        const dx = (b.x || 0) - (a.x || 0);
        const dy = (b.y || 0) - (a.y || 0);
        const d = Math.hypot(dx, dy) || 0.0001;
        const overlap = (a.r || 0) + (b.r || 0) + 6 - d;
        if (overlap <= 0) continue;
        const shift = overlap * 0.08;
        const safeA = clampToCircle({ x: a.x - (dx / d) * shift, y: a.y - (dy / d) * shift }, DEFAULT_ARENA_RADIUS * 1.6);
        const safeB = clampToCircle({ x: b.x + (dx / d) * shift, y: b.y + (dy / d) * shift }, DEFAULT_ARENA_RADIUS * 1.6);
        a.x = safeA.x; a.y = safeA.y; b.x = safeB.x; b.y = safeB.y;
      }
    }
  }
  return next;
}

const defaultFish = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  targetX: 0,
  targetY: -120,
  angle: -Math.PI / 2,
  swimPhase: 0,
  maxTrail: 90,
  maxSpeed: 3.1,
  depth: 1,
  mouthPull: 0,
  turnAmount: 0,
  turnVelocity: 0,
  arenaLevel: 0,
  wallHitCount: 0,
  lastWallHitAt: 0,
  breachOpen: false,
  breachAngle: null,
  breachOpenedAt: null,
  breachState: "closed",
  breachExpiresAt: null,
  breachUsed: false,
  hasQuill: false,
  membraneSide: "inside",
};

const initialState = {
  mode: normalizeSoonMode(saved?.mode, SOON_MODE_COMPO),
  bubbles: defaultPack.bubbles.map((bubble) => ({ ...bubble })),
  fish: {
    ...defaultFish,
    ...(saved?.fish || {}),
    arenaLevel: getArenaLevelFromId(saved?.currentArenaId || labybulleWorld.startArenaId),
  },
  fishTrail: saved?.fishTrail || [],
  selectedBubbleId: null,
  odysseoPath: [],
  odysseoDepthMarkers: [],
  odysseoPathIndex: 0,
  odysseoDirection: 1,
  odysseoTool: "draw",
  traceCircuit: saved?.traceCircuit || createSlalomCircuitFromBubbles(saved?.bubbles || defaultPack.bubbles),
  selectedBeaconId: null,
  circuitAutopilot: false,
  circuitSegmentIndex: 0,
  circuitSegmentT: 0,
  path: saved?.path || [],
  eyesClosed: false,
  labybulleSeed: saved?.labybulleSeed ?? 1,
  worldGraph: labybulleWorld,
  currentArenaId: saved?.currentArenaId || labybulleWorld.startArenaId,
  mazeByArena,
};

function lerpAngle(current, target, amount) {
  let diff = target - current;

  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  return current + diff * amount;
}

const FISH_CONTROL_TUNING = {
  autopilot: {
    mouthOffset: 32,
    maxSpeedFactor: 1.05,
    accel: 0.16,
    arrivalRadius: 180,
    stopRadius: 10,
  },
  // Réglages tactiles: steering "arrive" ultra intuitif (rapide loin, précis près du doigt).
  touch: {
    mouthOffset: 24,
    maxSpeedFactor: 1.2,
    accel: 0.22,
    arrivalRadius: 220,
    stopRadius: 8,
  },
};

export const useSoonStore = create((set, get) => ({
  ...initialState,

  setMode: (mode) => {
    set({
      mode,
      eyesClosed: false,
      selectedBubbleId: null,
  odysseoPath: [],
  odysseoDepthMarkers: [],
  odysseoPathIndex: 0,
  odysseoDirection: 1,
  odysseoTool: "draw",
      selectedBeaconId: null,
      circuitAutopilot: get().circuitAutopilot,
    });

    saveState(get());
  },



  regenerateWorld: (seed = 1) => {
    const nextWorld = generateLabybulle(seed);
    const errors = validateWorldGraph(nextWorld);
    if (errors.length) {
      console.warn("[labybulle] invalid regenerated world", errors);
    }

    set({
      labybulleSeed: seed,
      worldGraph: nextWorld,
      mazeByArena: buildMazeByArena(nextWorld),
      currentArenaId: nextWorld.startArenaId,
      fish: { ...get().fish, x: 0, y: 0, targetX: 0, targetY: -120, arenaLevel: getArenaLevelFromId(nextWorld.startArenaId) },
    });
    saveState(get());
  },

  travelToArena: ({ nextArenaId, fromArenaId, arenaRadius = DEFAULT_ARENA_RADIUS, entryPositionHint = null } = {}) => {
    set((state) => {
      const world = state.worldGraph;
      if (!world?.nodes?.some((node) => node.id === nextArenaId)) return {};

      const arrival = getPortalArrivalPosition({
        world,
        fromArenaId: fromArenaId || state.currentArenaId,
        toArenaId: nextArenaId,
        radius: arenaRadius,
        entryPositionHint,
      });

      return {
        currentArenaId: nextArenaId,
        fish: {
          ...state.fish,
          targetX: arrival.x,
          targetY: arrival.y,
          vx: state.fish.vx * 0.2,
          vy: state.fish.vy * 0.2,
          arenaLevel: getArenaLevelFromId(nextArenaId),
        },
      };
    });
    saveState(get());
  },

  getWorldDebugSnapshot: () => buildWorldDebugSnapshot(get().worldGraph),
  toggleEyesClosed: () => {
    set((state) => ({ eyesClosed: !state.eyesClosed }));
    saveState(get());
  },

  toggleMembraneSide: () => {
    set((state) => {
      const membraneSide = state.fish?.membraneSide === "outside" ? "outside" : "inside";
      const nextMembraneSide = membraneSide === "inside" ? "outside" : "inside";
      const arenaLevel = Number.isFinite(state.fish?.arenaLevel) ? state.fish.arenaLevel : 0;
      const nextArenaLevel = nextMembraneSide === "outside"
        ? Math.min(2, arenaLevel + 1)
        : Math.max(0, arenaLevel - 1);

      return {
        currentArenaId: getArenaIdForLevel(nextArenaLevel),
        fish: {
          ...state.fish,
          membraneSide: nextMembraneSide,
          arenaLevel: nextArenaLevel,
          wallHitCount: 0,
          breachOpen: false,
          breachState: "closed",
          breachAngle: null,
          breachOpenedAt: null,
          breachExpiresAt: null,
          vx: 0,
          vy: 0,
        },
      };
    });
    saveState(get());
  },

  startFishTrailAt: (x, y) => {
    set(() => ({
      fishTrail: startFishTrailAt(x, y),
    }));
  },

  addFishTrailPoint: (x, y) => {
    set((state) => ({
      fishTrail: addFishTrailPoint(state.fishTrail || [], x, y),
    }));
  },

  setOdysseoTool: (tool) => {
    set({ odysseoTool: tool });
  },

  addOdysseoPathPoint: (x, y) => {
    set((state) => ({
      odysseoPath: addOdysseoPathPoint(state.odysseoPath || [], x, y),
    }));
  },

  clearOdysseoPath: () => {
    set({
      odysseoPath: clearOdysseoPath(),
      odysseoDepthMarkers: [],
      odysseoPathIndex: 0,
      odysseoDirection: 1,
    });
  },

  addOdysseoDepthMarker: (x, y, depth = 1) => {
    set((state) => ({
      odysseoDepthMarkers: addDepthMarker(
        state.odysseoDepthMarkers || [],
        state.odysseoPath || [],
        x,
        y,
        depth
      ),
    }));
  },

  tickOdysseoPath: ({ swimSpeed = 1 } = {}) => {
    set((state) => {
      const result = stepOdysseoTraversal({
        path: state.odysseoPath || [],
        index: state.odysseoPathIndex || 0,
        direction: state.odysseoDirection || 1,
        speed: Math.max(0, swimSpeed * 0.22),
      });

      if (!result.point) return state;

      const depth = getDepthAtPathIndex(
        state.odysseoDepthMarkers || [],
        Math.round(result.index)
      );

      return {
        odysseoPathIndex: result.index,
        odysseoDirection: result.direction,
        circuitAutopilot: false,
        fish: {
          ...state.fish,
          x: result.point.x,
          y: result.point.y,
          targetX: result.point.x,
          targetY: result.point.y,
          depth,
          angle: result.angle,
          vx: Math.cos(result.angle) * swimSpeed,
          vy: Math.sin(result.angle) * swimSpeed,
        },
      };
    });
  },

  setFishTarget: (x, y, arenaRadius = DEFAULT_ARENA_RADIUS) => {
    const state = get();

    if (state.circuitAutopilot) return;

    const navRadius = getFishMovementRadius(arenaRadius);
    const fishDistance = Math.hypot(state.fish?.x || 0, state.fish?.y || 0);
    const side = state.fish?.membraneSide === "outside" || fishDistance > navRadius + 24
      ? "outside"
      : "inside";
    // Evite le bug "bloqué sur la ligne puis demi-tour":
    // - inside: on garde une target possible au-delà de la membrane pour pousser la brèche.
    // - outside: on interdit les targets trop proches de la membrane intérieure pour éviter
    //   que le steering se retourne contre la ligne.
    const safe = side === "outside"
      ? { x, y }
      : clampToCircle({ x, y }, Math.max(navRadius, arenaRadius * 1.9));

    set((state) => {
      return {
        fish: {
          ...state.fish,
          targetX: safe.x,
          targetY: safe.y,
        },
      };
    });
  },
  recenterFish: () => {
    set((state) => {
      const fish = state.fish || {};
      const dx = 0 - (fish.x || 0);
      const dy = 0 - (fish.y || 0);
      const distance = Math.hypot(dx, dy) || 1;
      const slowFactor = Math.min(1, distance / 280) * 0.85;

      return {
        circuitAutopilot: false,
        fish: {
          ...fish,
          targetX: 0,
          targetY: 0,
          vx: (dx / distance) * slowFactor,
          vy: (dy / distance) * slowFactor,
        },
        circuitSegmentIndex: 0,
        circuitSegmentT: 0,
      };
    });
  },


  setFishDepth: (depth) => {
    set((state) => {
      if (state.circuitAutopilot) return state;
      return {
        fish: {
          ...state.fish,
          depth: clampDepth(depth),
        },
      };
    });
    saveState(get());
  },

  tickFish: ({ swimSpeed = 1, arenaRadius = DEFAULT_ARENA_RADIUS } = {}) => {
    set((state) => {
      const fish = state.fish;
      let fishNavRadius = getFishMovementRadius(arenaRadius);

      if (state.fishTrail?.length) {
        const result = updateSnakeFishToTarget({
          fish: {
            ...state.fish,
            spine:
              state.fish.spine ||
              createInitialSpine(state.fish.x || 0, state.fish.y || 0),
          },
          trail: state.fishTrail,
          arenaRadius: fishNavRadius,
          swimSpeed,
        });

        const pushedBubbles = separateBubblesByDepth(
          pushBubblesFromFish(state.bubbles, result.fish, result.fish.depth),
        );

        return {
          fish: result.fish,
          fishTrail: result.trail,
          bubbles: pushedBubbles,
        };
      }
      let targetX = state.fish.targetX;
      let targetY = state.fish.targetY;
      let fishDepth = clampDepth(state.fish.depth || 1);
      let circuitSegmentIndex = state.circuitSegmentIndex || 0;
      let circuitSegmentT = state.circuitSegmentT || 0;
      const circuitAutopilot = Boolean(state.circuitAutopilot);

      if (circuitAutopilot && state.traceCircuit?.length > 1) {
        const currentBeacon =
          state.traceCircuit[circuitSegmentIndex % state.traceCircuit.length];

        const speedStep = getCircuitSpeedValue(currentBeacon?.speed || 2) * Math.max(0, swimSpeed);

        circuitSegmentT += speedStep;

        while (circuitSegmentT >= 1) {
          circuitSegmentT -= 1;
          circuitSegmentIndex =
            (circuitSegmentIndex + 1) % state.traceCircuit.length;
        }

        const circuitPoint = smoothLoopPoint(
          state.traceCircuit,
          circuitSegmentIndex,
          circuitSegmentT
        );

        targetX = circuitPoint.x;
        targetY = circuitPoint.y;
        fishDepth = clampDepth(circuitPoint.depth || fishDepth);
      }

      const currentAngle = Number.isFinite(state.fish.angle)
        ? state.fish.angle
        : -Math.PI / 2;

      const control = circuitAutopilot
        ? FISH_CONTROL_TUNING.autopilot
        : FISH_CONTROL_TUNING.touch;
      const {
        mouthOffset,
        maxSpeedFactor,
        accel,
        arrivalRadius,
        stopRadius,
      } = control;

      const isAutoPassageActive = false;

      // Point de bouche : le doigt tire le poisson par l'avant.
      const mouthX = state.fish.x + Math.cos(currentAngle) * mouthOffset;
      const mouthY = state.fish.y + Math.sin(currentAngle) * mouthOffset;

      const pullX = targetX - mouthX;
      const pullY = targetY - mouthY;
      const pullDistance = Math.hypot(pullX, pullY);

      const pullNorm = Math.min(1, pullDistance / Math.max(1, arrivalRadius));
      const baseMaxSpeed = state.fish.maxSpeed || 3.1;
      const speedLimit = baseMaxSpeed * maxSpeedFactor * Math.max(0, swimSpeed);

      // Steering "arrive":
      // - loin: vitesse cible max
      // - proche: ralentit progressivement
      // - très proche: arrêt stable (anti-jitter)
      const desiredSpeed = isAutoPassageActive
        ? Math.max(speedLimit * 0.72, Math.min(speedLimit, speedLimit * Math.max(0.75, pullNorm)))
        : pullDistance <= stopRadius
          ? 0
          : Math.min(speedLimit, speedLimit * pullNorm);

      const dirX = pullDistance > 0.0001 ? pullX / pullDistance : 0;
      const dirY = pullDistance > 0.0001 ? pullY / pullDistance : 0;
      const desiredVx = dirX * desiredSpeed;
      const desiredVy = dirY * desiredSpeed;

      const steerAccel = isAutoPassageActive ? Math.max(accel, 0.28) : accel;
      const vx = state.fish.vx + (desiredVx - state.fish.vx) * steerAccel;
      const vy = state.fish.vy + (desiredVy - state.fish.vy) * steerAccel;

      const speedRaw = Math.hypot(vx, vy);
      const limitedVx = speedRaw > speedLimit ? (vx / speedRaw) * speedLimit : vx;
      const limitedVy = speedRaw > speedLimit ? (vy / speedRaw) * speedLimit : vy;

      const currentArenaLevel = Number.isFinite(state.fish?.arenaLevel) ? state.fish.arenaLevel : 0;
      fishNavRadius = getMembraneRadiusForLevel(arenaRadius, currentArenaLevel);

      const now = performance.now();
      const nextX = state.fish.x + limitedVx;
      const nextY = state.fish.y + limitedVy;
      const nextDistance = Math.hypot(nextX, nextY);
      const circularSafe = clampToCircle({ x: nextX, y: nextY }, fishNavRadius);
      let safe = clampFishToArenaLabyrinth(circularSafe, state.mazeByArena, state.currentArenaId);
      const hitWall = nextDistance > fishNavRadius + 0.0001;
      const nearWall = nextDistance >= fishNavRadius - 90;
      const hitDelayPassed = now - (state.fish.lastWallHitAt || 0) > 450;

      let wallHitCount = state.fish.wallHitCount || 0;
      let lastWallHitAt = state.fish.lastWallHitAt || 0;
      const breachOpen = false;
      const breachAngle = null;
      const breachOpenedAt = null;
      const breachState = "closed";
      const breachExpiresAt = null;
      const arenaLevel = Math.max(0, Math.min(MAX_ARENA_LEVEL, Number.isFinite(state.fish.arenaLevel) ? state.fish.arenaLevel : 0));
      const nextMembraneSide = "inside";
      const currentArenaId = getArenaIdForLevel(arenaLevel);
      let nextFishX = safe.x;
      let nextFishY = safe.y;
      const nextTargetX = targetX;
      const nextTargetY = targetY;
      let nextVx = limitedVx;
      let nextVy = limitedVy;
      const hasQuill = Boolean(state.fish.hasQuill);

      if ((hitWall || nearWall) && hitDelayPassed) {
        wallHitCount = Math.min(3, wallHitCount + 1);
        lastWallHitAt = now;
      }


      const radialDistance = Math.hypot(nextFishX, nextFishY);
      const radialAngle = Math.atan2(nextFishY, nextFishX);
      const radialX = Math.cos(radialAngle);
      const radialY = Math.sin(radialAngle);
      const speedForDot = Math.hypot(nextVx, nextVy) || 0.0001;
      const radialDot = ((radialX * nextVx) + (radialY * nextVy)) / speedForDot;
      const nearMembrane = Math.abs(radialDistance - fishNavRadius) <= 48;
      const nearOpening = isNearOpening(radialAngle, arenaLevel);

      // Contour hermétique: hors ouverture, on interdit strictement la traversée radiale.
      if (nearMembrane && !nearOpening) {
        const tangentX = -radialY;
        const tangentY = radialX;
        const tangentialSpeed = (nextVx * tangentX) + (nextVy * tangentY);
        nextVx = tangentX * tangentialSpeed;
        nextVy = tangentY * tangentialSpeed;

        const lockRadius = fishNavRadius - 4;
        const clamped = clampToCircle({ x: nextFishX, y: nextFishY }, lockRadius);
        nextFishX = clamped.x;
        nextFishY = clamped.y;
      }

      if (nearMembrane && nearOpening) {
        if (radialDot > 0.22 && arenaLevel < MAX_ARENA_LEVEL) {
          const nextLevel = arenaLevel + 1;
          nextFishX += radialX * 16;
          nextFishY += radialY * 16;
          const destinationNavRadius = getMembraneRadiusForLevel(arenaRadius, nextLevel);
          const destinationCircularSafe = clampToCircle({ x: nextFishX, y: nextFishY }, destinationNavRadius - 4);
          const destinationSafe = clampFishToArenaLabyrinth(destinationCircularSafe, state.mazeByArena, getArenaIdForLevel(nextLevel));
          nextFishX = destinationSafe.x;
          nextFishY = destinationSafe.y;
          return {
            circuitAutopilot,
            circuitSegmentIndex,
            circuitSegmentT,
            bubbles: separateBubblesByDepth(pushBubblesFromFish(state.bubbles, safe, fishDepth)),
            currentArenaId: getArenaIdForLevel(nextLevel),
            fish: {
              ...state.fish,
              x: nextFishX,
              y: nextFishY,
              vx: nextVx,
              vy: nextVy,
              targetX,
              targetY,
              arenaRadius,
              arenaLevel: nextLevel,
              membraneSide: "inside",
              wallHitCount,
              lastWallHitAt,
              breachOpen: false,
              breachAngle: null,
              breachOpenedAt: null,
              breachState: "closed",
              breachExpiresAt: null,
              breachUsed: false,
              hasQuill,
            },
          };
        }
        if (radialDot < -0.22 && arenaLevel > 0) {
          const nextLevel = arenaLevel - 1;
          nextFishX -= radialX * 16;
          nextFishY -= radialY * 16;
          const destinationNavRadius = getMembraneRadiusForLevel(arenaRadius, nextLevel);
          const destinationCircularSafe = clampToCircle({ x: nextFishX, y: nextFishY }, destinationNavRadius - 4);
          const destinationSafe = clampFishToArenaLabyrinth(destinationCircularSafe, state.mazeByArena, getArenaIdForLevel(nextLevel));
          nextFishX = destinationSafe.x;
          nextFishY = destinationSafe.y;
          return {
            circuitAutopilot,
            circuitSegmentIndex,
            circuitSegmentT,
            bubbles: separateBubblesByDepth(pushBubblesFromFish(state.bubbles, safe, fishDepth)),
            currentArenaId: getArenaIdForLevel(nextLevel),
            fish: {
              ...state.fish,
              x: nextFishX,
              y: nextFishY,
              vx: nextVx,
              vy: nextVy,
              targetX,
              targetY,
              arenaRadius,
              arenaLevel: nextLevel,
              membraneSide: "inside",
              wallHitCount,
              lastWallHitAt,
              breachOpen: false,
              breachAngle: null,
              breachOpenedAt: null,
              breachState: "closed",
              breachExpiresAt: null,
              breachUsed: false,
              hasQuill,
            },
          };
        }
      }

      const speed = Math.hypot(limitedVx, limitedVy);

      // Orientation : le poisson suit la courbe du mouvement.
      const moveAngle = speed > 0.035 ? Math.atan2(limitedVy, limitedVx) : currentAngle;

      let angleDiff = moveAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const turnStrengthSigned = Math.max(-1, Math.min(1, angleDiff / 1.15));

      const angle =
        speed > 0.035
          ? lerpAngle(
              currentAngle,
              moveAngle,
              0.055 + Math.min(0.055, speed * 0.006)
            )
          : currentAngle;

      const mouthPull = state.fish.mouthPull || 0;
      const nextMouthPull = mouthPull + (pullNorm - mouthPull) * 0.12;

      const turnAmount = state.fish.turnAmount || 0;
      const turnVelocity = state.fish.turnVelocity || 0;
      const targetTurnVelocity = turnStrengthSigned * (0.55 + Math.min(0.45, speed * 0.08));
      const nextTurnVelocity = turnVelocity + (targetTurnVelocity - turnVelocity) * 0.18;
      const nextTurnAmount = turnAmount + (nextTurnVelocity - turnAmount) * 0.16;

      const swimPhase =
        (state.fish.swimPhase || 0) +
        0.045 +
        Math.min(0.16, speed * 0.011) +
        nextTurnAmount * 0.025;

      const pushedBubbles = separateBubblesByDepth(
        pushBubblesFromFish(state.bubbles, safe, fishDepth)
      );

      return {
        circuitAutopilot,
        circuitSegmentIndex,
        circuitSegmentT,
        bubbles: pushedBubbles,
        currentArenaId,
        fish: {
          ...state.fish,
          x: nextFishX,
          y: nextFishY,
          vx: nextVx,
          vy: nextVy,
          targetX: nextTargetX,
          targetY: nextTargetY,
          angle,
          swimPhase,
          depth: clampDepth(fishDepth),
          mouthPull: nextMouthPull,
          turnAmount: nextTurnAmount,
          turnVelocity: nextTurnVelocity,
          maxSpeed: state.fish.maxSpeed || 3.1,
          arenaRadius,
          arenaLevel,
          wallHitCount,
          lastWallHitAt,
          breachOpen,
          breachAngle,
          breachOpenedAt,
          breachState,
          breachExpiresAt,
          breachUsed: false,
          hasQuill,
          membraneSide: nextMembraneSide,
        },
      };
    });
  },

  selectBubble: (id) => {
    set({
      selectedBubbleId: id,
      selectedBeaconId: null,
    });
  },

  selectBeacon: (id) => {
    set({
      selectedBeaconId: id,
      selectedBubbleId: null,
    });
  },

  moveBeacon: (id, x, y) => {
    const safe = clampToCircle({ x, y }, DEFAULT_ARENA_RADIUS * 1.55);

    set((state) => ({
      traceCircuit: state.traceCircuit.map((beacon) =>
        beacon.id === id
          ? {
              ...beacon,
              x: safe.x,
              y: safe.y,
            }
          : beacon
      ),
    }));

    saveState(get());
  },

  updateBeacon: (id, patch) => {
    set((state) => ({
      traceCircuit: state.traceCircuit.map((beacon) =>
        beacon.id === id ? { ...beacon, ...patch } : beacon
      ),
    }));

    saveState(get());
  },

  autoGenerateTraceCircuit: () => {
    set((state) => ({
      traceCircuit: createSlalomCircuitFromBubbles(state.bubbles),
      selectedBeaconId: null,
      circuitAutopilot: false,
      circuitSegmentIndex: 0,
      circuitSegmentT: 0,
    }));

    saveState(get());
  },

  resetTraceCircuit: () => {
    set((state) => ({
      traceCircuit: createSlalomCircuitFromBubbles(state.bubbles),
      selectedBeaconId: null,
      circuitAutopilot: false,
      circuitSegmentIndex: 0,
      circuitSegmentT: 0,
    }));

    saveState(get());
  },

  startCircuitAutopilot: () => {
    const state = get();

    if (!state.traceCircuit || state.traceCircuit.length < 2) return;

    const first = state.traceCircuit[0];

    set((state) => ({
      circuitAutopilot: true,
      circuitSegmentIndex: 0,
      circuitSegmentT: 0,
      selectedBubbleId: null,
      fish: {
        ...state.fish,
        targetX: first.x,
        targetY: first.y,
        depth: clampDepth(first.depth || 1),
      },
    }));
  },

  stopCircuitAutopilot: () => {
    set({
      circuitAutopilot: false,
    });
  },

  addBubble: (x, y) => {
    const safe = clampToCircle({ x, y }, DEFAULT_ARENA_RADIUS * 1.6);

    const bubble = {
      id: makeId("bubble"),
      label: "Nouvelle bulle",
      x: safe.x,
      y: safe.y,
      r: 72,
      hue: Math.floor(160 + Math.random() * 160),
      depth: clampDepth(get().fish?.depth || 1),
      sampleId: "tone-water",
    };

    set((state) => ({
      bubbles: [...state.bubbles, bubble],
      selectedBubbleId: bubble.id,
      selectedBeaconId: null,
    }));

    saveState(get());
  },

  updateBubble: (id, patch) => {
    set((state) => ({
      bubbles: state.bubbles.map((bubble) => {
        if (bubble.id !== id) return bubble;

        const next = { ...bubble, ...patch };
        if ("depth" in patch) {
          next.depth = clampDepth(patch.depth);
        }

        if ("x" in patch || "y" in patch) {
          const safe = clampToCircle(
            {
              x: next.x,
              y: next.y,
            },
            DEFAULT_ARENA_RADIUS * 1.6
          );

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
      selectedBubbleId:
        state.selectedBubbleId === id ? null : state.selectedBubbleId,
    }));

    saveState(get());
  },

  addPathPoint: () => {},

  clearPath: () => {
    set({ path: [] });
    saveState(get());
  },

  importSoonData: (data) => {
    if (!data || !Array.isArray(data.bubbles)) return;

    set((state) => ({
      mode: normalizeSoonMode(data.mode, SOON_MODE_COMPO),
      bubbles: data.bubbles,
      fish: {
        ...state.fish,
        ...(data.fish || {}),
        vx: 0,
        vy: 0,
        maxSpeed: state.fish.maxSpeed || 3.1,
      },
      traceCircuit: Array.isArray(data.traceCircuit)
        ? data.traceCircuit
        : state.traceCircuit,
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
      bubbles: defaultPack.bubbles,
      fish: { ...defaultFish },
      selectedBubbleId: null,
  odysseoPath: [],
  odysseoDepthMarkers: [],
  odysseoPathIndex: 0,
  odysseoDirection: 1,
  odysseoTool: "draw",
      traceCircuit: createDefaultTraceCircuit(),
      selectedBeaconId: null,
      circuitAutopilot: false,
      circuitSegmentIndex: 0,
      circuitSegmentT: 0,
      path: [],
      eyesClosed: false,
    });
  },
}));
