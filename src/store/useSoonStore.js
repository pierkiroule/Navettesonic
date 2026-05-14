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

const saved = loadState();

const DEFAULT_ARENA_RADIUS = 1200;
const DEFAULT_FISH_NAV_RADIUS = getFishNavigableRadius(DEFAULT_ARENA_RADIUS);

const PASSAGE_HALF_ARC = 0.12;

const PASSAGE_ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
const OUTER_SWIM_OFFSET = 44;

function normalizeAngle(angle) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}


function shortestAngleDelta(from, to) {
  return normalizeAngle(to - from);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function getPassagePoint(index, radius) {
  const angle = PASSAGE_ANGLES[((index % PASSAGE_ANGLES.length) + PASSAGE_ANGLES.length) % PASSAGE_ANGLES.length];
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle };
}

function getNearestPassageIndex(angle) {
  let bestIndex = 0;
  let bestAbs = Infinity;
  PASSAGE_ANGLES.forEach((pole, index) => {
    const delta = Math.abs(normalizeAngle(angle - pole));
    if (delta < bestAbs) {
      bestAbs = delta;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function isNearPassage(angle) {
  return PASSAGE_ANGLES.some((pole) => {
    let delta = angle - pole;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return Math.abs(delta) <= PASSAGE_HALF_ARC;
  });
}

function getFishMovementRadius(targetX, targetY, arenaRadius) {
  const navRadius = getRuntimeFishNavRadius(arenaRadius);
  const targetRadius = Math.hypot(targetX || 0, targetY || 0);
  if (targetRadius <= navRadius) return navRadius;

  const targetAngle = Math.atan2(targetY || 0, targetX || 0);
  if (!isNearPassage(targetAngle)) return navRadius;

  return Math.max(navRadius, arenaRadius + 64);
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

    if (state.circuitAutopilot || state.fish?.autoPassage) return;

    const movementRadius = getFishMovementRadius(x, y, arenaRadius);
    const safe = clampToCircle({ x, y }, movementRadius);

    set((state) => ({
      fish: {
        ...state.fish,
        targetX: safe.x,
        targetY: safe.y,
      },
    }));
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
      let fishNavRadius = getFishMovementRadius(
        state.fish.targetX,
        state.fish.targetY,
        arenaRadius
      );
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

      const navRadius = getRuntimeFishNavRadius(arenaRadius);
      const fishRadiusNow = Math.hypot(state.fish.x || 0, state.fish.y || 0);
      let autoPassage = state.fish.autoPassage || null;

      const targetRadiusNow = Math.hypot(targetX || 0, targetY || 0);
      const targetOutsideThroughPassage =
        targetRadiusNow > navRadius + 1 && isNearPassage(Math.atan2(targetY || 0, targetX || 0));
      const fishAtMembrane = fishRadiusNow >= navRadius - 18;

      if (!circuitAutopilot && !autoPassage && (fishRadiusNow > navRadius + 2 || (targetOutsideThroughPassage && fishAtMembrane))) {
        const sourceAngle = targetOutsideThroughPassage
          ? Math.atan2(targetY || 0, targetX || 0)
          : Math.atan2(state.fish.y || 0, state.fish.x || 0);
        const exitIndex = getNearestPassageIndex(sourceAngle);
        autoPassage = {
          phase: "exit",
          exitIndex,
          nextIndex: (exitIndex + 1) % PASSAGE_ANGLES.length,
          orbitAngle: PASSAGE_ANGLES[exitIndex],
        };
      }

      if (autoPassage) {
        const externalRadius = arenaRadius + OUTER_SWIM_OFFSET;
        const internalRadius = navRadius;
        const dt = Math.max(0.008, Math.min(0.04, swimSpeed * 0.012));

        if (autoPassage.phase === "exit") {
          const from = getPassagePoint(autoPassage.exitIndex, internalRadius);
          const to = getPassagePoint(autoPassage.exitIndex, externalRadius);
          const t = Math.min(1, (autoPassage.progress || 0) + dt * 1.4);
          const nx = lerp(from.x, to.x, t);
          const ny = lerp(from.y, to.y, t);
          const heading = getPassagePoint(autoPassage.exitIndex, externalRadius).angle;
          const nextAuto = t >= 1 ? { ...autoPassage, phase: "orbit", progress: 0, orbitAngle: heading } : { ...autoPassage, progress: t };

          return {
            circuitAutopilot,
            circuitSegmentIndex,
            circuitSegmentT,
            fish: { ...state.fish, x: nx, y: ny, targetX: nx, targetY: ny, vx: 0, vy: 0, angle: heading, autoPassage: nextAuto },
          };
        }

        if (autoPassage.phase === "orbit") {
          const nextPassage = getPassagePoint(autoPassage.nextIndex, externalRadius);
          const currentAngle = Number.isFinite(autoPassage.orbitAngle) ? autoPassage.orbitAngle : Math.atan2(state.fish.y || 0, state.fish.x || 0);
          const delta = shortestAngleDelta(currentAngle, nextPassage.angle);
          const normalizedDelta = delta < 0 ? delta + Math.PI * 2 : delta;
          const step = Math.min(normalizedDelta, dt);
          const orbitAngle = normalizeAngle(currentAngle + step);
          const nx = Math.cos(orbitAngle) * externalRadius;
          const ny = Math.sin(orbitAngle) * externalRadius;
          const nextAuto = normalizedDelta <= dt + 0.001
            ? { ...autoPassage, phase: "reenter", progress: 0, orbitAngle }
            : { ...autoPassage, orbitAngle };

          return {
            circuitAutopilot,
            circuitSegmentIndex,
            circuitSegmentT,
            fish: { ...state.fish, x: nx, y: ny, targetX: nx, targetY: ny, vx: 0, vy: 0, angle: orbitAngle + Math.PI * 0.5, autoPassage: nextAuto },
          };
        }

        const from = getPassagePoint(autoPassage.nextIndex, externalRadius);
        const to = getPassagePoint(autoPassage.nextIndex, internalRadius);
        const t = Math.min(1, (autoPassage.progress || 0) + dt * 1.5);
        const nx = lerp(from.x, to.x, t);
        const ny = lerp(from.y, to.y, t);
        const nextAuto = t >= 1 ? null : { ...autoPassage, progress: t };

        return {
          circuitAutopilot,
          circuitSegmentIndex,
          circuitSegmentT,
          fish: { ...state.fish, x: nx, y: ny, targetX: to.x, targetY: to.y, vx: 0, vy: 0, angle: from.angle, autoPassage: nextAuto },
        };
      }

      if (circuitAutopilot && state.traceCircuit?.length > 1) {
        const currentBeacon =
          state.traceCircuit[circuitSegmentIndex % state.traceCircuit.length];

        const speedStep = getCircuitSpeedValue(currentBeacon?.speed || 2);

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

      const isAutoPassageActive = Boolean(autoPassage);

      // Point de bouche : le doigt tire le poisson par l'avant.
      const mouthX = state.fish.x + Math.cos(currentAngle) * mouthOffset;
      const mouthY = state.fish.y + Math.sin(currentAngle) * mouthOffset;

      const pullX = targetX - mouthX;
      const pullY = targetY - mouthY;
      const pullDistance = Math.hypot(pullX, pullY);

      const pullNorm = Math.min(1, pullDistance / Math.max(1, arrivalRadius));
      const baseMaxSpeed = state.fish.maxSpeed || 3.1;
      const speedLimit = baseMaxSpeed * maxSpeedFactor;

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

      fishNavRadius = getFishMovementRadius(targetX, targetY, arenaRadius);
      if (autoPassage) {
        fishNavRadius = Math.max(fishNavRadius, arenaRadius + OUTER_SWIM_OFFSET + 8);
      }

      const safe = clampToCircle(
        {
          x: state.fish.x + limitedVx,
          y: state.fish.y + limitedVy,
        },
        fishNavRadius
      );

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
        fish: {
          ...state.fish,
          x: safe.x,
          y: safe.y,
          vx: limitedVx,
          vy: limitedVy,
          targetX,
          targetY,
          angle,
          swimPhase,
          depth: clampDepth(fishDepth),
          mouthPull: nextMouthPull,
          turnAmount: nextTurnAmount,
          turnVelocity: nextTurnVelocity,
          maxSpeed: state.fish.maxSpeed || 3.1,
          autoPassage,
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
