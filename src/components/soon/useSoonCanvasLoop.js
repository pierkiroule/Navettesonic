import { useEffect } from "react";
import {
  clampEditCamera,
  enterWorld,
  exitWorld,
  resetEditCamera,
  resizeCanvas,
  updateArena,
} from "../../core/soonCamera.js";
import { getAudioAnalysisSnapshot, getSooncutSampleUrlByColor, playOneShotFile, updateBubbleSpatialMix } from "../../core/audioEngine.js";
import { updateEcosystemFx } from "../../core/ecosystemFx.js";
import { updateBubbleAudioTriggers } from "../../core/soonAudioTriggers.js";
import { drawScene } from "../../core/soonRenderers.js";
import { updateAudioreactiveVisualState } from "../../core/audioreactiveVisualEngine.js";
import { getMembraneRadiusForLevel } from "../../core/fishNavigationEngine.js";
import { setContourMusicLoopActive } from "../../core/organicAmbienceEngine.js";
import { resetCanvasPaintState } from "../../core/canvasState.js";
import { ECHOSTORY_MUSIC_CORE_ID, getEchostoryLinks, makeLinkId, normalizeEchostoryNetwork } from "../../core/echostory/echostoryConstellation.js";
import { ARENA_INNER_BOUNDARY_INSET, MEMBRANE_LEVEL_MULTIPLIERS } from "../../core/constants.js";
import { getBlobRadiusAtAngle } from "../../core/blobArena.js";
import {
  getCharacterWorldEffects,
  updateCharacters,
} from "../../core/characters/characterEngine.js";



const CONTACT_PUSH_DISTANCE = 58;
const SOON_CONTACT_REBOUND_MULTIPLIER = 6;
const STAR_PUSH_SMOOTHING = 0.52;
const STAR_PUSH_MAX_STEP = 28;
const STAR_EDGE_STICK_THRESHOLD = 48;
const STAR_EDGE_STICK_RELEASE = 86;
const STAR_BREATH_MENU_COOLDOWN_MS = 900;
const STAR_INHALE_IMPULSE = 16;
const STAR_EXHALE_IMPULSE = 34;
const STAR_NETWORK_LINK_DISTANCE = 142;
const STAR_NETWORK_BRANCH_REST_LENGTH = 132;
const MUSIC_CORE_TOUCH_RADIUS = 150;
const MUSIC_CORE_LINK_REST_LENGTH = 148;
const STAR_NETWORK_MIN_SEPARATION = 104;
const MUSIC_CORE_MIN_SEPARATION = 126;
const STAR_NETWORK_SPACING_FORCE = 0.008;
const STAR_NETWORK_LINK_STIFFNESS = 0.014;
const MUSIC_CORE_LINK_STIFFNESS_MULTIPLIER = 0.32;
const STAR_NETWORK_BREAK_THRESHOLD = 54;
const STAR_NETWORK_RUPTURE_STRETCH = 1.18;
const STAR_NETWORK_RUPTURE_EXTRA_DISTANCE = 28;
const STAR_NETWORK_PUSH_MEMORY_MS = 1800;
const STAR_NETWORK_DAMPING = 0.981;
const SOON_STAR_CONTACT_ENABLED = false;

const CONTOUR_RIDE_DURATION_MS = 120000;
const CONTOUR_RIDE_ENTRY_THRESHOLD = 52;
const ZENITH_STAR_REARM_DELAY_MS = 1800;
const CONTOUR_RIDE_STAR_TRIGGER_RADIUS = 72;

function getContourSnapRadius(current = {}, angle = 0) {
  const arenaRadius = Number.isFinite(current?.arenaRadius) ? current.arenaRadius : 1200;
  const fishLevel = Number.isFinite(current?.fish?.arenaLevel) ? current.fish.arenaLevel : 0;
  const hasBlob = Array.isArray(current?.arenaBlob?.points) && current.arenaBlob.points.length > 2;
  if (hasBlob) {
    return Math.max(
      84,
      getBlobRadiusAtAngle(current.arenaBlob, angle) - ARENA_INNER_BOUNDARY_INSET
    );
  }
  return Math.max(84, getMembraneRadiusForLevel(arenaRadius, fishLevel));
}

export function updateContourRide(current = {}, arenaRadius = 1200, now = performance.now()) {
  const fish = current?.fish;
  if (!fish) return;

  const zenithAngle = -Math.PI / 2;
  const zenithRadius = getContourSnapRadius(current, zenithAngle);
  const beacon = { x: 0, y: -zenithRadius };
  const ride = current.contourRide || null;
  const zenithStar = current.zenithStar || null;

  if (!ride?.active) {
    fish.isOnContourRide = false;
    const distToBeacon = Math.hypot((fish.x || 0) - beacon.x, (fish.y || 0) - beacon.y);
    const canTrigger = zenithStar?.armed !== false;
    if (canTrigger && distToBeacon <= CONTOUR_RIDE_ENTRY_THRESHOLD) {
      current.zenithStar = {
        ...(zenithStar || {}),
        x: beacon.x,
        y: beacon.y,
        radius: CONTOUR_RIDE_ENTRY_THRESHOLD,
        armed: false,
        hitAt: now,
      };
      current.contourRide = {
        active: true,
        startedAt: now,
        baseAngle: -Math.PI / 2,
      };
      fish.x = beacon.x;
      fish.y = beacon.y;
      fish.targetX = beacon.x;
      fish.targetY = beacon.y;
      fish.vx = 0;
      fish.vy = 0;
      fish.angle = 0;
      fish.isOnContourRide = true;
    }
    if (!canTrigger && !Number.isFinite(zenithStar?.hitAt)) {
      current.zenithStar = {
        ...(zenithStar || {}),
        x: beacon.x,
        y: beacon.y,
        radius: CONTOUR_RIDE_ENTRY_THRESHOLD,
        armed: true,
      };
    } else if (!canTrigger && Number.isFinite(zenithStar?.hitAt) && now - zenithStar.hitAt >= ZENITH_STAR_REARM_DELAY_MS) {
      current.zenithStar = {
        ...(zenithStar || {}),
        x: beacon.x,
        y: beacon.y,
        radius: CONTOUR_RIDE_ENTRY_THRESHOLD,
        armed: true,
      };
    }
    return;
  }

  const pausedStar = ride.pausedStarId
    ? (current?.echostory?.stars || []).find((star) => star?.id === ride.pausedStarId)
    : null;
  if (ride.pausedAt) {
    const stillDiffusing = pausedStar?.previewPlaying === true || (!ride.pausedStarId && (current?.echostory?.stars || []).some((star) => star?.previewPlaying));
    if (stillDiffusing) {
      fish.targetX = fish.x;
      fish.targetY = fish.y;
      fish.vx = 0;
      fish.vy = 0;
      fish.isOnContourRide = true;
      return;
    }
    ride.pausedDurationMs = (Number.isFinite(ride.pausedDurationMs) ? ride.pausedDurationMs : 0) + Math.max(0, now - ride.pausedAt);
    ride.pausedAt = 0;
    ride.pausedStarId = null;
  }

  const pausedDurationMs = Number.isFinite(ride.pausedDurationMs) ? ride.pausedDurationMs : 0;
  const elapsed = Math.max(0, now - ride.startedAt - pausedDurationMs);
  const rideDurationMs = Number.isFinite(ride?.durationMs) ? ride.durationMs : CONTOUR_RIDE_DURATION_MS;
  const progress = Math.min(1, elapsed / Math.max(1000, rideDurationMs));
  const angle = ride.baseAngle + progress * Math.PI * 2;
  const contourRadius = getContourSnapRadius(current, angle);
  fish.x = Math.cos(angle) * contourRadius;
  fish.y = Math.sin(angle) * contourRadius;
  fish.targetX = fish.x;
  fish.targetY = fish.y;
  fish.vx = 0;
  fish.vy = 0;
  fish.angle = angle + Math.PI / 2;
  fish.isOnContourRide = true;

  const stars = current?.echostory?.stars || [];
  const hitStar = stars.find((star) => {
    if (!star || star.previewPlayed || star.previewPlaying) return false;
    const starRadius = Number.isFinite(star.r) ? star.r : 18;
    const touchRadius = Math.max(CONTOUR_RIDE_STAR_TRIGGER_RADIUS, starRadius * 3.2);
    return Math.hypot((star.x || 0) - fish.x, (star.y || 0) - fish.y) <= touchRadius;
  });

  if (hitStar) {
    const triggered = triggerEchostoryStarPreview(hitStar, {
      fishX: fish.x,
      colorOrdinal: getEchostoryStarOrdinal(stars, hitStar),
    });
    if (triggered) {
      ride.pausedAt = now;
      ride.pausedStarId = hitStar.id || null;
      fish.targetX = fish.x;
      fish.targetY = fish.y;
      fish.vx = 0;
      fish.vy = 0;
      return;
    }
  }

  if (progress >= 1) {
    const endRadius = getContourSnapRadius(current, ride.baseAngle);
    fish.x = Math.cos(ride.baseAngle) * endRadius;
    fish.y = Math.sin(ride.baseAngle) * endRadius;
    fish.targetX = fish.x;
    fish.targetY = fish.y;
    fish.vx = 0;
    fish.vy = 0;
    fish.angle = 0;
    fish.isOnContourRide = false;
    current.contourRide = null;
    current.zenithStar = {
      ...(current.zenithStar || {}),
      x: beacon.x,
      y: beacon.y,
      radius: CONTOUR_RIDE_ENTRY_THRESHOLD,
      armed: false,
      hitAt: now,
    };
  }
}


function getEchostoryStarColorIndex(star) {
  const phaseIndex = Math.floor(Number(star?.phaseIndex));
  if (Number.isFinite(phaseIndex)) return Math.max(0, Math.min(2, phaseIndex));
  const color = String(star?.color || "").toLowerCase();
  if (color === "#ff9f40") return 1;
  if (color === "#51d37c") return 2;
  return 0;
}

function getEchostoryStarColorKey(star) {
  return `color-${getEchostoryStarColorIndex(star)}`;
}

function getEchostorySampleUrlCandidates(star, colorOrdinal = 0) {
  const colorIndex = getEchostoryStarColorIndex(star);
  return [getSooncutSampleUrlByColor(colorIndex, colorOrdinal)];
}

async function playHtmlAudioFallback(url, volume = 0.85) {
  if (typeof Audio === "undefined") return false;
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.volume = Math.max(0.05, Math.min(1, volume));
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.oncanplaythrough = null;
    };
    audio.onended = () => {
      cleanup();
      resolve(true);
    };
    audio.onerror = () => {
      cleanup();
      resolve(false);
    };
    audio.oncanplaythrough = async () => {
      try {
        await audio.play();
      } catch {
        cleanup();
        resolve(false);
      }
    };
    audio.load();
  });
}

let activeEchostoryStarAudioId = null;

export async function playEchostoryStarPreview(star, fishX = 0, colorOrdinal = 0) {
  if (!star) return false;
  const pan = Math.max(-0.85, Math.min(0.85, fishX / 420));
  const candidates = getEchostorySampleUrlCandidates(star, colorOrdinal);
  for (const url of candidates) {
    try {
      await playOneShotFile(url, { volume: 0.78, pan });
      return true;
    } catch {
      // continue
    }
  }

  for (const url of candidates) {
    const played = await playHtmlAudioFallback(url, 0.92);
    if (played) return true;
  }

  console.warn("[Soon][echostory] mp3 étoile introuvable ou illisible", {
    starId: star.id,
    candidates,
  });
  return false;
}

export function triggerEchostoryStarPreview(star, { fishX = 0, colorOrdinal = 0 } = {}) {
  if (!star || star.previewPlaying || star.previewPlayed || activeEchostoryStarAudioId) return false;
  activeEchostoryStarAudioId = star.id || `${getEchostoryStarColorKey(star)}-${colorOrdinal + 1}`;
  star.previewPlaying = true;
  star.previewStartedAt = Date.now();
  playEchostoryStarPreview(star, fishX, colorOrdinal).finally(() => {
    star.previewPlaying = false;
    star.previewStartedAt = 0;
    star.previewPlayed = true;
    activeEchostoryStarAudioId = null;
  });
  return true;
}


function getEchostoryStarOrdinal(stars = [], targetStar = null) {
  const key = getEchostoryStarColorKey(targetStar);
  let ordinal = 0;
  for (const star of stars) {
    if (!star) continue;
    const currentKey = getEchostoryStarColorKey(star);
    if (star === targetStar || (targetStar?.id && star.id === targetStar.id)) {
      return currentKey === key ? ordinal : 0;
    }
    if (currentKey === key) ordinal += 1;
  }
  return 0;
}

export function makeEchostoryStarBreathe(current = {}, starId, direction = "inspire") {
  const stars = current?.echostory?.stars || [];
  const star = stars.find((item) => item?.id === starId);
  if (!star || star.expired) return false;
  const angle = Number.isFinite(star.contourAngle) ? star.contourAngle : Math.atan2(star.y || 0, star.x || 0);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  star.pendingBreathChoice = false;
  star.breathMenuOpenedAt = 0;
  star.selectedOnContour = false;

  if (direction === "expire") {
    star.attachedToContour = false;
    star.expiring = true;
    star.networkId = null;
    star.vx = ux * STAR_EXHALE_IMPULSE;
    star.vy = uy * STAR_EXHALE_IMPULSE;
    return true;
  }

  const contourRadius = getContourSnapRadius(current, angle);
  star.attachedToContour = false;
  star.expiring = false;
  star.x = ux * Math.max(40, contourRadius - 128);
  star.y = uy * Math.max(40, contourRadius - 128);
  star.vx = -ux * STAR_INHALE_IMPULSE;
  star.vy = -uy * STAR_INHALE_IMPULSE;
  return true;
}

function getActiveConstellationStars(stars = []) {
  return stars.filter((star) => star && !star.expired && !star.expiring && !star.attachedToContour);
}

function getConstellationLinks(echostory = {}) {
  const normalized = normalizeEchostoryNetwork(echostory);
  echostory.links = normalized.links;
  echostory.constellationLinks = normalized.links;
  echostory.coreConnectedStarIds = normalized.coreConnectedStarIds;
  return echostory.links;
}

function getMusicCoreNode() {
  return { id: ECHOSTORY_MUSIC_CORE_ID, x: 0, y: 0, r: MUSIC_CORE_TOUCH_RADIUS * 0.5 };
}

function isMusicCoreLink(link) {
  return link?.from === ECHOSTORY_MUSIC_CORE_ID || link?.to === ECHOSTORY_MUSIC_CORE_ID;
}

function linkKey(from, to) {
  return makeLinkId(from, to);
}

function addConstellationLink(echostory, fromStar, toStar, options = {}) {
  if (!fromStar?.id || !toStar?.id || fromStar.id === toStar.id) return;
  const links = getConstellationLinks(echostory);
  const [from, to] = [fromStar.id, toStar.id].sort();
  if (links.some((link) => linkKey(link?.from, link?.to) === linkKey(from, to))) return;
  const measuredLength = Math.hypot((toStar.x || 0) - (fromStar.x || 0), (toStar.y || 0) - (fromStar.y || 0));
  links.push({
    from,
    to,
    restLength: Number.isFinite(options.restLength)
      ? options.restLength
      : Math.max(STAR_NETWORK_BRANCH_REST_LENGTH, measuredLength),
    kind: options.kind || (from === ECHOSTORY_MUSIC_CORE_ID || to === ECHOSTORY_MUSIC_CORE_ID ? "music-core" : "branch"),
    createdAt: Date.now(),
  });
}

function removeLinksForStars(echostory, starIds = new Set()) {
  if (!starIds.size) return;
  const nextLinks = getEchostoryLinks(echostory).filter(
    (link) => !starIds.has(link?.from) && !starIds.has(link?.to)
  );
  const normalized = normalizeEchostoryNetwork({ ...echostory, links: nextLinks, constellationLinks: nextLinks });
  Object.assign(echostory, normalized);
}

function wasRecentlyPushedBySoon(star, now = performance.now()) {
  return Number.isFinite(star?.lastPushedBySoonAt) && now - star.lastPushedBySoonAt <= STAR_NETWORK_PUSH_MEMORY_MS;
}

function pruneOverstretchedConstellationLinks(echostory, starById, now = performance.now()) {
  const links = getConstellationLinks(echostory);
  if (!links.length) return;
  echostory.links = links.filter((link) => {
    const from = starById.get(link?.from);
    const to = starById.get(link?.to);
    if (!from || !to) return false;
    const pushedEndpoint = [from, to].some((star) => star.id !== ECHOSTORY_MUSIC_CORE_ID && wasRecentlyPushedBySoon(star, now));
    if (!pushedEndpoint) return true;

    const dx = (to.x || 0) - (from.x || 0);
    const dy = (to.y || 0) - (from.y || 0);
    const distance = Math.hypot(dx, dy);
    const rest = Number.isFinite(link.restLength) ? link.restLength : STAR_NETWORK_LINK_DISTANCE;
    const ruptureDistance = Math.max(
      rest * STAR_NETWORK_RUPTURE_STRETCH,
      rest + STAR_NETWORK_RUPTURE_EXTRA_DISTANCE
    );
    return distance <= ruptureDistance;
  });
}

function getMusicConnectedStarIds(links = []) {
  const component = getLinkedComponent(ECHOSTORY_MUSIC_CORE_ID, links);
  component.delete(ECHOSTORY_MUSIC_CORE_ID);
  return component;
}

function applyVelocity(star, vx, vy) {
  if (!star || star.id === ECHOSTORY_MUSIC_CORE_ID || star.draggingByTouch) return;
  star.vx = (star.vx || 0) + vx;
  star.vy = (star.vy || 0) + vy;
}

function applyConstellationSpacing(starById, links = []) {
  const connectedIds = [...getMusicConnectedStarIds(links)];
  const connectedStars = connectedIds.map((id) => starById.get(id)).filter(Boolean);
  const musicCore = starById.get(ECHOSTORY_MUSIC_CORE_ID);

  if (musicCore) {
    connectedStars.forEach((star, index) => {
      let dx = (star.x || 0) - musicCore.x;
      let dy = (star.y || 0) - musicCore.y;
      let distance = Math.hypot(dx, dy);
      if (distance <= 0.001) {
        const fallbackAngle = ((index * 137.5) % 360) * (Math.PI / 180);
        dx = Math.cos(fallbackAngle);
        dy = Math.sin(fallbackAngle);
        distance = 1;
      }
      if (distance >= MUSIC_CORE_MIN_SEPARATION) return;
      const push = (MUSIC_CORE_MIN_SEPARATION - distance) * STAR_NETWORK_SPACING_FORCE;
      applyVelocity(star, (dx / distance) * push, (dy / distance) * push);
    });
  }

  for (let i = 0; i < connectedStars.length; i += 1) {
    const a = connectedStars[i];
    for (let j = i + 1; j < connectedStars.length; j += 1) {
      const b = connectedStars[j];
      const dx = (b.x || 0) - (a.x || 0);
      const dy = (b.y || 0) - (a.y || 0);
      const distance = Math.hypot(dx, dy);
      if (distance <= 0.001 || distance >= STAR_NETWORK_MIN_SEPARATION) continue;
      const push = (STAR_NETWORK_MIN_SEPARATION - distance) * STAR_NETWORK_SPACING_FORCE * 0.5;
      const ux = dx / distance;
      const uy = dy / distance;
      applyVelocity(a, -ux * push, -uy * push);
      applyVelocity(b, ux * push, uy * push);
    }
  }
}

function getLinkedComponent(starId, links = []) {
  const visited = new Set();
  const queue = [starId];
  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    links.forEach((link) => {
      if (link?.from === currentId && !visited.has(link?.to)) queue.push(link.to);
      if (link?.to === currentId && !visited.has(link?.from)) queue.push(link.from);
    });
  }
  return visited;
}

function updateEchostoryConstellations(current, now = performance.now()) {
  const echostory = current?.echostory;
  const stars = echostory?.stars || [];
  if (!echostory || !stars.length) return;

  const musicCore = getMusicCoreNode();

  const starById = new Map(stars.map((star) => [star?.id, star]).filter(([id]) => id));
  starById.set(ECHOSTORY_MUSIC_CORE_ID, musicCore);
  const links = getConstellationLinks(echostory);
  echostory.links = links.filter((link) => {
    const from = starById.get(link?.from);
    const to = starById.get(link?.to);
    if (!from || !to) return false;
    if (isMusicCoreLink(link)) {
      const star = link.from === ECHOSTORY_MUSIC_CORE_ID ? to : from;
      return !star.expired && !star.expiring && !star.attachedToContour;
    }
    return !from.expired && !to.expired && !from.expiring && !to.expiring && !from.attachedToContour && !to.attachedToContour;
  });
  Object.assign(echostory, normalizeEchostoryNetwork(echostory));

  pruneOverstretchedConstellationLinks(echostory, starById, now);
  Object.assign(echostory, normalizeEchostoryNetwork(echostory));
  applyConstellationSpacing(starById, echostory.links);

  echostory.links.forEach((link) => {
    const from = starById.get(link.from);
    const to = starById.get(link.to);
    if (!from || !to) return;
    const dx = (to.x || 0) - (from.x || 0);
    const dy = (to.y || 0) - (from.y || 0);
    const distance = Math.hypot(dx, dy);
    if (distance < 0.001) return;
    const rest = Number.isFinite(link.restLength) ? link.restLength : STAR_NETWORK_LINK_DISTANCE;
    const stiffness = isMusicCoreLink(link) ? STAR_NETWORK_LINK_STIFFNESS * MUSIC_CORE_LINK_STIFFNESS_MULTIPLIER : STAR_NETWORK_LINK_STIFFNESS;
    const pull = (distance - rest) * stiffness;
    const ux = dx / distance;
    const uy = dy / distance;
    if (from.id !== ECHOSTORY_MUSIC_CORE_ID && !from.draggingByTouch) {
      from.vx = (from.vx || 0) + ux * pull;
      from.vy = (from.vy || 0) + uy * pull;
    }
    if (to.id !== ECHOSTORY_MUSIC_CORE_ID && !to.draggingByTouch) {
      to.vx = (to.vx || 0) - ux * pull;
      to.vy = (to.vy || 0) - uy * pull;
    }
  });

  const arenaRadius = Number.isFinite(current?.arenaRadius) ? current.arenaRadius : 1200;
  const contourSnapThreshold = Math.max(24, arenaRadius - STAR_NETWORK_BREAK_THRESHOLD);
  const brokenIds = new Set();
  echostory.links.forEach((link) => {
    if (brokenIds.has(link.from) || brokenIds.has(link.to)) return;
    const from = starById.get(link.from);
    const to = starById.get(link.to);
    if (!from || !to) return;
    const linkedStars = [from, to].filter((star) => star.id !== ECHOSTORY_MUSIC_CORE_ID);
    if (linkedStars.some((star) => star.draggingByTouch)) return;
    const touchesContour = linkedStars.some((star) => Math.hypot(star.x || 0, star.y || 0) >= contourSnapThreshold);
    if (!touchesContour) return;
    const componentIds = getLinkedComponent(link.from, echostory.constellationLinks);
    componentIds.forEach((id) => brokenIds.add(id));
  });

  if (brokenIds.size) {
    brokenIds.forEach((id) => {
      const star = starById.get(id);
      if (!star) return;
      const angle = Math.atan2(star.y || 0, star.x || 0);
      const contourRadius = getContourSnapRadius(current, angle);
      star.attachedToContour = true;
      star.contourAngle = angle;
      star.x = Math.cos(angle) * contourRadius;
      star.y = Math.sin(angle) * contourRadius;
      star.vx = 0;
      star.vy = 0;
      star.pendingBreathChoice = false;
    });
    removeLinksForStars(echostory, brokenIds);
  }
}

export function pushNearbyEchostoryStars(current, now = performance.now()) {
  if (current?.mode !== "echostory" && current?.mode !== "reso") return;
  if (current?.echostory?.echostoryPlayback?.active) return;
  if (current?.contourRide?.active) return;
  if (!current?.fish) return;
  const soonCanCollide = current.fish.visible === true;
  const fishX = Number.isFinite(current.fish.x) ? current.fish.x : 0;
  const fishY = Number.isFinite(current.fish.y) ? current.fish.y : 0;
  const TRIGGER_RADIUS = 84;
  const arenaRadius = Number.isFinite(current?.arenaRadius) ? current.arenaRadius : 1200;
  const contourSnapThreshold = Math.max(24, arenaRadius - STAR_EDGE_STICK_THRESHOLD);
  const contourReleaseThreshold = Math.max(32, arenaRadius - STAR_EDGE_STICK_RELEASE);

  const stars = current?.echostory?.stars || [];
  const colorCounts = new Map();
  const colorOrdinalsByStarId = new Map();
  stars.forEach((star) => {
    if (!star) return;
    const key = getEchostoryStarColorKey(star);
    const ordinal = colorCounts.get(key) || 0;
    colorOrdinalsByStarId.set(star.id || `${key}-${ordinal}`, ordinal);
    colorCounts.set(key, ordinal + 1);
  });

  stars.forEach((star) => {
    if (!star || star.expired) return;
    if (!Number.isFinite(star.vx)) star.vx = 0;
    if (!Number.isFinite(star.vy)) star.vy = 0;
    if (star.draggingByTouch) {
      star.vx = 0;
      star.vy = 0;
      star.pendingBreathChoice = false;
      return;
    }
    const dx = (star.x || 0) - fishX;
    const dy = (star.y || 0) - fishY;
    const distance = Math.hypot(dx, dy);
    const isInside = distance < TRIGGER_RADIUS;

    if (soonCanCollide && SOON_STAR_CONTACT_ENABLED && isInside) {
      if (star.attachedToContour) {
        const lastOpenedAt = Number.isFinite(star.breathMenuOpenedAt) ? star.breathMenuOpenedAt : 0;
        if (!star.pendingBreathChoice && now - lastOpenedAt > STAR_BREATH_MENU_COOLDOWN_MS) {
          star.pendingBreathChoice = true;
          star.breathMenuOpenedAt = now;
        }
      } else if (distance > 0) {
        const ux = dx / distance;
        const uy = dy / distance;
        const pushForce = (1 - distance / TRIGGER_RADIUS) * CONTACT_PUSH_DISTANCE * SOON_CONTACT_REBOUND_MULTIPLIER;
        star.vx += ux * pushForce * STAR_PUSH_SMOOTHING;
        star.vy += uy * pushForce * STAR_PUSH_SMOOTHING;
        star.lastPushedBySoonAt = now;
      }
    }
    const step = Math.hypot(star.vx || 0, star.vy || 0);
    if (step > STAR_PUSH_MAX_STEP && step > 0) {
      const ratio = STAR_PUSH_MAX_STEP / step;
      star.vx *= ratio;
      star.vy *= ratio;
    }
    star.x = (star.x || 0) + (star.vx || 0);
    star.y = (star.y || 0) + (star.vy || 0);
    star.vx *= star.expiring ? 0.992 : STAR_NETWORK_DAMPING;
    star.vy *= star.expiring ? 0.992 : STAR_NETWORK_DAMPING;

    const distCenter = Math.hypot(star.x || 0, star.y || 0);
    if (star.expiring) {
      if (distCenter > arenaRadius + 180) star.expired = true;
      return;
    }

    if (!star.attachedToContour && getEchostoryLinks(current?.echostory).some((link) => link?.from === star.id || link?.to === star.id)) {
      return;
    }

    if (!star.attachedToContour && distCenter >= contourSnapThreshold) {
      const angle = Math.atan2(star.y || 0, star.x || 0);
      const contourRadius = getContourSnapRadius(current, angle);
      star.attachedToContour = true;
      star.contourAngle = angle;
      star.x = Math.cos(angle) * contourRadius;
      star.y = Math.sin(angle) * contourRadius;
      star.vx *= 0.18;
      star.vy *= 0.18;
      star.pendingBreathChoice = false;
    } else if (star.attachedToContour && distCenter >= contourReleaseThreshold) {
      const angle = Number.isFinite(star.contourAngle) ? star.contourAngle : Math.atan2(star.y || 0, star.x || 0);
      const contourRadius = getContourSnapRadius(current, angle);
      star.contourAngle = angle;
      star.x = Math.cos(angle) * contourRadius;
      star.y = Math.sin(angle) * contourRadius;
      star.vx *= 0.92;
      star.vy *= 0.92;
    } else if (star.attachedToContour) {
      const angle = Number.isFinite(star.contourAngle) ? star.contourAngle : Math.atan2(star.y || 0, star.x || 0);
      const contourRadius = getContourSnapRadius(current, angle);
      star.contourAngle = angle;
      star.x = Math.cos(angle) * contourRadius;
      star.y = Math.sin(angle) * contourRadius;
      star.vx *= 0.92;
      star.vy *= 0.92;
    }
  });

  updateEchostoryConstellations(current, now);
}


export function useSoonCanvasLoop({
  canvasRef,
  cameraRef,
  arenaRef,
  stateRef,
  activeBubbleAudioRef,
  onTickFish,
  onSemioseVideoTrigger,
}) {
  useEffect(() => {
    let frame = 0;
    let wasEditMode = false;
    let wasContourRideActive = false;
    const postFxCanvas = document.createElement("canvas");
    const postFxCtx = postFxCanvas.getContext("2d");
    const CAMERA_FOLLOW_SMOOTHING = 0.22;
    const CAMERA_MAX_STEP_PER_FRAME = 42;
    function getArenaWorldCenter(current = {}) {
      const world = current.worldGraph;
      const arenaId = current.currentArenaId || world?.startArenaId;
      const node = (world?.nodes || []).find((item) => item.id === arenaId);
      const center = node?.absoluteCenter || { x: 0, y: 0 };
      return {
        x: Number.isFinite(center.x) ? center.x : 0,
        y: Number.isFinite(center.y) ? center.y : 0,
      };
    }

    function smoothFollowCameraToFish(fishWorld) {
      if (!fishWorld) return;
      const targetX = Number.isFinite(fishWorld.x) ? fishWorld.x : 0;
      const targetY = Number.isFinite(fishWorld.y) ? fishWorld.y : 0;
      const cam = cameraRef.current;
      const currentX = Number.isFinite(cam.x) ? cam.x : targetX;
      const currentY = Number.isFinite(cam.y) ? cam.y : targetY;
      const dx = (targetX - currentX) * CAMERA_FOLLOW_SMOOTHING;
      const dy = (targetY - currentY) * CAMERA_FOLLOW_SMOOTHING;
      const step = Math.hypot(dx, dy);
      if (step > CAMERA_MAX_STEP_PER_FRAME && step > 0) {
        const ratio = CAMERA_MAX_STEP_PER_FRAME / step;
        cam.x = currentX + dx * ratio;
        cam.y = currentY + dy * ratio;
        return;
      }
      cam.x = currentX + dx;
      cam.y = currentY + dy;
    }

    function loop() {
      const canvas = canvasRef.current;

      if (!canvas) {
        frame = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        frame = requestAnimationFrame(loop);
        return;
      }

      const rect = resizeCanvas(canvas, ctx);
      const current = stateRef.current || {};
      const isEditMode = current.interactionMode === "edit";

      updateArena(arenaRef, rect);
      const runtimeRadius = arenaRef.current.radius;
      // Important: pas de changement d'échelle caméra/monde entre niveaux.
      // On garde un rayon runtime constant pour éviter tout effet de dezoom.
      arenaRef.current.radius = runtimeRadius;
      stateRef.current = {
        ...(stateRef.current || {}),
        arenaRadius: runtimeRadius,
      };

      if (current.mode === "reso" || current.mode === "echostory") {
        cameraRef.current.zoom = 1;
      } else if (isEditMode) {
        if (!wasEditMode) {
          resetEditCamera(cameraRef, rect, arenaRef.current.radius);
        }
        clampEditCamera(cameraRef, rect, arenaRef.current.radius);
      } else {
        cameraRef.current.zoom = 1;
      }

      wasEditMode = isEditMode;

      updateCharacters({
        fish: isEditMode ? null : current.fish,
        arenaRadius: arenaRef.current.radius,
      });

      const worldFx = getCharacterWorldEffects();

      if (!isEditMode) {
        onTickFish?.({ arenaRadius: arenaRef.current.radius });
      }

      const next = stateRef.current || {};
      updateContourRide(next, arenaRef.current.radius, performance.now());
      pushNearbyEchostoryStars(next);
      const isContourRideActive = Boolean(next?.contourRide?.active);
      if (isContourRideActive !== wasContourRideActive) {
        wasContourRideActive = isContourRideActive;
        setContourMusicLoopActive(isContourRideActive).catch((error) => {
          console.warn("Impossible de synchroniser la piste musicale du contour", error);
        });
      }
      const fishDepth = Math.round(next?.fish?.depth || 1);
      (next?.bubbles || []).forEach((bubble) => {
        const d = Math.hypot((bubble.x || 0) - (next?.fish?.x || 0), (bubble.y || 0) - (next?.fish?.y || 0));
        if (!isContourRideActive && d < 62 && Math.abs(Math.round(bubble.depth || 1) - fishDepth) <= 1) {
          if (d > 0) {
            const ux = ((bubble.x || 0) - (next?.fish?.x || 0)) / d;
            const uy = ((bubble.y || 0) - (next?.fish?.y || 0)) / d;
            if (bubble.attachedToContour) {
              bubble.attachedToContour = false;
              bubble.x = (bubble.x || 0) - ux * CONTACT_PUSH_DISTANCE * 2.4;
              bubble.y = (bubble.y || 0) - uy * CONTACT_PUSH_DISTANCE * 2.4;
            } else {
              bubble.x = (bubble.x || 0) + ux * CONTACT_PUSH_DISTANCE;
              bubble.y = (bubble.y || 0) + uy * CONTACT_PUSH_DISTANCE;
            }
          }
        }
        const distCenter = Math.hypot(bubble.x || 0, bubble.y || 0);
        const arenaRadius = Number.isFinite(next?.arenaRadius) ? next.arenaRadius : 1200;
        const contourSnapThreshold = Math.max(24, arenaRadius - 108);
        if (distCenter >= contourSnapThreshold) {
          const angle = Math.atan2(bubble.y || 0, bubble.x || 0);
          const contourRadius = getContourSnapRadius(next, angle);
          bubble.attachedToContour = true;
          bubble.contourAngle = angle;
          bubble.x = Math.cos(angle) * contourRadius;
          bubble.y = Math.sin(angle) * contourRadius;
        } else if (bubble.attachedToContour) {
          const angle = Number.isFinite(bubble.contourAngle) ? bubble.contourAngle : Math.atan2(bubble.y || 0, bubble.x || 0);
          const contourRadius = getContourSnapRadius(next, angle);
          bubble.contourAngle = angle;
          bubble.x = Math.cos(angle) * contourRadius;
          bubble.y = Math.sin(angle) * contourRadius;
        }
      });
      const nextFish = next.fish || null;
      const arenaCenter = getArenaWorldCenter(next);
      const fishWorld = nextFish
        ? {
            x: arenaCenter.x + (Number.isFinite(nextFish.x) ? nextFish.x : 0),
            y: arenaCenter.y + (Number.isFinite(nextFish.y) ? nextFish.y : 0),
          }
        : null;
      if (!isEditMode) {
        smoothFollowCameraToFish(fishWorld);
      }

      if (!isEditMode) {
        updateBubbleAudioTriggers(next, activeBubbleAudioRef);
        updateBubbleSpatialMix(next.fish || null, next.bubbles || []);
      }

      updateEcosystemFx({
        fish: isEditMode ? null : next.fish,
        bubbles: next.bubbles || [],
        mode: next.mode,
      });

      const audioSnapshot = getAudioAnalysisSnapshot();
      next.audioReactive = updateAudioreactiveVisualState({
        previous: next.audioReactive,
        audio: audioSnapshot,
        current: next,
        arenaRadius: arenaRef.current.radius,
        rect,
        dpr: window.devicePixelRatio || 1,
        now: performance.now(),
      });

      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      try {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        resetCanvasPaintState(ctx);

        drawScene(ctx, rect, performance.now(), {
          stateRef,
          arenaRef,
          cameraRef,
          enterWorld,
          exitWorld,
        });
      } finally {
        ctx.restore();
      }

      const shouldApplyWorldBlur = worldFx.blur > 0.1 && next.mode !== "echostory";
      if (shouldApplyWorldBlur) {
        if (postFxCtx) {
          if (postFxCanvas.width !== canvas.width || postFxCanvas.height !== canvas.height) {
            postFxCanvas.width = canvas.width;
            postFxCanvas.height = canvas.height;
          }
          postFxCtx.setTransform(1, 0, 0, 1, 0, 0);
          postFxCtx.globalCompositeOperation = "copy";
          postFxCtx.filter = "none";
          postFxCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
          postFxCtx.globalCompositeOperation = "source-over";

          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 0.98;
          ctx.filter = `blur(${worldFx.blur}px)`;
          ctx.drawImage(postFxCanvas, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";
          ctx.restore();
        }
      }


      if (worldFx.tornado?.active) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";

        const maxTextWidth = canvas.width * 0.86;
        const fontSize = Math.max(18, Math.floor(canvas.height * 0.032));
        const lineHeight = Math.floor(fontSize * 1.28);

        ctx.font = `600 ${fontSize}px "Inter", "Segoe UI", sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.42)";
        ctx.shadowBlur = 10;

        ctx.fillText(
          "Le silence des yeux",
          canvas.width * 0.5,
          canvas.height * 0.5 - lineHeight * 0.5,
          maxTextWidth
        );
        ctx.fillText(
          "ouvre tes écoutilles !",
          canvas.width * 0.5,
          canvas.height * 0.5 + lineHeight * 0.5,
          maxTextWidth
        );
        ctx.restore();
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resetCanvasPaintState(ctx);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(10, 10, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      frame = requestAnimationFrame(loop);
    }

    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, [
    canvasRef,
    cameraRef,
    arenaRef,
    stateRef,
    activeBubbleAudioRef,
    onTickFish,
    onSemioseVideoTrigger,
  ]);
}
