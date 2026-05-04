const MAX_WAKE_PARTICLES = 30;
const MAX_RIPPLES = 12;

const wakeParticles = [];
const ripples = [];

let wakeEmitter = 0;
let rippleEmitter = 0;

export function getFishMouthPosition(fish) {
  return {
    x: fish.x + Math.cos(fish.angle) * 26,
    y: fish.y + Math.sin(fish.angle) * 26,
  };
}

export function getFishTailPosition(fish) {
  return {
    x: fish.x - Math.cos(fish.angle) * 24,
    y: fish.y - Math.sin(fish.angle) * 24,
  };
}

function spawnWakeParticle(mouth, tail, dirX, dirY, tangentX, tangentY, now, speedNorm) {
  const along = Math.random() * 0.2;
  const jitter = 1.2 + Math.random() * 2.1;

  wakeParticles.push({
    x: mouth.x + (tail.x - mouth.x) * along + tangentX * (Math.random() - 0.5) * jitter,
    y: mouth.y + (tail.y - mouth.y) * along + tangentY * (Math.random() - 0.5) * jitter,
    vx:
      dirX * (0.22 + Math.random() * 0.48 + speedNorm * 0.3) +
      tangentX * (Math.random() - 0.5) * 0.05,
    vy:
      dirY * (0.22 + Math.random() * 0.48 + speedNorm * 0.3) +
      tangentY * (Math.random() - 0.5) * 0.05,
    age: 0,
    life: 640 + Math.random() * 360,
    size: 0.9 + Math.random() * 1.8,
    alpha: 0.22 + Math.random() * 0.28,
    bornAt: now,
  });
}

function spawnRipple(tail, now, speedNorm) {
  ripples.push({
    x: tail.x,
    y: tail.y,
    bornAt: now,
    life: 900 + speedNorm * 260,
    radius: 8 + speedNorm * 8,
    alpha: 0.12 + speedNorm * 0.16,
  });
}

export function updateFishFx(fish) {
  const now = performance.now();
  const speed = Math.hypot(fish.vx || 0, fish.vy || 0);
  const maxSpeed = fish.maxSpeed || 3.1;
  const speedNorm = Math.min(1, speed / maxSpeed);

  const mouth = getFishMouthPosition(fish);
  const tail = getFishTailPosition(fish);

  const flowX = tail.x - mouth.x;
  const flowY = tail.y - mouth.y;
  const flowLen = Math.hypot(flowX, flowY) || 1;

  const dirX = flowX / flowLen;
  const dirY = flowY / flowLen;

  const tangentX = -dirY;
  const tangentY = dirX;

  const targetCount = Math.min(MAX_WAKE_PARTICLES, 10 + Math.round(speedNorm * 16));

  while (wakeParticles.length < targetCount) {
    spawnWakeParticle(mouth, tail, dirX, dirY, tangentX, tangentY, now, speedNorm);
  }

  wakeEmitter += 0.18 + speedNorm * 0.75;

  while (wakeEmitter >= 1) {
    wakeEmitter -= 1;

    if (wakeParticles.length >= MAX_WAKE_PARTICLES) break;

    spawnWakeParticle(mouth, tail, dirX, dirY, tangentX, tangentY, now, speedNorm);
  }

  for (let i = wakeParticles.length - 1; i >= 0; i -= 1) {
    const p = wakeParticles[i];

    p.age = now - p.bornAt;

    const t = p.age / p.life;

    if (t >= 1) {
      wakeParticles.splice(i, 1);
      continue;
    }

    p.vx *= 0.989;
    p.vy *= 0.989;
    p.x += p.vx;
    p.y += p.vy;
  }

  rippleEmitter += 0.015 + speedNorm * 0.13;

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
}

export function drawFishFx(ctx) {
  const now = performance.now();

  ctx.save();

  wakeParticles.forEach((p) => {
    const t = p.age / p.life;
    const alpha = p.alpha * (1 - t);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 + t * 1.8), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(190, 240, 255, ${alpha})`;
    ctx.fill();
  });

  ripples.forEach((r) => {
    const t = r.age / r.life;
    const alpha = r.alpha * (1 - t);
    const radius = r.radius + t * 42;

    ctx.beginPath();
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  ctx.restore();
}

export function clearFishFx() {
  wakeParticles.length = 0;
  ripples.length = 0;
  wakeEmitter = 0;
  rippleEmitter = 0;
}
