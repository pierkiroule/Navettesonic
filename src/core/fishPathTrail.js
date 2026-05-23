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
  if (trail.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < trail.length; i += 1) {
    const point = trail[i];
    const age = time - point.bornAt;
    const alpha = Math.max(0, 1 - age / point.life);

    if (alpha <= 0) continue;

    const cadence = i / Math.max(1, trail.length - 1);
    const pulse = Math.sin(time * 0.008 + i * 0.42) * 0.5 + 0.5;
    const radius = (3.5 + cadence * 4.5) * (0.92 + pulse * 0.16) * alpha;

    const halo = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 3.8);
    halo.addColorStop(0, `rgba(160, 245, 255, ${alpha * 0.72})`);
    halo.addColorStop(0.55, `rgba(94, 234, 212, ${alpha * 0.24})`);
    halo.addColorStop(1, "rgba(56, 189, 248, 0)");

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 3.4, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(186, 230, 253, ${alpha * 0.78})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(point.x - radius * 0.24, point.y - radius * 0.24, radius * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.82})`;
    ctx.fill();
  }

  ctx.restore();
}
