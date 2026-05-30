import { useSoonStore } from "../../store/useSoonStore.js";
import { ECHOSTORY_MUSIC_CORE_ID, makeLinkId } from "./echostoryConstellation.js";
import { chooseNextMyceliumNode, computeConnectedToCore, makeGraph } from "./echostoryMyceliumPlayback.js";
import { triggerEchostoryStarPreview } from "../../components/soon/useSoonCanvasLoop.js";

const MYCELIUM_PLAYBACK_SPEED = 4.8;
const MYCELIUM_SWIM_CURVE_MAX_AMPLITUDE = 30;
const MYCELIUM_ARRIVAL_THRESHOLD = 18;
const MYCELIUM_CORE_PAUSE_MS = 1100;
const MYCELIUM_STAR_PAUSE_MS = 360;

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
    const step = computeCuriousFishStep({
      currentX,
      currentY,
      targetX: target.x,
      targetY: target.y,
      segmentStartX: Number.isFinite(playback.segmentStartX) ? playback.segmentStartX : currentX,
      segmentStartY: Number.isFinite(playback.segmentStartY) ? playback.segmentStartY : currentY,
      now,
      seed: Number.isFinite(playback.swimSeed) ? playback.swimSeed : 0,
    });
    const nextX = step.x;
    const nextY = step.y;
    const angle = step.angle;
    const arrived = step.arrived;
    const fromNodeId = playback.currentNodeId || ECHOSTORY_MUSIC_CORE_ID;
    const linkId = makeLinkId(fromNodeId, targetNodeId);

    logFishPlayback("[fish move]", nextX, nextY, targetNodeId);

    useSoonStore.setState((state) => ({
      fish: {
        ...(state.fish || {}),
        visible: true,
        x: nextX,
        y: nextY,
        targetX: target.x,
        targetY: target.y,
        vx: step.vx,
        vy: step.vy,
        angle,
      },
      echostory: {
        ...(state.echostory || {}),
        playbackTargetNodeId: arrived ? null : targetNodeId,
        playbackCurrentLinkId: linkId,
        echostoryPlayback: {
          ...(state.echostory?.echostoryPlayback || {}),
          active: true,
          visible: true,
          x: nextX,
          y: nextY,
          targetNodeId: arrived ? null : targetNodeId,
          segmentStartX: arrived ? null : state.echostory?.echostoryPlayback?.segmentStartX,
          segmentStartY: arrived ? null : state.echostory?.echostoryPlayback?.segmentStartY,
          currentNodeId: arrived ? targetNodeId : fromNodeId,
          playbackTargetNodeId: arrived ? null : targetNodeId,
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
      playbackCurrentLinkId: makeLinkId(currentNodeId, nextNodeId),
      echostoryPlayback: {
        ...(state.echostory?.echostoryPlayback || {}),
        active: true,
        visible: true,
        targetNodeId: nextNodeId,
        playbackTargetNodeId: nextNodeId,
        segmentStartX: Number.isFinite(state.fish?.x) ? state.fish.x : 0,
        segmentStartY: Number.isFinite(state.fish?.y) ? state.fish.y : 0,
        swimSeed: ((state.echostory?.echostoryPlayback?.path || []).length + 1) * 1.618,
        waitingUntil: 0,
      },
    },
  }));
  return true;
}
