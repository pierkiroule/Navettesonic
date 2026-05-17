const ROSE_FISH_COUNT = 14;
const FOLLOW_DURATION_MS = 30_000;
const FOLLOW_TRIGGER_DISTANCE = 190;
const ROSE_MIN_ORBIT = 0.28;
const ROSE_MAX_ORBIT = 0.72;

function randSeed(index, salt = 1) {
  const n = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampToRadius(x, y, radius) {
  const d = Math.hypot(x, y);
  if (!Number.isFinite(d) || d <= radius) return { x, y };
  const s = radius / Math.max(0.0001, d);
  return { x: x * s, y: y * s };
}

function normalizeRoseFish(item = {}, index = 0, arenaRadius = 1200) {
  const orbit = clamp(Number.isFinite(item.orbit) ? item.orbit : (ROSE_MIN_ORBIT + randSeed(index, 2) * (ROSE_MAX_ORBIT - ROSE_MIN_ORBIT)), ROSE_MIN_ORBIT, ROSE_MAX_ORBIT);
  const angle = Number.isFinite(item.angle) ? item.angle : randSeed(index, 3) * Math.PI * 2;
  const radius = arenaRadius * orbit;
  const baseX = Number.isFinite(item.x) ? item.x : Math.cos(angle) * radius;
  const baseY = Number.isFinite(item.y) ? item.y : Math.sin(angle) * radius;
  return {
    id: item.id || `rose-${index + 1}`,
    orbit,
    angle,
    phase: Number.isFinite(item.phase) ? item.phase : randSeed(index, 4) * Math.PI * 2,
    speed: Number.isFinite(item.speed) ? item.speed : 0.006 + randSeed(index, 5) * 0.005,
    followUntil: Number.isFinite(item.followUntil) ? item.followUntil : 0,
    x: baseX,
    y: baseY,
    vx: Number.isFinite(item.vx) ? item.vx : 0,
    vy: Number.isFinite(item.vy) ? item.vy : 0,
  };
}

export function createRoseFishSchool(arenaRadius = 1200) {
  return Array.from({ length: ROSE_FISH_COUNT }, (_, index) => normalizeRoseFish({}, index, arenaRadius));
}

export function tickRoseFishSchool({ roseFish = [], fish, arenaRadius = 1200, now = Date.now() }) {
  if (!fish) return Array.isArray(roseFish) && roseFish.length ? roseFish : createRoseFishSchool(arenaRadius);

  const safeRadius = Math.max(220, Number.isFinite(arenaRadius) ? arenaRadius : 1200);
  const school = Array.isArray(roseFish) && roseFish.length
    ? roseFish.map((item, index) => normalizeRoseFish(item, index, safeRadius))
    : createRoseFishSchool(safeRadius);

  return school.map((item, index) => {
    const nextAngle = item.angle + item.speed;
    const orbitPulse = Math.sin(now * 0.00035 + item.phase + index * 0.4) * 0.08;
    const orbitRadius = safeRadius * clamp(item.orbit + orbitPulse, ROSE_MIN_ORBIT, ROSE_MAX_ORBIT);

    const anchorX = Math.cos(nextAngle + item.phase * 0.15) * orbitRadius;
    const anchorY = Math.sin(nextAngle + item.phase * 0.15) * orbitRadius;

    const dxFish = (fish.x || 0) - (item.x || 0);
    const dyFish = (fish.y || 0) - (item.y || 0);
    const nearFish = Math.hypot(dxFish, dyFish) <= FOLLOW_TRIGGER_DISTANCE;
    const followUntil = nearFish ? now + FOLLOW_DURATION_MS : item.followUntil;
    const isFollowing = followUntil > now;

    const targetX = isFollowing ? (fish.x || 0) + Math.cos(nextAngle * 1.9 + index) * 80 : anchorX;
    const targetY = isFollowing ? (fish.y || 0) + Math.sin(nextAngle * 1.7 + index) * 54 : anchorY;

    const vx = item.vx * 0.84 + (targetX - item.x) * 0.04;
    const vy = item.vy * 0.84 + (targetY - item.y) * 0.04;
    const unclampedX = item.x + vx;
    const unclampedY = item.y + vy;
    const bounded = clampToRadius(unclampedX, unclampedY, safeRadius * 0.86);

    return {
      ...item,
      angle: nextAngle,
      followUntil,
      vx: bounded.x !== unclampedX ? vx * 0.45 : vx,
      vy: bounded.y !== unclampedY ? vy * 0.45 : vy,
      x: bounded.x,
      y: bounded.y,
    };
  });
}
