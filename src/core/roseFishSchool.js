const ROSE_FISH_COUNT = 8;
const FOLLOW_DURATION_MS = 30_000;
const FOLLOW_TRIGGER_DISTANCE = 145;

function levelByIndex(index = 0) {
  return Math.abs(index) % 3;
}

export function createRoseFishSchool() {
  return Array.from({ length: ROSE_FISH_COUNT }, (_, index) => ({
    id: `rose-${index + 1}`,
    angle: (Math.PI * 2 * index) / ROSE_FISH_COUNT,
    orbit: 0.2 + (index % 4) * 0.17,
    level: levelByIndex(index),
    phase: index * 1.37,
    speed: 0.00065 + (index % 3) * 0.00021,
    followUntil: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  }));
}

export function tickRoseFishSchool({ roseFish = [], fish, arenaRadius = 1200, now = Date.now() }) {
  if (!Array.isArray(roseFish) || !roseFish.length || !fish) return roseFish;
  const safeRadius = Math.max(220, Number.isFinite(arenaRadius) ? arenaRadius : 1200);

  return roseFish.map((item, index) => {
    const currentLevel = Number.isFinite(item.level) ? item.level : levelByIndex(index);
    const levelCycle = Math.floor((now * (0.00002 + index * 0.0000013)) % 3);
    const nextLevel = (currentLevel + levelCycle) % 3;
    const targetRadius = safeRadius * (0.3 + nextLevel * 0.25) * (0.55 + (item.orbit || 0.2));
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

