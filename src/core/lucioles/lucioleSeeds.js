function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createExternalSeedStock(count = 120) {
  return {
    total: count,
    remaining: count,
    delivered: 0,
    germinated: 0,
  };
}

export function takeSeedFromExternalStock(stock) {
  if (!stock || stock.remaining <= 0) return false;

  stock.remaining -= 1;
  return true;
}

export function createLucioleSeed(x, y, sourceFishId = null) {
  const rare = Math.random() < 0.08;

  return {
    id: makeId("luciole-seed"),
    sourceFishId,
    x,
    y,
    vx: rand(-0.16, 0.16),
    vy: rand(-0.12, 0.12),
    bornAt: performance.now(),
    phase: rand(0, Math.PI * 2),
    state: "seed", // seed | germinating | luciole
    hue: rare ? rand(172, 196) : rand(48, 66),
    r: rare ? rand(2.2, 3.2) : rand(1.3, 2.1),
    targetR: rare ? rand(8, 12) : rand(4.2, 6.8),
    rare,
    germinationDelay: rare ? rand(1800, 3200) : rand(900, 2200),
    growthDuration: rare ? rand(1100, 1700) : rand(650, 1100),
    life: rare ? rand(19000, 28000) : rand(11000, 17000),
    burstDone: false,
    motes: [],
  };
}

function spawnSeedBurst(seed) {
  if (seed.burstDone) return;
  seed.burstDone = true;

  const count = seed.rare ? 18 : 10;

  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count + rand(-0.4, 0.4);
    const speed = rand(0.15, seed.rare ? 0.72 : 0.42);

    seed.motes.push({
      x: seed.x,
      y: seed.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: rand(0.7, seed.rare ? 1.7 : 1.2),
      life: rand(900, seed.rare ? 1900 : 1300),
      bornAt: performance.now(),
      phase: rand(0, Math.PI * 2),
    });
  }
}

function updateSeedMotes(seed, time, dt) {
  for (let i = seed.motes.length - 1; i >= 0; i -= 1) {
    const mote = seed.motes[i];
    const age = time - mote.bornAt;

    mote.x += mote.vx * dt * 0.06;
    mote.y += mote.vy * dt * 0.06;
    mote.vx *= 0.965;
    mote.vy *= 0.965;

    if (age > mote.life) {
      seed.motes.splice(i, 1);
    }
  }
}

export function updateLucioleSeeds(seeds, stock, dt = 16) {
  const time = performance.now();

  for (let i = seeds.length - 1; i >= 0; i -= 1) {
    const seed = seeds[i];
    const age = time - seed.bornAt;

    seed.x += seed.vx * dt * 0.06 + Math.sin(time * 0.0018 + seed.phase) * 0.025;
    seed.y += seed.vy * dt * 0.06 + Math.cos(time * 0.0014 + seed.phase) * 0.018;

    seed.vx *= 0.992;
    seed.vy *= 0.992;

    if (seed.state === "seed" && age > seed.germinationDelay) {
      seed.state = "germinating";
      spawnSeedBurst(seed);
    }

    if (
      seed.state === "germinating" &&
      age > seed.germinationDelay + seed.growthDuration
    ) {
      seed.state = "luciole";
      stock.germinated += 1;
    }

    updateSeedMotes(seed, time, dt);

    if (age > seed.germinationDelay + seed.growthDuration + seed.life) {
      seeds.splice(i, 1);
    }
  }
}

function drawMotes(ctx, seed, time) {
  seed.motes.forEach((mote) => {
    const age = time - mote.bornAt;
    const k = clamp01(age / mote.life);
    const alpha = (1 - k) * 0.65;

    ctx.fillStyle = `hsla(${seed.hue}, 95%, 78%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.r * (1 + k * 1.4), 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawDormantSeed(ctx, seed, time) {
  const pulse = Math.sin(time * 0.006 + seed.phase) * 0.5 + 0.5;
  const r = seed.r * (0.8 + pulse * 0.28);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  ctx.fillStyle = `hsla(${seed.hue}, 95%, 76%, ${0.42 + pulse * 0.18})`;
  ctx.beginPath();
  ctx.arc(seed.x, seed.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `hsla(${seed.hue}, 95%, 82%, ${0.15 + pulse * 0.1})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(seed.x, seed.y, r * 3.4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawGerminatingSeed(ctx, seed, time) {
  const age = time - seed.bornAt;
  const growth = clamp01((age - seed.germinationDelay) / seed.growthDuration);
  const eased = 1 - Math.pow(1 - growth, 3);
  const pulse = Math.sin(time * 0.012 + seed.phase) * 0.5 + 0.5;

  const r = seed.r + (seed.targetR - seed.r) * eased;
  const flash = Math.sin(growth * Math.PI);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const glow = ctx.createRadialGradient(seed.x, seed.y, 0, seed.x, seed.y, r * 12);
  glow.addColorStop(0, `hsla(${seed.hue}, 95%, 88%, ${0.72 + flash * 0.18})`);
  glow.addColorStop(0.18, `hsla(${seed.hue + 22}, 95%, 72%, ${0.34 + flash * 0.22})`);
  glow.addColorStop(1, `hsla(${seed.hue}, 95%, 60%, 0)`);

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(seed.x, seed.y, r * 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsla(${seed.hue}, 95%, 86%, ${0.9})`;
  ctx.beginPath();
  ctx.arc(seed.x, seed.y, r * (0.75 + pulse * 0.18), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `hsla(${seed.hue + 30}, 95%, 88%, ${0.28 + flash * 0.24})`;
  ctx.lineWidth = seed.rare ? 2.2 : 1.4;
  ctx.beginPath();
  ctx.arc(seed.x, seed.y, r * (2.1 + flash * 1.2), 0, Math.PI * 2);
  ctx.stroke();

  drawMotes(ctx, seed, time);

  ctx.restore();
}

function drawLuciole(ctx, seed, time) {
  const age = time - seed.bornAt - seed.germinationDelay - seed.growthDuration;
  const lifeK = clamp01(age / seed.life);
  const pulse = Math.sin(time * 0.005 + seed.phase) * 0.5 + 0.5;
  const alpha = (1 - lifeK) * (seed.rare ? 0.95 : 0.78);
  const r = seed.targetR * (0.88 + pulse * 0.18);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const aura = ctx.createRadialGradient(seed.x, seed.y, 0, seed.x, seed.y, r * 10);
  aura.addColorStop(0, `hsla(${seed.hue}, 95%, 92%, ${alpha})`);
  aura.addColorStop(0.2, `hsla(${seed.hue + 28}, 95%, 76%, ${alpha * 0.46})`);
  aura.addColorStop(1, `hsla(${seed.hue}, 90%, 50%, 0)`);

  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(seed.x, seed.y, r * 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsla(${seed.hue + 10}, 95%, 90%, ${alpha})`;
  ctx.beginPath();
  ctx.arc(seed.x, seed.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `hsla(${seed.hue + 30}, 95%, 88%, ${alpha * 0.32})`;
  ctx.lineWidth = seed.rare ? 2 : 1;
  ctx.beginPath();
  ctx.arc(seed.x, seed.y, r * (2.4 + pulse), 0, Math.PI * 2);
  ctx.stroke();

  drawMotes(ctx, seed, time);

  ctx.restore();
}

export function drawLucioleSeeds(ctx, seeds, time = performance.now()) {
  seeds.forEach((seed) => {
    if (seed.state === "seed") drawDormantSeed(ctx, seed, time);
    else if (seed.state === "germinating") drawGerminatingSeed(ctx, seed, time);
    else drawLuciole(ctx, seed, time);
  });
}
