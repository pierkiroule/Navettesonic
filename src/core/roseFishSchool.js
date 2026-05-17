const ROSE_FISH_COUNT = 12;
const FOLLOW_DURATION_MS = 30_000;
const FOLLOW_TRIGGER_DISTANCE = 145;

function levelByIndex(index = 0) {
  return (Math.abs(index) % 2) + 1;
}

export function createRoseFishSchool() {
  return Array.from({ length: ROSE_FISH_COUNT }, (_, index) => ({
    id: `rose-${index + 1}`,
    angle: (Math.PI * 2 * index) / ROSE_FISH_COUNT,
    orbit: 0.2 + (index % 4) * 0.17,
    level: levelByIndex(index),
    spawnRadiusFactor: 0.55 + (index % 5) * 0.08,
    phase: index * 1.37,
    speed: 0.00065 + (index % 3) * 0.00021,
    followUntil: 0,
    x: Math.cos((Math.PI * 2 * index) / ROSE_FISH_COUNT) * (1200 * (0.55 + (index % 5) * 0.08)),
    y: Math.sin((Math.PI * 2 * index) / ROSE_FISH_COUNT) * (1200 * (0.55 + (index % 5) * 0.08)),
    vx: 0,
    vy: 0,
  }));
}

export function tickRoseFishSchool({ roseFish = [], fish, arenaRadius = 1200, now = Date.now() }) {
  if (!Array.isArray(roseFish) || !roseFish.length || !fish) return roseFish;
  const safeRadius = Math.max(220, Number.isFinite(arenaRadius) ? arenaRadius : 1200);

  return roseFish.map((item, index) => {
    const currentLevel = Number.isFinite(item.level) ? item.level : levelByIndex(index);
    const travelBit = Math.floor((now * (0.00003 + index * 0.0000017)) % 2);
    const nextLevel = travelBit === 0 ? currentLevel : (currentLevel === 1 ? 2 : 1);
    const targetRadius = safeRadius * (nextLevel === 1 ? 0.72 : 1.03) * (0.45 + (item.orbit || item.spawnRadiusFactor || 0.2));
    const nextAngle = (item.angle || 0) + (item.speed || 0.0008) * 16;

    const anchorX = Math.cos(nextAngle + (item.phase || 0)) * targetRadius;
    const anchorY = Math.sin(nextAngle + (item.phase || 0)) * targetRadius;

    const dxFish = (fish.x || 0) - (item.x || 0);
    const dyFish = (fish.y || 0) - (item.y || 0);
    const nearFish = Math.hypot(dxFish, dyFish) <= FOLLOW_TRIGGER_DISTANCE;
    const followUntil = nearFish ? now + FOLLOW_DURATION_MS : (item.followUntil || 0);
    const isFollowing = followUntil > now;

    const targetX = isFollowing ? (fish.x || 0) + Math.cos(nextAngle * 2 + index) * 42 : anchorX;
    const targetY = isFollowing ? (fish.y || 0) + Math.sin(nextAngle * 2 + index) * 24 : anchorY;
    const vx = (item.vx || 0) * 0.86 + (targetX - (item.x || 0)) * 0.032;
    const vy = (item.vy || 0) * 0.86 + (targetY - (item.y || 0)) * 0.032;

    return {
      ...item,
      level: nextLevel,
      angle: nextAngle,
      followUntil,
      vx,
      vy,
      x: (item.x || 0) + vx,
      y: (item.y || 0) + vy,
    };
  });
}

