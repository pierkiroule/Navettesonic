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
import { getFishNavigableRadius } from "../core/constants.js";
import { buildMazeByArena, buildWorldDebugSnapshot, generateLabybulle, getPortalArrivalPosition, validateWorldGraph } from "../core/labybulleWorld.js";

const saved = loadState();
const labybulleWorld = generateLabybulle(saved?.labybulleSeed ?? 1);
const worldErrors = validateWorldGraph(labybulleWorld);
const mazeByArena = buildMazeByArena(labybulleWorld);
if (worldErrors.length) {
  console.warn("[labybulle] invalid generated world", worldErrors);
}

const DEFAULT_ARENA_RADIUS = 1200;
const DEFAULT_FISH_NAV_RADIUS = getFishNavigableRadius(DEFAULT_ARENA_RADIUS);


function getFishMovementRadius(arenaRadius) {
  return getRuntimeFishNavRadius(arenaRadius);
}

function getRuntimeFishNavRadius(arenaRadius) {
  if (Number.isFinite(arenaRadius) && arenaRadius > 0) {
    return getFishNavigableRadius(arenaRadius);
  }
  return DEFAULT_FISH_NAV_RADIUS;
}


function clampDepth(depth) {
  return normalizeDepth(depth);
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
  hasQuill: false,
};

const initialState = {
  mode: ["intro", "compo", "reso"].includes(saved?.mode) ? saved.mode : "compo",
  bubbles: defaultPack.bubbles.map((bubble) => ({ ...bubble })),
  fish: {
    ...defaultFish,
    ...(saved?.fish || {}),
  },
  fishTrail: saved?.fishTrail || [],
  selectedBubbleId: null,
  odysseoPath: [],
  odysseoDepthMarkers: [],
  odysseoPathIndex: 0,
  odysseoDirection: 1,
  odysseoTool: "draw",
  fishTrail: [],
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
      fish: { ...get().fish, x: 0, y: 0, targetX: 0, targetY: -120 },
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
          x: arrival.x,
          y: arrival.y,
          targetX: arrival.x,
          targetY: arrival.y,
          vx: 0,
          vy: 0,
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

    const safeCircle = clampToCircle({ x, y }, getFishMovementRadius(arenaRadius));
    const safe = safeCircle;

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

      fishNavRadius = getFishMovementRadius(arenaRadius);

      const now = performance.now();
      const nextX = state.fish.x + limitedVx;
      const nextY = state.fish.y + limitedVy;
      const nextDistance = Math.hypot(nextX, nextY);
      let safe = clampToCircle({ x: nextX, y: nextY }, fishNavRadius);
      const hitWall = nextDistance > fishNavRadius + 0.0001;
      const hitDelayPassed = now - (state.fish.lastWallHitAt || 0) > 450;

      let wallHitCount = state.fish.wallHitCount || 0;
      let lastWallHitAt = state.fish.lastWallHitAt || 0;
      let breachOpen = Boolean(state.fish.breachOpen);
      let breachAngle = Number.isFinite(state.fish.breachAngle) ? state.fish.breachAngle : null;
      let breachOpenedAt = state.fish.breachOpenedAt ?? null;
      let arenaLevel = Number.isFinite(state.fish.arenaLevel) ? state.fish.arenaLevel : 0;
      let currentArenaId = state.currentArenaId;
      let nextFishX = safe.x;
      let nextFishY = safe.y;
      let nextTargetX = targetX;
      let nextTargetY = targetY;
      let nextVx = limitedVx;
      let nextVy = limitedVy;
      let hasQuill = Boolean(state.fish.hasQuill);
      const mouthNextX = nextX + Math.cos(currentAngle) * mouthOffset;
      const mouthNextY = nextY + Math.sin(currentAngle) * mouthOffset;
      const quillPickupX = 140;
      const quillPickupY = -60;
      if (!hasQuill && Math.hypot(mouthNextX - quillPickupX, mouthNextY - quillPickupY) < 54) {
        hasQuill = true;
      }

      if (hitWall && hitDelayPassed) {
        wallHitCount += 1;
        lastWallHitAt = now;
        breachAngle = Math.atan2(nextY, nextX);
        if (wallHitCount >= 3 && arenaLevel < 2) {
          breachOpen = true;
          breachOpenedAt = now;
        }
        if (hasQuill && arenaLevel <= 2) {
          breachOpen = true;
          breachOpenedAt = now;
        }
      }

      const nextAngleRaw = Math.atan2(nextY, nextX);
      const openCorridor =
        breachOpen &&
        breachAngle !== null &&
        Math.abs(Math.atan2(Math.sin(nextAngleRaw - breachAngle), Math.cos(nextAngleRaw - breachAngle))) <= 0.4;

      // Alternative au clamp strict: quand la brèche est ouverte, on autorise un couloir
      // traversant localement la membrane pour rendre le percement fiable.
      if (openCorridor) {
        safe = { x: nextX, y: nextY };
        nextFishX = safe.x;
        nextFishY = safe.y;
      }

      if (breachOpen && breachAngle !== null) {
        const fishAngle = Math.atan2(nextFishY, nextFishX);
        const delta = Math.atan2(
          Math.sin(fishAngle - breachAngle),
          Math.cos(fishAngle - breachAngle)
        );
        const radiusNow = Math.hypot(nextFishX, nextFishY);
        const nearMembrane = radiusNow >= fishNavRadius - 42;
        const radialX = Math.cos(breachAngle);
        const radialY = Math.sin(breachAngle);
        const speedForDot = Math.hypot(nextVx, nextVy) || 0.0001;
        const velocityDot = ((radialX * nextVx) + (radialY * nextVy)) / speedForDot;
        const pushingTowardBreach = velocityDot > 0.22;

        const pushingInward = velocityDot < -0.22;
        if (Math.abs(delta) <= 0.4 && radiusNow >= fishNavRadius + 18 && pushingTowardBreach && arenaLevel < 2) {
          arenaLevel += 1;
          currentArenaId = `arene_${String(arenaLevel).padStart(4, "0")}`;
          nextFishX = 0;
          nextFishY = 0;
          nextTargetX = 0;
          nextTargetY = -120;
          nextVx = 0;
          nextVy = 0;
          wallHitCount = 0;
          breachOpen = false;
          breachAngle = null;
          breachOpenedAt = null;
          lastWallHitAt = now;
        }
        if (Math.abs(delta) <= 0.4 && nearMembrane && pushingInward && arenaLevel > 0) {
          arenaLevel -= 1;
          currentArenaId = `arene_${String(arenaLevel).padStart(4, "0")}`;
          nextFishX = 0;
          nextFishY = 0;
          nextTargetX = 0;
          nextTargetY = -120;
          nextVx = 0;
          nextVy = 0;
          lastWallHitAt = now;
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
          arenaLevel,
          wallHitCount,
          lastWallHitAt,
          breachOpen,
          breachAngle,
          breachOpenedAt,
          hasQuill,
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
      mode: data.mode || "compo",
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
      mode: "compo",
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
