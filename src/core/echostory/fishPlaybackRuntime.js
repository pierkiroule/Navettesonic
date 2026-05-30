import { useSoonStore } from "../../store/useSoonStore.js";
import { ECHOSTORY_MUSIC_CORE_ID, makeLinkId } from "./echostoryConstellation.js";
import { chooseNextMyceliumNode, computeConnectedToCore, makeGraph } from "./echostoryMyceliumPlayback.js";
import { triggerEchostoryStarPreview } from "../../components/soon/useSoonCanvasLoop.js";
import { updateResonantRipples } from "../fishNavigationEngine.js";

const MYCELIUM_PLAYBACK_SPEED = 4.8;
const MYCELIUM_SWIM_CURVE_MAX_AMPLITUDE = 30;
const MYCELIUM_ARRIVAL_THRESHOLD = 18;
const MYCELIUM_CORE_PAUSE_MS = 1100;
const MYCELIUM_STAR_PAUSE_MS = 360;
const ROSA_WANDER_MIN_MS = 1450;
const ROSA_WANDER_MAX_MS = 2900;
const ROSA_WAYPOINT_REACH_RADIUS = 86;
const ROSA_WAYPOINT_TTL_MS = 1350;
const ROSA_RESONANCE_TARGET_OFFSET = 520;
const ROSA_RESONANCE_DRIFT_STEP = 18;

let lastCoreSpeechAt = 0;

function logFishPlayback(message, ...args) {
  if (typeof console !== "undefined") console.log(message, ...args);
}

export function computeCuriousFishStep({
  currentX = 0,
  currentY = 0,
  targetX = 0,
  targetY = 0,
  segmentStartX = currentX,
  segmentStartY = currentY,
  now = Date.now(),
  seed = 0,
  speed = MYCELIUM_PLAYBACK_SPEED,
  arrivalThreshold = MYCELIUM_ARRIVAL_THRESHOLD,
} = {}) {
  const dx = targetX - currentX;
  const dy = targetY - currentY;
  const distance = Math.hypot(dx, dy);
  if (distance <= arrivalThreshold) {
    return {
      x: targetX,
      y: targetY,
      vx: targetX - currentX,
      vy: targetY - currentY,
      angle: distance > 0.001 ? Math.atan2(dy, dx) : 0,
      arrived: true,
    };
  }

  const ux = distance > 0 ? dx / distance : 1;
  const uy = distance > 0 ? dy / distance : 0;
  const normalX = -uy;
  const normalY = ux;
  const segmentDx = targetX - segmentStartX;
  const segmentDy = targetY - segmentStartY;
  const segmentLength = Math.max(1, Math.hypot(segmentDx, segmentDy));
  const projected = ((currentX - segmentStartX) * segmentDx + (currentY - segmentStartY) * segmentDy) / (segmentLength * segmentLength);
  const progress = Math.max(0, Math.min(1, projected));
  const envelope = Math.sin(progress * Math.PI);
  const amplitude = Math.min(MYCELIUM_SWIM_CURVE_MAX_AMPLITUDE, Math.max(7, segmentLength * 0.08)) * envelope;
  const phase = now * 0.006 + seed;
  const desiredOffset = (
    Math.sin(progress * Math.PI * 2.35 + phase) * amplitude +
    Math.sin(progress * Math.PI * 4.1 + phase * 0.73) * amplitude * 0.32
  );
  const baseX = segmentStartX + segmentDx * progress;
  const baseY = segmentStartY + segmentDy * progress;
  const currentOffset = (currentX - baseX) * normalX + (currentY - baseY) * normalY;
  const lateralStep = (desiredOffset - currentOffset) * 0.2;
  const forwardStep = Math.min(speed, distance);
  const nextX = currentX + ux * forwardStep + normalX * lateralStep;
  const nextY = currentY + uy * forwardStep + normalY * lateralStep;
  const nextDistance = Math.hypot(targetX - nextX, targetY - nextY);
  const arrived = nextDistance <= arrivalThreshold;
  const finalX = arrived ? targetX : nextX;
  const finalY = arrived ? targetY : nextY;
  const vx = finalX - currentX;
  const vy = finalY - currentY;

  return {
    x: finalX,
    y: finalY,
    vx,
    vy,
    angle: Math.hypot(vx, vy) > 0.001 ? Math.atan2(vy, vx) : Math.atan2(dy, dx),
    arrived,
  };
}

function getPlaybackArenaRadius(state = {}) {
  const fishRadius = Number(state?.fish?.arenaRadius);
  const stateRadius = Number(state?.arenaRadius);
  return Number.isFinite(fishRadius) && fishRadius > 0
    ? fishRadius
    : (Number.isFinite(stateRadius) && stateRadius > 0 ? stateRadius : 1200);
}

function randomWanderPoint(radius) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * Math.max(140, radius);
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
}

function clampWaypointToArena(point, radius) {
  const x = Number.isFinite(point?.x) ? point.x : 0;
  const y = Number.isFinite(point?.y) ? point.y : 0;
  const distance = Math.hypot(x, y);
  const safeRadius = Math.max(120, radius);
  if (distance <= safeRadius || distance <= 0.0001) return { x, y };
  return { x: (x / distance) * safeRadius, y: (y / distance) * safeRadius };
}

function pickRosaWanderWaypoint({ currentX = 0, currentY = 0, target = { x: 0, y: 0 }, arenaRadius = 1200, now = Date.now() } = {}) {
  const safeRadius = Math.max(180, arenaRadius - 132);
  const freePoint = randomWanderPoint(safeRadius);
  const targetAngle = Math.atan2((target.y || 0) - currentY, (target.x || 0) - currentX);
  const tangent = targetAngle + (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2 + Math.random() * 0.75);
  const tangentDistance = 190 + Math.random() * Math.min(520, safeRadius * 0.5);
  const nearTarget = {
    x: (target.x || 0) + Math.cos(tangent) * tangentDistance,
    y: (target.y || 0) + Math.sin(tangent) * tangentDistance,
  };
  const mix = 0.24 + Math.random() * 0.28;
  const point = Math.random() < 0.64
    ? freePoint
    : { x: freePoint.x * (1 - mix) + nearTarget.x * mix, y: freePoint.y * (1 - mix) + nearTarget.y * mix };
  return {
    ...clampWaypointToArena(point, safeRadius),
    bornAt: now,
  };
}

function getRosaWanderUntil(playback = {}, now = Date.now()) {
  if (Number.isFinite(playback.wanderUntil) && playback.wanderUntil > now) return playback.wanderUntil;
  if (Number.isFinite(playback.wanderUntil) && playback.wanderUntil > 0) return playback.wanderUntil;
  return now + ROSA_WANDER_MIN_MS + Math.random() * (ROSA_WANDER_MAX_MS - ROSA_WANDER_MIN_MS);
}

function shouldRefreshWaypoint(waypoint, currentX, currentY, now) {
  if (!waypoint || !Number.isFinite(waypoint.x) || !Number.isFinite(waypoint.y)) return true;
  if (Math.hypot(currentX - waypoint.x, currentY - waypoint.y) <= ROSA_WAYPOINT_REACH_RADIUS) return true;
  return Number.isFinite(waypoint.bornAt) && now - waypoint.bornAt > ROSA_WAYPOINT_TTL_MS;
}

function speakCoreBubble(now = Date.now()) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (now - lastCoreSpeechAt < 900) return;
  lastCoreSpeechAt = now;
  try {
    const utterance = new SpeechSynthesisUtterance("et bientôt");
    utterance.lang = "fr-FR";
    utterance.rate = 0.82;
    utterance.pitch = 1.12;
    utterance.volume = 0.42;
    window.speechSynthesis.speak(utterance);
  } catch {
    // La voix du noyau est optionnelle selon le navigateur.
  }
}

function getMyceliumNodePosition(nodeId, starsById) {
  if (nodeId === ECHOSTORY_MUSIC_CORE_ID) return { x: 0, y: 0 };
  const star = starsById.get(nodeId);
  if (!star) return null;
  return {
    x: Number.isFinite(star.x) ? star.x : 0,
    y: Number.isFinite(star.y) ? star.y : 0,
  };
}

function getStarOrdinal(stars = [], targetStar = null) {
  let ordinal = 0;
  for (const star of stars) {
    if (!star) continue;
    if (star === targetStar || (targetStar?.id && star.id === targetStar.id)) return ordinal;
    ordinal += 1;
  }
  return 0;
}

export function tickMyceliumPlayback(now = Date.now()) {
  const fullState = useSoonStore.getState();
  const echostory = fullState.echostory || {};
  const playback = echostory.echostoryPlayback || {};
  if (!playback.active) return false;

  const stars = (echostory.stars || []).filter((star) => star && !star.expired);
  const starsById = new Map(stars.map((star) => [star.id, star]).filter(([id]) => id));
  const graph = makeGraph([{ id: ECHOSTORY_MUSIC_CORE_ID }, ...stars], echostory.links || []);
  const connectedToCore = computeConnectedToCore(graph, ECHOSTORY_MUSIC_CORE_ID);
  const targetNodeId = playback.playbackTargetNodeId || echostory.playbackTargetNodeId || null;
  const fish = fullState.fish || {};

  if (targetNodeId) {
    const target = getMyceliumNodePosition(targetNodeId, starsById);
    if (!target || !connectedToCore.has(targetNodeId)) {
      useSoonStore.setState((state) => ({
        echostory: {
          ...state.echostory,
          playbackTargetNodeId: null,
          playbackCurrentLinkId: null,
          echostoryPlayback: {
            ...(state.echostory?.echostoryPlayback || {}),
            playbackTargetNodeId: null,
            targetNodeId: null,
            segmentStartX: null,
            segmentStartY: null,
          },
        },
      }));
      return true;
    }

    const currentX = Number.isFinite(fish.x) ? fish.x : 0;
    const currentY = Number.isFinite(fish.y) ? fish.y : 0;
    const arenaRadius = getPlaybackArenaRadius(fullState);
    const resonance = updateResonantRipples(fullState.resonantRipples || [], fish, now);
    const wanderUntil = getRosaWanderUntil(playback, now);
    const directTargetDistance = Math.hypot((target.x || 0) - currentX, (target.y || 0) - currentY);
    const shouldWander = directTargetDistance > MYCELIUM_ARRIVAL_THRESHOLD * 2.4 && now < wanderUntil;
    let roamWaypoint = playback.roamWaypoint || null;
    if (shouldWander && shouldRefreshWaypoint(roamWaypoint, currentX, currentY, now)) {
      roamWaypoint = pickRosaWanderWaypoint({ currentX, currentY, target, arenaRadius, now });
    }
    const navigationTarget = shouldWander && roamWaypoint ? roamWaypoint : target;
    const targetX = navigationTarget.x + resonance.forceX * ROSA_RESONANCE_TARGET_OFFSET;
    const targetY = navigationTarget.y + resonance.forceY * ROSA_RESONANCE_TARGET_OFFSET;
    const step = computeCuriousFishStep({
      currentX,
      currentY,
      targetX,
      targetY,
      segmentStartX: Number.isFinite(playback.segmentStartX) ? playback.segmentStartX : currentX,
      segmentStartY: Number.isFinite(playback.segmentStartY) ? playback.segmentStartY : currentY,
      now,
      seed: Number.isFinite(playback.swimSeed) ? playback.swimSeed : 0,
    });
    const driftX = resonance.forceX * ROSA_RESONANCE_DRIFT_STEP;
    const driftY = resonance.forceY * ROSA_RESONANCE_DRIFT_STEP;
    const nextX = step.x + driftX;
    const nextY = step.y + driftY;
    const angle = Math.hypot(step.vx + driftX, step.vy + driftY) > 0.001 ? Math.atan2(step.vy + driftY, step.vx + driftX) : step.angle;
    const arrived = !shouldWander && step.arrived;
    const fromNodeId = playback.currentNodeId || ECHOSTORY_MUSIC_CORE_ID;

    logFishPlayback("[fish move]", nextX, nextY, targetNodeId, shouldWander ? "wander" : "read");

    useSoonStore.setState((state) => ({
      resonantRipples: resonance.ripples,
      fish: {
        ...(state.fish || {}),
        visible: true,
        x: nextX,
        y: nextY,
        targetX,
        targetY,
        vx: step.vx + driftX,
        vy: step.vy + driftY,
        angle,
      },
      echostory: {
        ...(state.echostory || {}),
        playbackTargetNodeId: arrived ? null : targetNodeId,
        playbackCurrentLinkId: null,
        echostoryPlayback: {
          ...(state.echostory?.echostoryPlayback || {}),
          active: true,
          visible: true,
          x: nextX,
          y: nextY,
          targetNodeId: arrived ? null : targetNodeId,
          semanticTargetNodeId: arrived ? null : targetNodeId,
          segmentStartX: arrived ? null : state.echostory?.echostoryPlayback?.segmentStartX,
          segmentStartY: arrived ? null : state.echostory?.echostoryPlayback?.segmentStartY,
          currentNodeId: arrived ? targetNodeId : fromNodeId,
          playbackTargetNodeId: arrived ? null : targetNodeId,
          roamWaypoint: arrived ? null : roamWaypoint,
          wanderUntil: arrived ? 0 : wanderUntil,
          arrivedNodeId: arrived ? null : state.echostory?.echostoryPlayback?.arrivedNodeId,
          waitingUntil: arrived ? 0 : state.echostory?.echostoryPlayback?.waitingUntil,
        },
      },
    }));
    return true;
  }

  const currentNodeId = playback.currentNodeId || ECHOSTORY_MUSIC_CORE_ID;
  const currentStar = starsById.get(currentNodeId);
  const path = Array.isArray(playback.path) ? playback.path : [];

  if (path[path.length - 1] !== currentNodeId) {
    const visited = { ...(playback.visited || {}) };
    visited[currentNodeId] = (visited[currentNodeId] || 0) + 1;
    const waitingUntil = now + (currentNodeId === ECHOSTORY_MUSIC_CORE_ID ? MYCELIUM_CORE_PAUSE_MS : MYCELIUM_STAR_PAUSE_MS);

    if (currentNodeId === ECHOSTORY_MUSIC_CORE_ID) {
      speakCoreBubble(now);
    } else if (currentStar) {
      triggerEchostoryStarPreview(currentStar, {
        fishX: Number.isFinite(fish.x) ? fish.x : 0,
        colorOrdinal: getStarOrdinal(stars, currentStar),
      });
    }

    useSoonStore.setState((state) => ({
      echostory: {
        ...(state.echostory || {}),
        activeLine: currentNodeId === ECHOSTORY_MUSIC_CORE_ID ? "...et bientôt..." : (currentStar?.text || currentStar?.label || "Étoile MP3"),
        playbackTargetNodeId: null,
        echostoryPlayback: {
          ...(state.echostory?.echostoryPlayback || {}),
          active: true,
          visible: true,
          x: Number.isFinite(state.fish?.x) ? state.fish.x : 0,
          y: Number.isFinite(state.fish?.y) ? state.fish.y : 0,
          currentNodeId,
          visited,
          path: [...path, currentNodeId],
          waitingUntil,
          arrivedNodeId: currentNodeId,
        },
      },
    }));
    return true;
  }

  if (currentStar?.previewPlaying) return true;
  if (Number.isFinite(playback.waitingUntil) && now < playback.waitingUntil) return true;

  const nextNodeId = chooseNextMyceliumNode({
    currentNodeId,
    graph,
    connectedToCore,
    visited: playback.visited || {},
    coreId: ECHOSTORY_MUSIC_CORE_ID,
  });

  if (!nextNodeId) {
    useSoonStore.setState((state) => ({
      fish: {
        ...(state.fish || {}),
        visible: false,
        vx: 0,
        vy: 0,
      },
      echostory: {
        ...(state.echostory || {}),
        activeLine: null,
        playbackTargetNodeId: null,
        playbackCurrentLinkId: null,
        echostoryPlayback: {
          ...(state.echostory?.echostoryPlayback || {}),
          active: false,
          visible: false,
          playbackTargetNodeId: null,
          targetNodeId: null,
          segmentStartX: null,
          segmentStartY: null,
        },
      },
    }));
    return true;
  }

  useSoonStore.setState((state) => ({
    echostory: {
      ...(state.echostory || {}),
      playbackTargetNodeId: nextNodeId,
      playbackCurrentLinkId: null,
      echostoryPlayback: {
        ...(state.echostory?.echostoryPlayback || {}),
        active: true,
        visible: true,
        targetNodeId: nextNodeId,
        playbackTargetNodeId: nextNodeId,
        segmentStartX: Number.isFinite(state.fish?.x) ? state.fish.x : 0,
        segmentStartY: Number.isFinite(state.fish?.y) ? state.fish.y : 0,
        swimSeed: ((state.echostory?.echostoryPlayback?.path || []).length + 1) * 1.618,
        roamWaypoint: pickRosaWanderWaypoint({
          currentX: Number.isFinite(state.fish?.x) ? state.fish.x : 0,
          currentY: Number.isFinite(state.fish?.y) ? state.fish.y : 0,
          target: getMyceliumNodePosition(nextNodeId, new Map(((state.echostory?.stars || []).filter((star) => star && !star.expired)).map((star) => [star.id, star]).filter(([id]) => id))) || { x: 0, y: 0 },
          arenaRadius: getPlaybackArenaRadius(state),
          now,
        }),
        wanderUntil: now + ROSA_WANDER_MIN_MS + Math.random() * (ROSA_WANDER_MAX_MS - ROSA_WANDER_MIN_MS),
        waitingUntil: 0,
      },
    },
  }));
  return true;
}
