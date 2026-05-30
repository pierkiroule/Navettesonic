import { useSoonStore } from "../../store/useSoonStore.js";
import { ECHOSTORY_MUSIC_CORE_ID, getEchostoryLinks, makeLinkId } from "./echostoryConstellation.js";
import { playEchostoryStarPreview } from "../../components/soon/useSoonCanvasLoop.js";
import { updateResonantRipples } from "../fishNavigationEngine.js";

const MYCELIUM_PLAYBACK_SPEED = 4.8;
const MYCELIUM_SWIM_CURVE_MAX_AMPLITUDE = 30;
const MYCELIUM_ARRIVAL_THRESHOLD = 18;
const SOON_FREE_SWIM_SPEED = 5.2;
const SOON_FREE_SWIM_RESUME_MS = 1300;
const SOON_LINK_SILENCE_MS = 3000;
const SOON_WAYPOINT_REACH_RADIUS = 92;
const SOON_WAYPOINT_TTL_MS = 4200;
const SOON_RESONANCE_TARGET_OFFSET = 420;
const SOON_RESONANCE_DRIFT_STEP = 13;
const SOON_STAR_BILLIARD_RADIUS = 84;
const SOON_STAR_BILLIARD_IMPULSE = 4.8;

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
  const distance = Math.sqrt(Math.random()) * Math.max(180, radius);
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
}

function clampWaypointToArena(point, radius) {
  const x = Number.isFinite(point?.x) ? point.x : 0;
  const y = Number.isFinite(point?.y) ? point.y : 0;
  const distance = Math.hypot(x, y);
  const safeRadius = Math.max(140, radius);
  if (distance <= safeRadius || distance <= 0.0001) return { x, y };
  return { x: (x / distance) * safeRadius, y: (y / distance) * safeRadius };
}

function pickFreeSwimWaypoint({ arenaRadius = 1200, now = Date.now() } = {}) {
  return {
    ...clampWaypointToArena(randomWanderPoint(Math.max(180, arenaRadius - 126)), Math.max(180, arenaRadius - 126)),
    bornAt: now,
  };
}

function shouldRefreshWaypoint(waypoint, currentX, currentY, now) {
  if (!waypoint || !Number.isFinite(waypoint.x) || !Number.isFinite(waypoint.y)) return true;
  if (Math.hypot(currentX - waypoint.x, currentY - waypoint.y) <= SOON_WAYPOINT_REACH_RADIUS) return true;
  return Number.isFinite(waypoint.bornAt) && now - waypoint.bornAt > SOON_WAYPOINT_TTL_MS;
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

function getNodePosition(nodeId, starsById) {
  if (nodeId === ECHOSTORY_MUSIC_CORE_ID) return { x: 0, y: 0, r: 34, id: ECHOSTORY_MUSIC_CORE_ID };
  const star = starsById.get(nodeId);
  if (!star) return null;
  return {
    ...star,
    x: Number.isFinite(star.x) ? star.x : 0,
    y: Number.isFinite(star.y) ? star.y : 0,
  };
}

function distancePointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 0.0001) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const cross = (x1, y1, x2, y2) => x1 * y2 - y1 * x2;
  const rX = bx - ax;
  const rY = by - ay;
  const sX = dx - cx;
  const sY = dy - cy;
  const denom = cross(rX, rY, sX, sY);
  if (Math.abs(denom) < 0.0001) return false;
  const qpx = cx - ax;
  const qpy = cy - ay;
  const t = cross(qpx, qpy, sX, sY) / denom;
  const u = cross(qpx, qpy, rX, rY) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function findCrossedLink({ links = [], starsById, fromX, fromY, toX, toY, cooldowns = {}, now = Date.now() }) {
  for (const link of links) {
    if (link?.from === ECHOSTORY_MUSIC_CORE_ID || link?.to === ECHOSTORY_MUSIC_CORE_ID) continue;
    const linkId = link?.id || makeLinkId(link?.from, link?.to);
    if (!linkId || (Number.isFinite(cooldowns?.[linkId]) && now - cooldowns[linkId] < 7200)) continue;
    const a = getNodePosition(link?.from, starsById);
    const b = getNodePosition(link?.to, starsById);
    if (!a || !b || a.expired || b.expired) continue;
    const crossed = segmentsIntersect(fromX, fromY, toX, toY, a.x, a.y, b.x, b.y);
    if (crossed) return { ...link, id: linkId };
  }
  return null;
}

function applyBilliardImpulseToStars(stars = [], fromX = 0, fromY = 0, toX = 0, toY = 0, now = Date.now()) {
  const moveX = toX - fromX;
  const moveY = toY - fromY;
  const moveLength = Math.max(0.001, Math.hypot(moveX, moveY));
  stars.forEach((star) => {
    if (!star || star.expired || star.expiring || star.attachedToContour || star.draggingByTouch) return;
    const radius = Math.max(SOON_STAR_BILLIARD_RADIUS, (Number.isFinite(star.r) ? star.r : 34) * 2.1);
    const distance = distancePointToSegment(star.x || 0, star.y || 0, fromX, fromY, toX, toY);
    if (distance > radius) return;
    const awayX = ((star.x || 0) - toX) / Math.max(1, Math.hypot((star.x || 0) - toX, (star.y || 0) - toY));
    const awayY = ((star.y || 0) - toY) / Math.max(1, Math.hypot((star.x || 0) - toX, (star.y || 0) - toY));
    const force = (1 - distance / radius) * SOON_STAR_BILLIARD_IMPULSE;
    star.vx = (star.vx || 0) + (moveX / moveLength + awayX * 0.45) * force;
    star.vy = (star.vy || 0) + (moveY / moveLength + awayY * 0.45) * force;
    star.lastPushedBySoonAt = now;
  });
}

async function playLinkedStarsSequence(link, stars, fishX = 0) {
  const starsById = new Map(stars.map((star) => [star?.id, star]).filter(([id]) => id));
  const endpoints = [link?.from, link?.to]
    .map((id) => starsById.get(id))
    .filter(Boolean);
  for (const star of endpoints) {
    star.previewPlaying = true;
    star.previewStartedAt = Date.now();
    try {
      await playEchostoryStarPreview(star, fishX, getStarOrdinal(stars, star));
      star.previewPlayed = true;
    } finally {
      star.previewPlaying = false;
      star.previewStartedAt = 0;
    }
  }
}

function startLinkResonance({ link, stars, fishX = 0, now = Date.now() }) {
  if (!link?.id) return;
  playLinkedStarsSequence(link, stars, fishX).finally(() => {
    useSoonStore.setState((state) => {
      const playback = state.echostory?.echostoryPlayback || {};
      if (playback.activeLinkId !== link.id) return {};
      return {
        fish: {
          ...(state.fish || {}),
          vx: 0,
          vy: 0,
          resumeStartedAt: Date.now(),
        },
        echostory: {
          ...(state.echostory || {}),
          playbackCurrentLinkId: null,
          echostoryPlayback: {
            ...playback,
            linkPlaybackActive: false,
            activeLinkId: null,
            silenceUntil: Date.now() + SOON_LINK_SILENCE_MS,
            resumeStartedAt: Date.now(),
          },
        },
      };
    });
  });
}

export function tickMyceliumPlayback(now = Date.now()) {
  const fullState = useSoonStore.getState();
  const echostory = fullState.echostory || {};
  const playback = echostory.echostoryPlayback || {};
  if (!playback.active) return false;

  const stars = (echostory.stars || []).filter((star) => star && !star.expired);
  const starsById = new Map(stars.map((star) => [star.id, star]).filter(([id]) => id));
  const links = getEchostoryLinks(echostory);
  const fish = fullState.fish || {};
  const currentX = Number.isFinite(fish.x) ? fish.x : 0;
  const currentY = Number.isFinite(fish.y) ? fish.y : 0;

  if (playback.linkPlaybackActive || (Number.isFinite(playback.silenceUntil) && now < playback.silenceUntil)) {
    useSoonStore.setState((state) => ({
      fish: {
        ...(state.fish || {}),
        visible: true,
        targetX: currentX,
        targetY: currentY,
        vx: 0,
        vy: 0,
      },
      echostory: {
        ...(state.echostory || {}),
        playbackCurrentLinkId: playback.activeLinkId || state.echostory?.playbackCurrentLinkId || null,
        echostoryPlayback: {
          ...(state.echostory?.echostoryPlayback || {}),
          visible: true,
          x: currentX,
          y: currentY,
        },
      },
    }));
    return true;
  }

  const arenaRadius = getPlaybackArenaRadius(fullState);
  const resonance = updateResonantRipples(fullState.resonantRipples || [], fish, now);
  let roamWaypoint = playback.roamWaypoint || null;
  if (shouldRefreshWaypoint(roamWaypoint, currentX, currentY, now)) {
    roamWaypoint = pickFreeSwimWaypoint({ arenaRadius, now });
  }

  const targetX = roamWaypoint.x + resonance.forceX * SOON_RESONANCE_TARGET_OFFSET;
  const targetY = roamWaypoint.y + resonance.forceY * SOON_RESONANCE_TARGET_OFFSET;
  const resumeStartedAt = Number.isFinite(playback.resumeStartedAt) ? playback.resumeStartedAt : (playback.startedAt || now);
  const resumeRatio = Math.max(0.22, Math.min(1, (now - resumeStartedAt) / SOON_FREE_SWIM_RESUME_MS));
  const step = computeCuriousFishStep({
    currentX,
    currentY,
    targetX,
    targetY,
    segmentStartX: Number.isFinite(playback.segmentStartX) ? playback.segmentStartX : currentX,
    segmentStartY: Number.isFinite(playback.segmentStartY) ? playback.segmentStartY : currentY,
    now,
    seed: Number.isFinite(playback.swimSeed) ? playback.swimSeed : 1.618,
    speed: SOON_FREE_SWIM_SPEED * resumeRatio,
    arrivalThreshold: SOON_WAYPOINT_REACH_RADIUS * 0.32,
  });
  const driftX = resonance.forceX * SOON_RESONANCE_DRIFT_STEP;
  const driftY = resonance.forceY * SOON_RESONANCE_DRIFT_STEP;
  const nextX = step.x + driftX;
  const nextY = step.y + driftY;
  const crossedLink = findCrossedLink({
    links,
    starsById,
    fromX: currentX,
    fromY: currentY,
    toX: nextX,
    toY: nextY,
    cooldowns: playback.linkCooldowns || {},
    now,
  });

  applyBilliardImpulseToStars(stars, currentX, currentY, nextX, nextY, now);

  const angle = Math.hypot(step.vx + driftX, step.vy + driftY) > 0.001
    ? Math.atan2(step.vy + driftY, step.vx + driftX)
    : step.angle;

  useSoonStore.setState((state) => ({
    resonantRipples: resonance.ripples,
    fish: {
      ...(state.fish || {}),
      visible: true,
      x: nextX,
      y: nextY,
      targetX,
      targetY,
      vx: crossedLink ? 0 : step.vx + driftX,
      vy: crossedLink ? 0 : step.vy + driftY,
      angle,
    },
    echostory: {
      ...(state.echostory || {}),
      activeLine: crossedLink ? "Le fil résonne comme une harpe…" : state.echostory?.activeLine,
      playbackCurrentLinkId: crossedLink?.id || null,
      playbackTargetNodeId: null,
      echostoryPlayback: {
        ...(state.echostory?.echostoryPlayback || {}),
        active: true,
        visible: true,
        x: nextX,
        y: nextY,
        currentNodeId: null,
        playbackTargetNodeId: null,
        targetNodeId: null,
        semanticTargetNodeId: null,
        segmentStartX: step.arrived ? nextX : (Number.isFinite(state.echostory?.echostoryPlayback?.segmentStartX) ? state.echostory.echostoryPlayback.segmentStartX : currentX),
        segmentStartY: step.arrived ? nextY : (Number.isFinite(state.echostory?.echostoryPlayback?.segmentStartY) ? state.echostory.echostoryPlayback.segmentStartY : currentY),
        roamWaypoint: step.arrived ? pickFreeSwimWaypoint({ arenaRadius, now }) : roamWaypoint,
        swimSeed: step.arrived ? Math.random() * Math.PI * 2 : (state.echostory?.echostoryPlayback?.swimSeed || 1.618),
        linkPlaybackActive: Boolean(crossedLink),
        activeLinkId: crossedLink?.id || null,
        linkCooldowns: crossedLink ? {
          ...(state.echostory?.echostoryPlayback?.linkCooldowns || {}),
          [crossedLink.id]: now,
        } : (state.echostory?.echostoryPlayback?.linkCooldowns || {}),
        resumeStartedAt: crossedLink ? 0 : resumeStartedAt,
        silenceUntil: 0,
      },
    },
  }));

  if (crossedLink) startLinkResonance({ link: crossedLink, stars, fishX: nextX, now });
  return true;
}
