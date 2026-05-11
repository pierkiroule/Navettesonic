const MAX_WAKE_PARTICLES = 24;
const MAX_RIPPLES = 10;
const MAX_TRAIL_POINTS = 56;

const wakeParticles = [];
const ripples = [];
const trail = [];

let wakeEmitter = 0;
let rippleEmitter = 0;

function isFiniteFish(fish) {
  return (
    fish &&
    Number.isFinite(fish.x) &&
    Number.isFinite(fish.y) &&
    Number.isFinite(fish.vx) &&
    Number.isFinite(fish.vy) &&
    Number.isFinite(fish.angle)
  );
}

function getSpeed(fish) {
  return Math.hypot(fish.vx, fish.vy);
}

function getMouth(fish) {
  return {
    x: fish.x + Math.cos(fish.angle) * 32,
    y: fish.y + Math.sin(fish.angle) * 32,
  };
}

function getTail(fish) {
  const spine = fish?.spine;

  if (Array.isArray(spine) && spine.length >= 2) {
    const tail = spine[spine.length - 1];
    const prev = spine[spine.length - 2];

    const angle = Math.atan2(tail.y - prev.y, tail.x - prev.x);

    return {
      x: tail.x,
      y: tail.y,
      angle,
    };
  }

  return {
    x: fish.x - Math.cos(fish.angle) * 30,
    y: fish.y - Math.sin(fish.angle) * 30,
    angle: fish.angle,
  };
}

function spawnWakeParticle(mouth, tail, dirX, dirY, tangentX, tangentY, now, speedNorm) {
  const along = Math.random() * 0.22;
  const jitter = 1.2 + Math.random() * 2.2;

  wakeParticles.push({
    x: mouth.x + (tail.x - mouth.x) * along + tangentX * (Math.random() - 0.5) * jitter,
    y: mouth.y + (tail.y - mouth.y) * along + tangentY * (Math.random() - 0.5) * jitter,
    vx:
      dirX * (0.18 + Math.random() * 0.38 + speedNorm * 0.28) +
      tangentX * (Math.random() - 0.5) * 0.05,
    vy:
      dirY * (0.18 + Math.random() * 0.38 + speedNorm * 0.28) +
      tangentY * (Math.random() - 0.5) * 0.05,
    bornAt: now,
    age: 0,
    life: 620 + Math.random() * 360,
    size: 0.8 + Math.random() * 1.8,
    alpha: 0.14 + Math.random() * 0.22,
  });
}

function spawnRipple(tail, now, speedNorm) {
  ripples.push({
    x: tail.x,
    y: tail.y,
    bornAt: now,
    age: 0,
    life: 820 + speedNorm * 280,
    radius: 6 + speedNorm * 10,
    alpha: 0.07 + speedNorm * 0.14,
  });
}

export function updateFishFx(fish) {
  if (!isFiniteFish(fish)) return;

  const now = performance.now();
  const speed = getSpeed(fish);
  const maxSpeed = Number.isFinite(fish.maxSpeed) ? fish.maxSpeed : 3.1;
  const speedNorm = Math.min(1, speed / maxSpeed);

  const mouth = getMouth(fish);
  const tail = getTail(fish);

  const last = trail[0];
  if (!last || Math.hypot(last.x - fish.x, last.y - fish.y) > 3 || speedNorm > 0.08) {
    trail.unshift({
      x: fish.x,
      y: fish.y,
      angle: fish.angle,
      bornAt: now,
      age: 0,
      life: 1350,
      speedNorm,
    });

    if (trail.length > MAX_TRAIL_POINTS) {
      trail.length = MAX_TRAIL_POINTS;
    }
  }

  const flowX = tail.x - mouth.x;
  const flowY = tail.y - mouth.y;
  const flowLen = Math.hypot(flowX, flowY) || 1;

  const dirX = flowX / flowLen;
  const dirY = flowY / flowLen;
  const tangentX = -dirY;
  const tangentY = dirX;

  const targetCount = Math.min(MAX_WAKE_PARTICLES, 6 + Math.round(speedNorm * 18));

  while (wakeParticles.length < targetCount) {
    spawnWakeParticle(mouth, tail, dirX, dirY, tangentX, tangentY, now, speedNorm);
  }

  wakeEmitter += 0.12 + speedNorm * 0.7;

  while (wakeEmitter >= 1) {
    wakeEmitter -= 1;

    if (wakeParticles.length >= MAX_WAKE_PARTICLES) break;

    spawnWakeParticle(mouth, tail, dirX, dirY, tangentX, tangentY, now, speedNorm);
  }

  for (let i = wakeParticles.length - 1; i >= 0; i -= 1) {
    const p = wakeParticles[i];
    p.age = now - p.bornAt;

    if (p.age / p.life >= 1) {
      wakeParticles.splice(i, 1);
      continue;
    }

    p.vx *= 0.989;
    p.vy *= 0.989;
    p.x += p.vx;
    p.y += p.vy;
  }

  rippleEmitter += 0.008 + speedNorm * 0.11;

  while (rippleEmitter >= 1) {
    rippleEmitter -= 1;

    if (ripples.length < MAX_RIPPLES) {
      spawnRipple(tail, now, speedNorm);
    }
  }

  for (let i = ripples.length - 1; i >= 0; i -= 1) {
    const r = ripples[i];
    r.age = now - r.bornAt;

    if (r.age / r.life >= 1) {
      ripples.splice(i, 1);
    }
  }

  for (let i = trail.length - 1; i >= 0; i -= 1) {
    const point = trail[i];
    point.age = now - point.bornAt;

    if (point.age / point.life >= 1) {
      trail.splice(i, 1);
    }
  }
}

export function drawFishFx(ctx) {
  ctx.save();

  try {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;

    // Traînée douce derrière le poisson
    if (trail.length > 2) {
      for (let i = trail.length - 1; i > 1; i -= 1) {
        const point = trail[i];
        const prev = trail[i - 1];

        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
        if (!Number.isFinite(prev.x) || !Number.isFinite(prev.y)) continue;

        const t = point.age / point.life;
        const indexFade = 1 - i / trail.length;
        const alpha = Math.max(0, (1 - t) * indexFade * 0.14);

        if (alpha <= 0.008) continue;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
        ctx.lineWidth = 3 + alpha * 24;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    // Microbulles de sillage
    wakeParticles.forEach((p) => {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;

      const t = p.age / p.life;
      const alpha = p.alpha * (1 - t) * 0.75;

      if (alpha <= 0.01) return;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + t * 1.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(190, 240, 255, ${alpha})`;
      ctx.fill();
    });

    // Ondes très fines
    ripples.forEach((r) => {
      if (!Number.isFinite(r.x) || !Number.isFinite(r.y)) return;

      const t = r.age / r.life;
      const alpha = r.alpha * (1 - t) * 0.75;
      const radius = r.radius + t * 38;

      if (alpha <= 0.008) return;

      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  } catch (error) {
    console.warn("[Soon] drawFishFx skipped", error);
  } finally {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function clearFishFx() {
  wakeParticles.length = 0;
  ripples.length = 0;
  trail.length = 0;
  wakeEmitter = 0;
  rippleEmitter = 0;
}
