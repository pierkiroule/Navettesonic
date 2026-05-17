const FOLLOW_DURATION_MS = 30_000;
const FOLLOW_TRIGGER_DISTANCE = 220;

function buildRoseFish({ index = 0, count = 10, center = { x: 0, y: 0 }, arenaLevel = 0 }) {
  const angle = (index / Math.max(1, count)) * Math.PI * 2;
  const radius = 180 + index * 20;
  return {
    id: `rose-${index + 1}`,
    x: (center.x || 0) + Math.cos(angle) * radius,
    y: (center.y || 0) + Math.sin(angle) * radius,
    vx: Math.cos(angle + Math.PI / 2) * 0.25,
    vy: Math.sin(angle + Math.PI / 2) * 0.25,
    size: 34,
    alpha: 1,
    arenaLevel,
    angle,
    speed: 0.014 + (index % 3) * 0.002,
    orbitRadius: radius,
    followUntil: 0,
  };
}

export function createRoseFishSchool({ count = 10, center = { x: 0, y: 0 }, arenaLevel = 0 } = {}) {
  return Array.from({ length: Math.max(8, count) }, (_, index) =>
    buildRoseFish({ index, count: Math.max(8, count), center, arenaLevel })
  );
}

export function tickRoseFishSchool(roseFish = [], fish = {}, options = {}) {
  const now = options.now || Date.now();
  const school = Array.isArray(roseFish) && roseFish.length
    ? roseFish
    : createRoseFishSchool({ count: 10, center: { x: 0, y: 0 }, arenaLevel: 0 });

  const fx = fish?.x || 0;
  const fy = fish?.y || 0;

  return school.map((item, index) => {
    const angle = (item.angle || 0) + (item.speed || 0.014);
    const orbit = Number.isFinite(item.orbitRadius) ? item.orbitRadius : (180 + index * 20);
    const anchorX = Math.cos(angle) * orbit;
    const anchorY = Math.sin(angle) * orbit;

    const dFish = Math.hypot(fx - (item.x || 0), fy - (item.y || 0));
    const followUntil = dFish <= FOLLOW_TRIGGER_DISTANCE ? now + FOLLOW_DURATION_MS : (item.followUntil || 0);
    const isFollowing = followUntil > now;

    const targetX = isFollowing ? fx + Math.cos(angle * 2 + index) * 90 : anchorX;
    const targetY = isFollowing ? fy + Math.sin(angle * 2 + index) * 56 : anchorY;

    const vx = (item.vx || 0) * 0.82 + (targetX - (item.x || 0)) * 0.07;
    const vy = (item.vy || 0) * 0.82 + (targetY - (item.y || 0)) * 0.07;

    return {
      ...item,
      x: (item.x || 0) + vx,
      y: (item.y || 0) + vy,
      vx,
      vy,
      angle,
      size: Math.max(34, Number(item.size) || 34),
      alpha: 1,
      arenaLevel: 0,
      followUntil,
    };
  });
}
