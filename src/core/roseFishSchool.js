const ROSE_FISH_COUNT = 10;
const FOLLOW_DURATION_MS = 30_000;
const FOLLOW_TRIGGER_DISTANCE = 220;

function makeRoseFish(index) {
  const angle = (Math.PI * 2 * index) / ROSE_FISH_COUNT;
  const radius = 180 + (index % 4) * 38;
  return {
    id: `rose-${index + 1}`,
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    vx: 0,
    vy: 0,
    angle,
    orbitRadius: radius,
    phase: index * 0.9,
    speed: 0.015 + (index % 3) * 0.003,
    followUntil: 0,
  };
}

export function createRoseFishSchool() {
  return Array.from({ length: ROSE_FISH_COUNT }, (_, index) => makeRoseFish(index));
}

export function tickRoseFishSchool({ roseFish = [], fish, now = Date.now() }) {
  if (!fish) return Array.isArray(roseFish) && roseFish.length ? roseFish : createRoseFishSchool();

  const school = Array.isArray(roseFish) && roseFish.length
    ? roseFish
    : createRoseFishSchool(fish);

  return school.map((item, index) => {
    const nextAngle = (item.angle || 0) + (item.speed || 0.016);
    const orbit = item.orbitRadius || (180 + (index % 4) * 38);

    const anchorX = Math.cos(nextAngle + (item.phase || 0)) * orbit;
    const anchorY = Math.sin(nextAngle + (item.phase || 0)) * orbit;

    const dxFish = (fish.x || 0) - (item.x || 0);
    const dyFish = (fish.y || 0) - (item.y || 0);
    const nearFish = Math.hypot(dxFish, dyFish) <= FOLLOW_TRIGGER_DISTANCE;
    const followUntil = nearFish ? now + FOLLOW_DURATION_MS : (item.followUntil || 0);
    const isFollowing = followUntil > now;

    const targetX = isFollowing
      ? (fish.x || 0) + Math.cos(nextAngle * 2 + index) * 90
      : anchorX;
    const targetY = isFollowing
      ? (fish.y || 0) + Math.sin(nextAngle * 2 + index) * 56
      : anchorY;

    const vx = (item.vx || 0) * 0.8 + (targetX - (item.x || 0)) * 0.08;
    const vy = (item.vy || 0) * 0.8 + (targetY - (item.y || 0)) * 0.08;

    return {
      ...item,
      angle: nextAngle,
      followUntil,
      vx,
      vy,
      x: (item.x || 0) + vx,
      y: (item.y || 0) + vy,
    };
  });
}
