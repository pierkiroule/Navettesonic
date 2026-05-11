import { create } from "zustand";
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

const saved = loadState();

const DEFAULT_ARENA_RADIUS = 1200;
const FISH_GUIDE_PATH_MAX = 64;

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
  pullLagX: 0,
  pullLagY: 0,
  bodyFlex: 0,
  bodyWaveBoost: 0,
  guidePath: [],
};

const initialState = {
  mode: ["intro", "compo", "reso"].includes(saved?.mode) ? saved.mode : "compo",
  bubbles: defaultPack.bubbles.map((bubble) => ({ ...bubble })),
  fish: {
    ...defaultFish,
    ...(saved?.fish || {}),
  },
  selectedBubbleId: null,
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

export const useSoonStore = create((set, get) => ({
  ...initialState,

  setMode: (mode) => {
    set({
      mode,
      eyesClosed: false,
      selectedBubbleId: null,
      selectedBeaconId: null,
      circuitAutopilot: get().circuitAutopilot,
    });

    saveState(get());
  },

  setFishTarget: (x, y) => {
    const state = get();

    if (state.circuitAutopilot) return;

    const safe = clampToCircle({ x, y }, DEFAULT_ARENA_RADIUS * 1.7);

    set((state) => ({
      fish: (() => {
        const prev = Array.isArray(state.fish.guidePath) ? state.fish.guidePath : [];
        const last = prev[prev.length - 1];
        const tooClose =
          last && Math.hypot((last.x || 0) - safe.x, (last.y || 0) - safe.y) < 8;
        const nextPath = tooClose
          ? prev
          : [...prev, { x: safe.x, y: safe.y }].slice(-FISH_GUIDE_PATH_MAX);
        return {
          ...state.fish,
          targetX: safe.x,
          targetY: safe.y,
          guidePath: nextPath,
        };
      })(),
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

  tickFish: () => {
    set((state) => {
      let targetX = state.fish.targetX;
      let targetY = state.fish.targetY;
      const guidePath = Array.isArray(state.fish.guidePath) ? [...state.fish.guidePath] : [];
      let fishDepth = clampDepth(state.fish.depth || 1);
      let circuitSegmentIndex = state.circuitSegmentIndex || 0;
      let circuitSegmentT = state.circuitSegmentT || 0;
      const circuitAutopilot = Boolean(state.circuitAutopilot);

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
        guidePath.push({ x: targetX, y: targetY });
        while (guidePath.length > FISH_GUIDE_PATH_MAX) guidePath.shift();
      }

      if (guidePath.length > 1) {
        const delayedIndex = Math.max(0, guidePath.length - 1 - 8);
        const delayed = guidePath[delayedIndex];
        targetX = delayed.x;
        targetY = delayed.y;
      }

      const currentAngle = Number.isFinite(state.fish.angle)
        ? state.fish.angle
        : -Math.PI / 2;

      // Point d'accroche invisible : le tap tire un point élastique, puis le poisson suit.
      const lagEase = circuitAutopilot ? 0.22 : 0.16;
      const lagX = (state.fish.pullLagX ?? state.fish.targetX ?? 0) +
        (targetX - (state.fish.pullLagX ?? state.fish.targetX ?? 0)) * lagEase;
      const lagY = (state.fish.pullLagY ?? state.fish.targetY ?? 0) +
        (targetY - (state.fish.pullLagY ?? state.fish.targetY ?? 0)) * lagEase;

      // Point de bouche : on tire le poisson par l'avant avec un léger décalage.
      const mouthDistance = 46;
      const mouthX = state.fish.x + Math.cos(currentAngle) * mouthDistance;
      const mouthY = state.fish.y + Math.sin(currentAngle) * mouthDistance;

      const pullX = lagX - mouthX;
      const pullY = lagY - mouthY;
      const pullDistance = Math.hypot(pullX, pullY);

      // Traction progressive : douce près du doigt, plus nette quand le fil est tendu.
      const pullNorm = Math.min(1, pullDistance / 320);
      const pullForce = circuitAutopilot
        ? 0.034 + pullNorm * 0.016
        : 0.023 + pullNorm * 0.03;

      const desiredVx = pullX * pullForce;
      const desiredVy = pullY * pullForce;

      // Vitesse amortie pour un suivi souple et organique.
      const fluidity = circuitAutopilot ? 0.1 : 0.12;

      const vx = state.fish.vx + (desiredVx - state.fish.vx) * fluidity;
      const vy = state.fish.vy + (desiredVy - state.fish.vy) * fluidity;

      const safe = clampToCircle(
        {
          x: state.fish.x + vx,
          y: state.fish.y + vy,
        },
        DEFAULT_ARENA_RADIUS * 1.7
      );

      const speed = Math.hypot(vx, vy);

      // Orientation : le poisson suit la courbe du mouvement.
      const moveAngle = speed > 0.035 ? Math.atan2(vy, vx) : currentAngle;

      let angleDiff = moveAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const turnStrength = Math.min(1, Math.abs(angleDiff) / 0.9);
      const turnDirection = Math.sign(angleDiff || 0);

      const angle =
        speed > 0.035
          ? lerpAngle(
              currentAngle,
              moveAngle,
              0.045 + Math.min(0.08, speed * 0.009) + turnStrength * 0.035
            )
          : currentAngle;

      const rawAngularVelocity = speed > 0.03 ? angleDiff : 0;
      const previousFlex = state.fish.bodyFlex || 0;
      const targetFlex = rawAngularVelocity * 0.95;
      const nextBodyFlex = previousFlex + (targetFlex - previousFlex) * 0.2;

      const prevWaveBoost = state.fish.bodyWaveBoost || 0;
      const waveDrive =
        Math.min(1, speed / 2.6) * (0.45 + Math.abs(nextBodyFlex) * 0.9);
      const nextBodyWaveBoost =
        prevWaveBoost + (waveDrive - prevWaveBoost) * 0.12;

      const mouthPull = state.fish.mouthPull || 0;
      const nextMouthPull = mouthPull + (pullNorm - mouthPull) * 0.12;

      const turnAmount = state.fish.turnAmount || 0;
      const nextTurnAmount = turnAmount + (turnStrength - turnAmount) * 0.1;

      const guideTail =
        guidePath.length > 2
          ? guidePath[Math.max(0, guidePath.length - 10)]
          : { x: state.fish.x, y: state.fish.y };
      const guideHead = guidePath.length ? guidePath[guidePath.length - 1] : { x: lagX, y: lagY };
      const guideAngle = Math.atan2(guideHead.y - guideTail.y, guideHead.x - guideTail.x);

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
          vx,
          vy,
          targetX,
          targetY,
          angle,
          swimPhase,
          depth: clampDepth(fishDepth),
          mouthPull: nextMouthPull,
          turnAmount: nextTurnAmount * turnDirection,
          bodyFlex: nextBodyFlex,
          bodyWaveBoost: nextBodyWaveBoost,
          guidePath,
          guideAngle,
          maxSpeed: state.fish.maxSpeed || 3.1,
          pullLagX: lagX,
          pullLagY: lagY,
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
      mode: "reso",
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
