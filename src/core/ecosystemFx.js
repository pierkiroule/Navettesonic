const MAX_DUST = 110;
const MAX_ECHO_MOTES = 70;

const dust = [];
const echoMotes = [];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function distance(a, b) {
  return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
}

function ensureDust() {
  while (dust.length < MAX_DUST) {
    const angle = Math.random() * Math.PI * 2;
    const radius = rand(100, 1700);

    dust.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      r: rand(0.8, 2.4),
      hue: rand(178, 255),
      alpha: rand(0.035, 0.11),
      phase: rand(0, Math.PI * 2),
      drift: rand(0.04, 0.16),
    });
  }
}

function spawnEchoMote(fish, bubble, now, strength) {
  const k = rand(0.35, 0.95);

  echoMotes.push({
    x: fish.x + (bubble.x - fish.x) * k + rand(-42, 42),
    y: fish.y + (bubble.y - fish.y) * k + rand(-42, 42),
    vx: rand(-0.12, 0.12),
    vy: rand(-0.12, 0.12),
    bornAt: now,
    age: 0,
    life: rand(800, 1600),
    r: rand(1.2, 4.2) + strength * 3,
    hue: bubble.hue || rand(185, 250),
    alpha: rand(0.08, 0.22) * strength,
    phase: rand(0, Math.PI * 2),
  });

  if (echoMotes.length > MAX_ECHO_MOTES) {
    echoMotes.splice(0, echoMotes.length - MAX_ECHO_MOTES);
  }
}

export function updateEcosystemFx({ fish, bubbles, mode }) {
  if (!fish) return;

  ensureDust();

  const now = performance.now();
  const echoRadius = mode === "reso" ? 780 : 560;
  const spawnChance = mode === "reso" ? 0.045 : 0.025;

  for (const bubble of bubbles || []) {
    const d = distance(fish, bubble);
    const strength = Math.max(0, 1 - d / echoRadius);

    if (strength <= 0.08) continue;

    if (Math.random() < spawnChance + strength * 0.045) {
      spawnEchoMote(fish, bubble, now, strength);
    }
  }

  for (let i = echoMotes.length - 1; i >= 0; i -= 1) {
    const mote = echoMotes[i];

    mote.age = now - mote.bornAt;
    mote.x += mote.vx;
    mote.y += mote.vy;

    if (mote.age >= mote.life) {
      echoMotes.splice(i, 1);
    }
  }
}

export function drawEcosystemBackground(ctx, rect, camera, state, time) {
  const fish = state.fish || {};
  const depth = Math.max(1, Math.min(3, Math.round(fish.depth || 1)));
  const mode = state.mode;
  const speed = Math.hypot(fish.vx || 0, fish.vy || 0);
  const speedNorm = Math.min(1, speed / 18);

  const t = time * 0.001;
  const breath = Math.sin(t * 0.36) * 0.5 + 0.5;

  ctx.save();

  const base = ctx.createRadialGradient(
    rect.width * 0.5 + Math.sin(t * 0.12) * 40,
    rect.height * 0.43 + Math.cos(t * 0.11) * 34,
    20,
    rect.width * 0.5,
    rect.height * 0.52,
    Math.max(rect.width, rect.height) * 0.95
  );

  const centerAlpha = mode === "reso" ? 0.26 : 0.32;

  base.addColorStop(0, `rgba(34, 211, 238, ${centerAlpha})`);
  base.addColorStop(0.35, "rgba(15, 23, 42, 0.94)");
  base.addColorStop(1, "rgba(2, 6, 23, 1)");

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Nappes boréales écran, non liées au poisson.
  for (let i = 0; i < 5; i += 1) {
    const y =
      rect.height * (0.18 + i * 0.14) +
      Math.sin(t * (0.18 + i * 0.03) + i) * 36;

    const h = 80 + i * 16;
    const hue = 178 + i * 24 + Math.sin(t * 0.1 + i) * 12;

    const grad = ctx.createLinearGradient(0, y - h, rect.width, y + h);
    grad.addColorStop(0, `hsla(${hue}, 95%, 68%, 0)`);
    grad.addColorStop(0.25, `hsla(${hue}, 95%, 68%, ${0.012 + breath * 0.008})`);
    grad.addColorStop(0.52, `hsla(${hue + 55}, 95%, 72%, ${0.018 + speedNorm * 0.008})`);
    grad.addColorStop(0.78, `hsla(${hue + 95}, 95%, 68%, ${0.01 + breath * 0.006})`);
    grad.addColorStop(1, `hsla(${hue}, 95%, 68%, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(
      rect.width * 0.5,
      y,
      rect.width * 0.66,
      h,
      Math.sin(t * 0.08 + i) * 0.08,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  if (depth === 2) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.08)";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }

  if (depth === 3) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.18)";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }

  const vignette = ctx.createRadialGradient(
    rect.width * 0.5,
    rect.height * 0.48,
    Math.min(rect.width, rect.height) * 0.24,
    rect.width * 0.5,
    rect.height * 0.52,
    Math.max(rect.width, rect.height) * 0.78
  );

  const edgeAlpha = depth === 1 ? 0.2 : depth === 2 ? 0.28 : 0.38;

  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.72, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${edgeAlpha})`);

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.restore();
}

export function drawEcosystemWorld(ctx, state, time) {
  ensureDust();

  const fish = state.fish || {};
  const depth = Math.max(1, Math.min(3, Math.round(fish.depth || 1)));
  const mode = state.mode;
  const t = time * 0.001;

  ctx.save();

  // Poussières lumineuses de l'écosystème.
  dust.forEach((mote, index) => {
    const pulse = Math.sin(t * mote.drift + mote.phase) * 0.5 + 0.5;
    const driftX = Math.sin(t * 0.06 + index) * 18;
    const driftY = Math.cos(t * 0.05 + index) * 18;

    const alpha =
      mote.alpha *
      (depth === 3 ? 0.65 : 1) *
      (mode === "reso" ? 1.25 : 1) *
      (0.55 + pulse * 0.65);

    ctx.beginPath();
    ctx.arc(
      mote.x + driftX,
      mote.y + driftY,
      mote.r * (0.8 + pulse * 0.7),
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `hsla(${mote.hue}, 95%, 76%, ${alpha})`;
    ctx.fill();
  });

  // Échos de bulles : particules uniquement.
  echoMotes.forEach((mote) => {
    const k = mote.age / mote.life;
    const alpha = mote.alpha * Math.sin(Math.PI * k);
    const pulse = Math.sin(t * 3 + mote.phase) * 0.5 + 0.5;

    if (alpha <= 0.004) return;

    const r = mote.r * (0.8 + pulse * 0.9);

    const grad = ctx.createRadialGradient(
      mote.x,
      mote.y,
      0,
      mote.x,
      mote.y,
      r * 5
    );

    grad.addColorStop(0, `hsla(${mote.hue}, 96%, 78%, ${alpha})`);
    grad.addColorStop(0.35, `hsla(${mote.hue + 28}, 96%, 68%, ${alpha * 0.32})`);
    grad.addColorStop(1, `hsla(${mote.hue + 60}, 96%, 60%, 0)`);

    ctx.beginPath();
    ctx.arc(mote.x, mote.y, r * 5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });

  ctx.restore();
}

export function resetEcosystemFx() {
  echoMotes.length = 0;
  dust.length = 0;
}
