import { getArenaIdForLevel, getPortalOpeningAngle, getPortalOpeningHalfSpan } from "./labybulleWorld.js";

const FOLLOW_DURATION_MS = 30_000;
const FOLLOW_TRIGGER_DISTANCE = 180;
const LEVEL_COUNT = 3;

function seeded(index, salt = 1) {
  const n = Math.sin((index + 1) * 91.7 + salt * 37.1) * 43758.5453;
  return n - Math.floor(n);
}

function wrapAngle(a = 0) {
  let out = a;
  while (out > Math.PI) out -= Math.PI * 2;
  while (out < -Math.PI) out += Math.PI * 2;
  return out;
}

function angleDistance(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function levelRadius(level = 0, arenaRadius = 1200) {
  const safe = Math.max(300, arenaRadius);
  if (level <= 0) return safe * 0.28;
  if (level === 1) return safe * 0.5;
  return safe * 0.72;
}

function makeRoseFish({ index = 0, count = 10, center = { x: 0, y: 0 }, arenaLevel = 0 }) {
  const angle = (index / Math.max(1, count)) * Math.PI * 2;
  const radius = 120 + index * 18;
  return {
    id: `rose-${index + 1}`,
    x: (center.x || 0) + Math.cos(angle) * radius,
    y: (center.y || 0) + Math.sin(angle) * radius,
    vx: Math.cos(angle + Math.PI / 2) * 0.8,
    vy: Math.sin(angle + Math.PI / 2) * 0.8,
    size: 16 + seeded(index, 2) * 8,
    alpha: 0.95,
    arenaLevel,
    heading: angle,
    turnRate: (seeded(index, 3) - 0.5) * 0.06,
    speed: 0.8 + seeded(index, 4) * 1.6,
    followUntil: 0,
  };
}

export function createRoseFishSchool({ count = 10, center = { x: 0, y: 0 }, arenaLevel = 0 } = {}) {
  return Array.from({ length: Math.max(8, count) }, (_, index) =>
    makeRoseFish({ index, count: Math.max(8, count), center, arenaLevel: (arenaLevel + index) % LEVEL_COUNT })
  );
}

function canTransitLevel({ level, radialDistance, radialAngle, radialDot, arenaRadius, worldGraph }) {
  const currentR = levelRadius(level, arenaRadius);
  const halfSpan = getPortalOpeningHalfSpan({ radius: currentR });

  if (level < LEVEL_COUNT - 1) {
    const outAngle = getPortalOpeningAngle(worldGraph, getArenaIdForLevel(level), getArenaIdForLevel(level + 1));
    const nearOuter = Math.abs(radialDistance - (currentR + 120)) <= 45;
    if (outAngle !== null && nearOuter && radialDot > 0.06 && Math.abs(angleDistance(radialAngle, outAngle)) <= halfSpan) {
      return 1;
    }
  }

  if (level > 0) {
    const inAngle = getPortalOpeningAngle(worldGraph, getArenaIdForLevel(level), getArenaIdForLevel(level - 1));
    const nearInner = Math.abs(radialDistance - (currentR - 120)) <= 45;
    if (inAngle !== null && nearInner && radialDot < -0.06 && Math.abs(angleDistance(radialAngle, inAngle)) <= halfSpan) {
      return -1;
    }
  }

  return 0;
}

export function tickRoseFishSchool(roseFish = [], fish = {}, options = {}) {
  const now = options.now || Date.now();
  const arenaRadius = Number.isFinite(options.arenaRadius) ? options.arenaRadius : 1200;
  const worldGraph = options.worldGraph || fish?.worldGraph || null;
  const school = Array.isArray(roseFish) && roseFish.length
    ? roseFish
    : createRoseFishSchool({ count: 10, center: { x: 0, y: 0 }, arenaLevel: 0 });
  const levelCounts = school.reduce((acc, item) => {
    const lvl = Number.isFinite(item?.arenaLevel) ? item.arenaLevel : -1;
    if (lvl >= 0 && lvl < LEVEL_COUNT) acc[lvl] += 1;
    return acc;
  }, [0, 0, 0]);
  const missingLevels = [];
  for (let level = 0; level < LEVEL_COUNT; level += 1) {
    if (levelCounts[level] === 0) missingLevels.push(level);
  }
  const rebalancedSchool = missingLevels.length
    ? (() => {
      const next = school.slice();
      missingLevels.forEach((missingLevel) => {
        const donorLevel = levelCounts.findIndex((count) => count > 1);
        if (donorLevel < 0) return;
        const donorIndex = next.findIndex((item) => Number.isFinite(item?.arenaLevel) && item.arenaLevel === donorLevel);
        if (donorIndex < 0) return;
        next[donorIndex] = { ...next[donorIndex], arenaLevel: missingLevel };
        levelCounts[donorLevel] -= 1;
        levelCounts[missingLevel] += 1;
      });
      return next;
    })()
    : school;

  const fx = fish?.x || 0;
  const fy = fish?.y || 0;

  return rebalancedSchool.map((item, index) => {
    let level = Number.isFinite(item.arenaLevel) ? item.arenaLevel : (index % LEVEL_COUNT);
    const noiseTurn = (Math.sin(now * 0.0012 + index * 1.7) + (seeded(index, now * 0.0007) - 0.5)) * 0.02;
    const heading = wrapAngle((item.heading || 0) + (item.turnRate || 0) + noiseTurn);

    const swimSpeed = Math.max(0.3, item.speed || 1.1);
    let vx = Math.cos(heading) * swimSpeed;
    let vy = Math.sin(heading) * swimSpeed;

    const dFish = Math.hypot(fx - (item.x || 0), fy - (item.y || 0));
    const followUntil = dFish <= FOLLOW_TRIGGER_DISTANCE ? now + FOLLOW_DURATION_MS : (item.followUntil || 0);
    if (followUntil > now) {
      vx += ((fx - (item.x || 0)) / Math.max(30, dFish)) * 1.4;
      vy += ((fy - (item.y || 0)) / Math.max(30, dFish)) * 1.4;
    }

    let nx = (item.x || 0) + vx;
    let ny = (item.y || 0) + vy;

    const dist = Math.hypot(nx, ny);
    const radialAngle = Math.atan2(ny, nx);
    const radialDot = ((Math.cos(radialAngle) * vx) + (Math.sin(radialAngle) * vy)) / (Math.hypot(vx, vy) || 0.0001);

    const transit = canTransitLevel({ level, radialDistance: dist, radialAngle, radialDot, arenaRadius, worldGraph });
    if (transit !== 0) {
      level = Math.max(0, Math.min(LEVEL_COUNT - 1, level + transit));
      const targetBand = levelRadius(level, arenaRadius);
      nx = Math.cos(radialAngle) * targetBand;
      ny = Math.sin(radialAngle) * targetBand;
      vx *= 0.75;
      vy *= 0.75;
    }

    const band = levelRadius(level, arenaRadius);
    const nd = Math.hypot(nx, ny);
    const maxBand = band + 130;
    const minBand = Math.max(40, band - 130);
    if (nd > maxBand || nd < minBand) {
      const target = nd > maxBand ? maxBand : minBand;
      const sx = nx / Math.max(0.0001, nd);
      const sy = ny / Math.max(0.0001, nd);
      nx = sx * target;
      ny = sy * target;
      vx *= 0.6;
      vy *= 0.6;
    }

    return {
      ...item,
      x: nx,
      y: ny,
      vx,
      vy,
      heading,
      size: Math.max(14, Number(item.size) || 16),
      alpha: 0.95,
      arenaLevel: level,
      followUntil,
    };
  });
}
