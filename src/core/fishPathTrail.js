const TRAIL_LIFE = 3200;
const MIN_POINT_DISTANCE = 8;
const MAX_POINTS = 220;
const CONSUME_RADIUS = 22;

export function startFishTrailAt(x, y) {
  return [
    {
      x,
      y,
      bornAt: performance.now(),
      life: TRAIL_LIFE,
    },
  ];
}

export function addFishTrailPoint(trail = [], x, y) {
  const now = performance.now();
  const last = trail[trail.length - 1];

  if (last && Math.hypot(last.x - x, last.y - y) < MIN_POINT_DISTANCE) {
    return trail;
  }

  return [
    ...trail,
    {
      x,
      y,
      bornAt: now,
      life: TRAIL_LIFE,
    },
  ].slice(-MAX_POINTS);
}

export function updateFishTrail(trail = [], time = performance.now()) {
  return trail.filter((point) => time - point.bornAt < point.life);
}

export function consumeTrailPoints(trail = [], head) {
  if (!trail.length || !head) return trail;

  let index = 0;

  while (index < trail.length) {
    const point = trail[index];
    const d = Math.hypot(point.x - head.x, point.y - head.y);

    if (d > CONSUME_RADIUS) break;
    index += 1;
  }

  return trail.slice(index);
}

export function getNextTrailTarget(trail = []) {
  return trail[0] || null;
}

export function drawFishTrail(ctx, trail = [], time = performance.now()) {
  if (trail.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 1; i < trail.length; i += 1) {
    const a = trail[i - 1];
    const b = trail[i];

    const age = time - b.bornAt;
    const alpha = Math.max(0, 1 - age / b.life);

    if (alpha <= 0) continue;

    ctx.strokeStyle = `rgba(125, 245, 255, ${alpha * 0.48})`;
    ctx.lineWidth = 10 * alpha;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.28})`;
    ctx.lineWidth = 2.4 * alpha;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}
