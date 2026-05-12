import { distance } from "../geometry.js";
import { triggerDarkWaveEffect } from "./worldEffects.js";

const SPIN_DURATION = 5000;
const WAVE_DURATION = 4200;
const WAVE_MAX_RADIUS = 1800;
const PERIPHERY_RATIO = 0.62;

export function createStarTornado({
  id = "star-tornado-1",
  x = 260,
  y = -180,
  r = 38,
} = {}) {
  return {
    id,
    x,
    y,
    r,

    vx: 0.42,
    vy: -0.28,
    driftPhase: Math.random() * Math.PI * 2,

    rotation: 0,
    state: "idle",
    spinStartedAt: 0,
    waveStartedAt: 0,
    touchedAt: 0,
    lastWaveRadius: 0,
    waveHitFish: false,
  };
}

function updateTornadoMotion(tornado, arenaRadius, dt) {
  const t = performance.now() * 0.001;
  const d = Math.hypot(tornado.x, tornado.y) || 1;
  const nx = tornado.x / d;
  const ny = tornado.y / d;
  const tx = -ny;
  const ty = nx;

  const margin = tornado.r * 2.2;
  const outerLimit = arenaRadius - margin;
  const innerLimit = Math.max(arenaRadius * PERIPHERY_RATIO, tornado.r * 6);

  const ringCenter = (innerLimit + outerLimit) * 0.5;
  const radialOffset = ringCenter - d;

  const tangentialForce = (tornado.state === "spinning" ? 0.013 : 0.008) * dt;
  const radialForce = (radialOffset / arenaRadius) * 0.02 * dt;

  const swirl = Math.sin(t * 0.58 + tornado.driftPhase) * 0.003 * dt;

  tornado.vx += tx * tangentialForce + nx * radialForce + nx * swirl;
  tornado.vy += ty * tangentialForce + ny * radialForce + ny * swirl;

  const maxSpeed = tornado.state === "spinning" ? 1.0 : 0.58;
  const speed = Math.hypot(tornado.vx, tornado.vy) || 1;

  if (speed > maxSpeed) {
    tornado.vx = (tornado.vx / speed) * maxSpeed;
    tornado.vy = (tornado.vy / speed) * maxSpeed;
  }

  tornado.x += tornado.vx * dt * 0.06;
  tornado.y += tornado.vy * dt * 0.06;

  const newD = Math.hypot(tornado.x, tornado.y) || 1;
  const outNx = tornado.x / newD;
  const outNy = tornado.y / newD;

  if (newD > outerLimit) {
    tornado.x = outNx * outerLimit;
    tornado.y = outNy * outerLimit;
  } else if (newD < innerLimit) {
    tornado.x = outNx * innerLimit;
    tornado.y = outNy * innerLimit;
  }
}

export function updateStarTornado(tornado, fish, dt = 16, arenaRadius = 1200) {
  if (!tornado) return;

  updateTornadoMotion(tornado, arenaRadius, dt);

  const time = performance.now();

  if (tornado.state === "spinning") {
    tornado.rotation += 0.026 * dt;

    if (time - tornado.spinStartedAt >= SPIN_DURATION) {
      tornado.state = "wave";
      tornado.waveStartedAt = time;
      tornado.lastWaveRadius = tornado.r;
      tornado.waveHitFish = false;
    }
  } else if (tornado.state === "wave") {
    tornado.rotation += 0.006 * dt;

    if (time - tornado.waveStartedAt >= WAVE_DURATION) {
      tornado.state = "idle";
      tornado.waveStartedAt = 0;
      tornado.lastWaveRadius = 0;
      tornado.waveHitFish = false;
    }
  } else {
    tornado.rotation += 0.003 * dt;
  }

  if (!fish) return;

  const fishDistance = distance(tornado, fish);
  const contactRadius = tornado.r + 46;

  if (
    tornado.state === "idle" &&
    fishDistance <= contactRadius &&
    time - tornado.touchedAt > 1300
  ) {
    tornado.touchedAt = time;
    tornado.state = "spinning";
    tornado.spinStartedAt = time;
    tornado.waveStartedAt = 0;
    tornado.lastWaveRadius = tornado.r;
    tornado.waveHitFish = false;
  }

  if (tornado.state === "wave" && !tornado.waveHitFish) {
    const waveAge = time - tornado.waveStartedAt;
    const waveProgress = Math.min(1, waveAge / WAVE_DURATION);
    const waveRadius = tornado.r + waveProgress * WAVE_MAX_RADIUS;

    const fishRadius = 52;

    const waveHasCrossedFish =
      tornado.lastWaveRadius <= fishDistance + fishRadius &&
      waveRadius >= fishDistance - fishRadius;

    tornado.lastWaveRadius = waveRadius;

    if (waveHasCrossedFish) {
      tornado.waveHitFish = true;
      triggerDarkWaveEffect(5000);
    }
  }
}

function drawArm(ctx, side, length, width, curl) {
  ctx.beginPath();
  ctx.moveTo(0, 0);

  ctx.bezierCurveTo(
    side * width * 0.35,
    -length * 0.2,
    side * width * 0.9 + curl,
    -length * 0.68,
    0,
    -length
  );

  ctx.bezierCurveTo(
    -side * width * 0.9 + curl,
    -length * 0.68,
    -side * width * 0.35,
    -length * 0.2,
    0,
    0
  );

  ctx.closePath();
}

export function drawStarTornado(ctx, tornado, time = performance.now()) {
  if (!tornado) return;

  const spinning = tornado.state === "spinning";
  const waving = tornado.state === "wave";
  const active = spinning || waving;
  const pulse = Math.sin(time * 0.006) * 0.5 + 0.5;

  ctx.save();
  ctx.translate(tornado.x, tornado.y);
  ctx.rotate(tornado.rotation);

  const aura = ctx.createRadialGradient(0, 0, 8, 0, 0, tornado.r * 2.6);
  aura.addColorStop(0, `rgba(255, 230, 210, ${active ? 0.34 : 0.16})`);
  aura.addColorStop(0.48, `rgba(244, 114, 182, ${active ? 0.24 : 0.08})`);
  aura.addColorStop(1, "rgba(244, 114, 182, 0)");

  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, tornado.r * 2.35 + pulse * 10, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 5; i += 1) {
    const a = (Math.PI * 2 * i) / 5;
    const curl = Math.sin(time * 0.003 + i) * 5;

    ctx.save();
    ctx.rotate(a + Math.sin(time * 0.002 + i) * 0.08);

    const grad = ctx.createLinearGradient(0, 0, 0, -tornado.r * 1.25);
    grad.addColorStop(0, `rgba(255, 235, 220, ${active ? 0.95 : 0.78})`);
    grad.addColorStop(0.55, `rgba(251, 146, 160, ${active ? 0.8 : 0.58})`);
    grad.addColorStop(1, `rgba(244, 114, 182, ${active ? 0.22 : 0.08})`);

    ctx.fillStyle = grad;
    drawArm(ctx, i % 2 ? -1 : 1, tornado.r * 1.25, tornado.r * 0.34, curl);
    ctx.fill();

    ctx.restore();
  }

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(255,255,255,${spinning ? 0.52 : 0.2})`;
  ctx.lineWidth = spinning ? 2 : 1.3;
  ctx.beginPath();

  for (let i = 0; i < 80; i += 1) {
    const t = i / 79;
    const a = t * Math.PI * 5.4;
    const r = t * tornado.r * 1.1;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.restore();

  if (waving) {
    const waveAge = time - tornado.waveStartedAt;
    const k = Math.min(1, waveAge / WAVE_DURATION);
    const waveR = tornado.r + k * WAVE_MAX_RADIUS;
    const alpha = (1 - k) * 0.34;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
    ctx.lineWidth = 5 * (1 - k) + 1;

    ctx.beginPath();
    ctx.arc(tornado.x, tornado.y, waveR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}


export function getStarTornadoWaveRadius(tornado, time = performance.now()) {
  if (!tornado || tornado.state !== "wave") return null;
  const waveAge = time - tornado.waveStartedAt;
  const k = Math.min(1, waveAge / WAVE_DURATION);
  return tornado.r + k * WAVE_MAX_RADIUS;
}
