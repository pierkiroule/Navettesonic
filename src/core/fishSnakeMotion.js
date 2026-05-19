import { clampToCircle } from "./geometry.js";
import { getFishNavigableRadius } from "./constants.js";

const DEFAULT_FISH_NAV_RADIUS = getFishNavigableRadius(1200);

export function createInitialSpine(x = 0, y = 0, count = 26, spacing = 7.2) {
  return Array.from({ length: count }, (_, i) => ({
    x,
    y: y + i * spacing,
  }));
}

function normalizeSpine(fish) {
  if (Array.isArray(fish.spine) && fish.spine.length >= 12) {
    return fish.spine.map((point) => ({
      x: Number.isFinite(point.x) ? point.x : fish.x || 0,
      y: Number.isFinite(point.y) ? point.y : fish.y || 0,
    }));
  }

  return createInitialSpine(fish.x || 0, fish.y || 0);
}

function lerpAngle(a, b, t) {
  let diff = b - a;

  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  return a + diff * t;
}

export function updateSnakeFishToTarget({
  fish,
  targetX,
  targetY,
  arenaRadius = DEFAULT_FISH_NAV_RADIUS,
  swimSpeed = 1,
}) {
  // Règle de navigation: rayon poisson = rayon interne d’arène (navigable radius).
  const fishNavRadius =
    Number.isFinite(arenaRadius) && arenaRadius > 0
      ? arenaRadius
      : DEFAULT_FISH_NAV_RADIUS;
  const spine = normalizeSpine(fish);
  const head = spine[0];

  const maxSpeed = (fish.maxSpeed || 3.1) * swimSpeed;

  let vx = (fish.vx || 0) * 0.86;
  let vy = (fish.vy || 0) * 0.86;

  const dx = targetX - head.x;
  const dy = targetY - head.y;
  const d = Math.hypot(dx, dy) || 1;

  if (d > 8) {
    const targetAngle = Math.atan2(dy, dx);
    const currentAngle = Math.atan2(vy || dy, vx || dx);
    const steeredAngle = lerpAngle(currentAngle, targetAngle, 0.28);

    const pull = Math.min(1, d / 240);
    const force = maxSpeed * (0.18 + pull * 0.34);

    vx += Math.cos(steeredAngle) * force;
    vy += Math.sin(steeredAngle) * force;
  }

  const speed = Math.hypot(vx, vy) || 1;
  const limit = maxSpeed * 1.12;

  if (speed > limit) {
    vx = (vx / speed) * limit;
    vy = (vy / speed) * limit;
  }

  const safeHead = clampToCircle(
    {
      x: head.x + vx,
      y: head.y + vy,
    },
    fishNavRadius
  );

  spine[0] = safeHead;

  const spacing = 7.2;

  for (let i = 1; i < spine.length; i += 1) {
    const prev = spine[i - 1];
    const cur = spine[i];

    const sx = cur.x - prev.x;
    const sy = cur.y - prev.y;
    const sd = Math.hypot(sx, sy) || 1;

    const targetSegmentX = prev.x + (sx / sd) * spacing;
    const targetSegmentY = prev.y + (sy / sd) * spacing;

    const t = i / (spine.length - 1);
    const stiffness = 0.84 - t * 0.3;

    cur.x += (targetSegmentX - cur.x) * stiffness;
    cur.y += (targetSegmentY - cur.y) * stiffness;
  }

  const neck = spine[2] || spine[1] || safeHead;
  const angle = Math.atan2(safeHead.y - neck.y, safeHead.x - neck.x);

  const velocityAngle = Math.atan2(vy || Math.sin(angle), vx || Math.cos(angle));
  let turnDiff = velocityAngle - angle;
  while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
  while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
  const turnAmount = Math.max(-1, Math.min(1, turnDiff / 1.2));

  return {
    ...fish,
    x: safeHead.x,
    y: safeHead.y,
    vx,
    vy,
    angle,
    spine,
    mouthPull: d > 20 ? 0.62 : 0.08,
    turnAmount,
    turnVelocity: turnAmount,
    maxSpeed: fish.maxSpeed || 3.1,
  };
}
