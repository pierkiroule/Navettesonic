import { ARENA_INNER_BOUNDARY_INSET, MEMBRANE_LEVEL_MULTIPLIERS } from "./constants.js";
import { getBlobRadiusAtAngle } from "./blobArena.js";

const DEFAULT_AUDIO = Object.freeze({
  available: false,
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  spectralFlux: 0,
  beatPulse: 0,
  silence: 1,
  smoothedEnergy: 0,
});

const AURORA_RIBBONS = 5;
const CONTOUR_SAMPLES = 96;
const LOW_PARTICLE_CAP = 54;
const HIGH_PARTICLE_CAP = 96;

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function lerp(a, b, t) {
  return a + (b - a) * clamp(t);
}

function mixHue(a, b, t) {
  const delta = ((((b - a) % 360) + 540) % 360) - 180;
  return (a + delta * clamp(t) + 360) % 360;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function easeOutCubic(t) {
  const k = 1 - clamp(t);
  return 1 - k * k * k;
}

function getPerformanceTier(rect = {}, dpr = 1) {
  const pixels = Math.max(1, (rect.width || 1) * (rect.height || 1) * dpr * dpr);
  if (pixels > 2_400_000 || (rect.width || 0) < 720) return "low";
  return "high";
}

function getActiveContourRadius(current = {}, arenaRadius = 1200, angle = -Math.PI / 2) {
  if (Array.isArray(current?.arenaBlob?.points) && current.arenaBlob.points.length > 2) {
    return Math.max(84, getBlobRadiusAtAngle(current.arenaBlob, angle) - ARENA_INNER_BOUNDARY_INSET);
  }
  const innerRadius = Math.max(84, arenaRadius - ARENA_INNER_BOUNDARY_INSET);
  const arenaLevel = Math.max(0, Math.min(2, Math.round(current?.fish?.arenaLevel || 0)));
  return innerRadius * (MEMBRANE_LEVEL_MULTIPLIERS[arenaLevel] ?? 1);
}

function ensureRuntime(previous = {}) {
  if (previous?.version === 1) return previous;
  const seed = Math.random() * 10000;
  return {
    version: 1,
    seed,
    particles: [],
    bloomWaves: [],
    calmMemory: 0.5,
    wonderMemory: 0.35,
    resonanceMemory: 0.25,
    breathPhase: Math.random() * Math.PI * 2,
    nextBloomAt: 0,
    paletteA: 188 + Math.random() * 28,
    paletteB: 278 + Math.random() * 44,
    paletteC: 44 + Math.random() * 20,
    audio: { ...DEFAULT_AUDIO },
    mood: {
      calm: 0.5,
      wonder: 0.35,
      resonance: 0.25,
      contact: 0,
      release: 0,
      depth: 0,
    },
    perfTier: "high",
  };
}

function getNearestBubbleInfluence(fish = {}, bubbles = []) {
  if (!fish || !Array.isArray(bubbles) || bubbles.length === 0) {
    return { strength: 0, hue: 190 };
  }

  let bestStrength = 0;
  let bestHue = 190;
  bubbles.forEach((bubble) => {
    const d = Math.hypot((bubble.x || 0) - (fish.x || 0), (bubble.y || 0) - (fish.y || 0));
    const strength = clamp(1 - d / 620);
    if (strength > bestStrength) {
      bestStrength = strength;
      bestHue = Number.isFinite(bubble?.hue) ? bubble.hue : 190;
    }
  });

  return { strength: bestStrength, hue: bestHue };
}

function spawnParticle(runtime, current, arenaRadius, now, kind = "mote") {
  const fish = current?.fish || {};
  const attachedToSoon = kind === "memory" || kind === "spark";
  const angle = Math.random() * Math.PI * 2;
  const contourRadius = getActiveContourRadius(current, arenaRadius, angle);
  const radius = kind === "pearl" ? contourRadius + rand(-18, 18) : rand(80, Math.max(120, contourRadius * 0.88));
  const originX = attachedToSoon ? (fish.x || 0) + rand(-42, 42) : Math.cos(angle) * radius;
  const originY = attachedToSoon ? (fish.y || 0) + rand(-42, 42) : Math.sin(angle) * radius;
  const driftAngle = angle + Math.PI / 2 + rand(-0.8, 0.8);
  const speed = kind === "spark" ? rand(0.28, 0.72) : kind === "pearl" ? rand(0.08, 0.18) : rand(0.05, 0.24);
  const mood = runtime.mood || {};
  const hue = kind === "pearl"
    ? mixHue(runtime.paletteC, runtime.paletteA, mood.resonance || 0)
    : mixHue(runtime.paletteA, runtime.paletteB, Math.random() * 0.85);

  runtime.particles.push({
    kind,
    x: originX,
    y: originY,
    vx: Math.cos(driftAngle) * speed + rand(-0.05, 0.05),
    vy: Math.sin(driftAngle) * speed + rand(-0.05, 0.05),
    bornAt: now,
    life: kind === "pearl" ? rand(4200, 7600) : kind === "spark" ? rand(1500, 2600) : rand(3000, 6200),
    radius: kind === "pearl" ? rand(1.8, 4.8) : kind === "spark" ? rand(1.1, 2.8) : rand(0.8, 2.2),
    hue,
    phase: Math.random() * Math.PI * 2,
  });
}

function updateParticles(runtime, current, arenaRadius, now, dt, targetCap) {
  const audio = runtime.audio || DEFAULT_AUDIO;
  const mood = runtime.mood || {};
  const modeBoost = current?.mode === "reso" ? 1.45 : current?.mode === "echostory" ? 1.16 : 0.74;
  const spawnEnergy = clamp(audio.smoothedEnergy * 0.7 + mood.resonance * 0.22 + mood.wonder * 0.18);
  const spawnBudget = modeBoost * (0.018 + spawnEnergy * 0.06 + audio.spectralFlux * 0.035);

  if (runtime.particles.length < targetCap && Math.random() < spawnBudget) {
    const roll = Math.random();
    const kind = roll < audio.bass * 0.24 ? "pearl" : roll < 0.45 + audio.treble * 0.25 ? "spark" : "mote";
    spawnParticle(runtime, current, arenaRadius, now, kind);
  }

  if (runtime.particles.length < targetCap && current?.contourRide?.active && Math.random() < 0.035 + audio.mid * 0.035) {
    spawnParticle(runtime, current, arenaRadius, now, "pearl");
  }

  for (let i = runtime.particles.length - 1; i >= 0; i -= 1) {
    const particle = runtime.particles[i];
    const age = now - particle.bornAt;
    if (age >= particle.life) {
      runtime.particles.splice(i, 1);
      continue;
    }
    const k = age / particle.life;
    const swirl = Math.sin(now * 0.0007 + particle.phase) * 0.012 * (particle.kind === "pearl" ? 0.5 : 1);
    particle.vx += -particle.y * swirl * 0.0004;
    particle.vy += particle.x * swirl * 0.0004;
    particle.x += particle.vx * dt * (0.82 + audio.mid * 0.26);
    particle.y += particle.vy * dt * (0.82 + audio.mid * 0.26);
    particle.alpha = Math.sin(Math.PI * k) * (particle.kind === "pearl" ? 0.42 : particle.kind === "spark" ? 0.34 : 0.2);
  }

  if (runtime.particles.length > targetCap) {
    runtime.particles.splice(0, runtime.particles.length - targetCap);
  }
}

function updateBloomWaves(runtime, current, arenaRadius, now, targetCap) {
  const audio = runtime.audio || DEFAULT_AUDIO;
  const mood = runtime.mood || {};
  const contourRideBoost = current?.contourRide?.active ? 1 : 0;
  const shouldBloom = current?.mode === "reso" && now >= runtime.nextBloomAt && runtime.particles.length < targetCap;
  const bloomChance = 0.0015 + audio.beatPulse * 0.006 + contourRideBoost * 0.003 + mood.wonder * 0.002;

  if (shouldBloom && Math.random() < bloomChance) {
    runtime.bloomWaves.push({
      bornAt: now,
      life: rand(5200, 9200),
      hue: mixHue(runtime.paletteA, runtime.paletteB, Math.random()),
      radius: getActiveContourRadius(current, arenaRadius, -Math.PI / 2),
      phase: Math.random() * Math.PI * 2,
    });
    runtime.nextBloomAt = now + rand(35000, 98000);
  }

  for (let i = runtime.bloomWaves.length - 1; i >= 0; i -= 1) {
    if (now - runtime.bloomWaves[i].bornAt >= runtime.bloomWaves[i].life) {
      runtime.bloomWaves.splice(i, 1);
    }
  }
}

export function updateAudioreactiveVisualState({ previous, audio, current, arenaRadius = 1200, rect, dpr = 1, now = performance.now() } = {}) {
  const runtime = ensureRuntime(previous);
  const safeAudio = { ...DEFAULT_AUDIO, ...(audio || {}) };
  const lastNow = Number.isFinite(runtime.lastNow) ? runtime.lastNow : now;
  const dt = clamp((now - lastNow) / 16.666, 0.25, 2.5);
  runtime.lastNow = now;
  runtime.perfTier = getPerformanceTier(rect, dpr);
  runtime.audio = safeAudio;

  const fish = current?.fish || {};
  const speed = Math.hypot(fish.vx || 0, fish.vy || 0);
  const speedNorm = clamp(speed / 12);
  const bubbleInfluence = getNearestBubbleInfluence(fish, current?.bubbles || []);
  const depth = clamp(((Math.round(fish.depth || 1) || 1) - 1) / 2);
  const activeStars = (current?.echostory?.stars || []).filter((star) => star?.previewPlaying || star?.attachedToContour).length;
  const networkEnergy = clamp(activeStars / 8 + (current?.echostory?.echostoryPlayback?.active ? 0.28 : 0));
  const contourRide = current?.contourRide?.active ? 1 : 0;
  const modeResonance = current?.mode === "reso" ? 1 : current?.mode === "echostory" ? 0.55 : 0.16;

  const resonanceTarget = clamp(
    modeResonance * 0.34 +
    safeAudio.smoothedEnergy * 0.36 +
    safeAudio.bass * 0.16 +
    bubbleInfluence.strength * 0.18 +
    contourRide * 0.28 +
    networkEnergy * 0.18
  );
  const calmTarget = clamp(0.82 - speedNorm * 0.36 - safeAudio.spectralFlux * 0.25 + safeAudio.silence * 0.12);
  const wonderTarget = clamp(0.26 + safeAudio.treble * 0.22 + networkEnergy * 0.28 + bubbleInfluence.strength * 0.22 + contourRide * 0.16);

  runtime.resonanceMemory = lerp(runtime.resonanceMemory, resonanceTarget, 0.035 * dt);
  runtime.calmMemory = lerp(runtime.calmMemory, calmTarget, 0.025 * dt);
  runtime.wonderMemory = lerp(runtime.wonderMemory, wonderTarget, 0.03 * dt);
  runtime.breathPhase += (0.004 + safeAudio.smoothedEnergy * 0.004 + contourRide * 0.002) * dt;
  runtime.primaryHue = mixHue(runtime.paletteA, bubbleInfluence.hue, bubbleInfluence.strength * 0.35);
  runtime.secondaryHue = mixHue(runtime.paletteB, 320, safeAudio.treble * 0.18);
  runtime.goldHue = runtime.paletteC;
  runtime.mood = {
    calm: runtime.calmMemory,
    wonder: runtime.wonderMemory,
    resonance: runtime.resonanceMemory,
    contact: bubbleInfluence.strength,
    release: clamp(safeAudio.beatPulse * 0.7 + contourRide * 0.22),
    depth,
  };

  const targetCap = runtime.perfTier === "low" ? LOW_PARTICLE_CAP : HIGH_PARTICLE_CAP;
  updateParticles(runtime, current, arenaRadius, now, dt, targetCap);
  updateBloomWaves(runtime, current, arenaRadius, now, targetCap);

  return runtime;
}

export function drawAudioreactiveContour(ctx, current = {}, arenaRef, time = performance.now()) {
  const runtime = current?.audioReactive;
  if (!runtime?.mood) return;
  const arenaRadius = arenaRef?.current?.radius || 1200;
  const mood = runtime.mood;
  const audio = runtime.audio || DEFAULT_AUDIO;
  const t = time * 0.001;
  const resonance = clamp(mood.resonance);
  const calm = clamp(mood.calm);
  const breath = Math.sin(runtime.breathPhase + t * 0.8) * 0.5 + 0.5;
  const hasBlob = Array.isArray(current?.arenaBlob?.points) && current.arenaBlob.points.length > 2;
  const intensity = clamp(0.18 + resonance * 0.65 + audio.beatPulse * 0.24 + (current?.contourRide?.active ? 0.28 : 0));
  if (intensity <= 0.05) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const passes = runtime.perfTier === "low" ? 2 : 3;
  for (let pass = 0; pass < passes; pass += 1) {
    const offset = (pass - 1) * (8 + resonance * 12);
    ctx.beginPath();
    for (let i = 0; i <= CONTOUR_SAMPLES; i += 1) {
      const a = (i / CONTOUR_SAMPLES) * Math.PI * 2;
      const baseR = hasBlob
        ? Math.max(84, getBlobRadiusAtAngle(current.arenaBlob, a) - ARENA_INNER_BOUNDARY_INSET)
        : getActiveContourRadius(current, arenaRadius, a);
      const wave =
        Math.sin(a * 5 + t * (0.65 + audio.mid * 0.55) + runtime.seed) * (2.5 + audio.mid * 8) +
        Math.sin(a * 11 - t * (0.35 + audio.treble * 0.4) + runtime.seed * 0.31) * (1.2 + audio.treble * 4.2) +
        Math.sin(a * 2 + runtime.breathPhase) * (1.5 + resonance * 5.5);
      const r = baseR + offset + wave * (0.45 + intensity * 0.78);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const hue = pass === 0 ? runtime.primaryHue : pass === 1 ? runtime.secondaryHue : runtime.goldHue;
    ctx.strokeStyle = `hsla(${hue}, 96%, ${66 + pass * 5}%, ${0.055 + intensity * (0.12 - pass * 0.018)})`;
    ctx.lineWidth = (18 - pass * 4) + intensity * 18 + calm * 4;
    ctx.shadowColor = `hsla(${hue}, 96%, 68%, ${0.25 + intensity * 0.35})`;
    ctx.shadowBlur = 18 + intensity * 34 + breath * 12;
    ctx.stroke();
  }

  runtime.bloomWaves?.forEach((wave) => {
    const age = time - wave.bornAt;
    const progress = clamp(age / Math.max(1, wave.life));
    const alpha = Math.sin(Math.PI * progress) * 0.18 * (0.5 + resonance);
    if (alpha <= 0.003) return;
    ctx.beginPath();
    ctx.arc(0, 0, wave.radius * (0.72 + easeOutCubic(progress) * 0.42), 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${wave.hue}, 96%, 72%, ${alpha})`;
    ctx.lineWidth = 10 + progress * 22;
    ctx.shadowColor = `hsla(${wave.hue}, 96%, 72%, ${alpha * 0.8})`;
    ctx.shadowBlur = 26 + progress * 36;
    ctx.stroke();
  });

  ctx.restore();
}

export function drawAudioreactiveAuroras(ctx, current = {}, arenaRef, time = performance.now()) {
  const runtime = current?.audioReactive;
  if (!runtime?.mood) return;
  const arenaRadius = arenaRef?.current?.radius || 1200;
  const mood = runtime.mood;
  const audio = runtime.audio || DEFAULT_AUDIO;
  const t = time * 0.001;
  const resonance = clamp(mood.resonance);
  const wonder = clamp(mood.wonder);
  const baseAlpha = (current?.mode === "reso" ? 0.06 : 0.028) + resonance * 0.045 + wonder * 0.035;
  if (baseAlpha <= 0.012) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const ribbons = runtime.perfTier === "low" ? 3 : AURORA_RIBBONS;
  for (let i = 0; i < ribbons; i += 1) {
    const phase = runtime.seed * 0.01 + i * 1.73;
    const y = Math.sin(t * (0.08 + i * 0.012) + phase) * arenaRadius * (0.1 + i * 0.018);
    const x = Math.cos(t * (0.05 + i * 0.01) + phase) * arenaRadius * 0.08;
    const width = arenaRadius * (0.64 + i * 0.09 + audio.bass * 0.08);
    const height = arenaRadius * (0.08 + i * 0.014 + audio.mid * 0.035);
    const hue = mixHue(runtime.primaryHue + i * 18, runtime.secondaryHue, 0.35 + Math.sin(t * 0.04 + i) * 0.22);
    const gradient = ctx.createLinearGradient(x - width, y - height, x + width, y + height);
    const alpha = baseAlpha * (0.55 + i * 0.12) * (0.78 + Math.sin(t * 0.18 + phase) * 0.22);
    gradient.addColorStop(0, `hsla(${hue}, 96%, 66%, 0)`);
    gradient.addColorStop(0.24, `hsla(${hue}, 96%, 68%, ${alpha * 0.42})`);
    gradient.addColorStop(0.5, `hsla(${hue + 48}, 96%, 72%, ${alpha})`);
    gradient.addColorStop(0.76, `hsla(${hue + 96}, 96%, 68%, ${alpha * 0.38})`);
    gradient.addColorStop(1, `hsla(${hue}, 96%, 66%, 0)`);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 0.035 + phase) * 0.28 + i * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawAudioreactiveParticles(ctx, current = {}, time = performance.now()) {
  const runtime = current?.audioReactive;
  if (!runtime?.particles?.length) return;
  const audio = runtime.audio || DEFAULT_AUDIO;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  runtime.particles.forEach((particle) => {
    const age = time - particle.bornAt;
    const progress = clamp(age / Math.max(1, particle.life));
    const alpha = (particle.alpha || 0) * (0.55 + audio.smoothedEnergy * 0.5);
    if (alpha <= 0.004) return;
    const pulse = Math.sin(time * 0.003 + particle.phase) * 0.5 + 0.5;
    const radius = particle.radius * (particle.kind === "pearl" ? 5.4 : particle.kind === "spark" ? 3.6 : 2.8) * (0.72 + pulse * 0.42);
    const grad = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius * 3.2);
    grad.addColorStop(0, `hsla(${particle.hue}, 96%, 78%, ${alpha})`);
    grad.addColorStop(0.38, `hsla(${particle.hue + 34}, 96%, 68%, ${alpha * 0.34})`);
    grad.addColorStop(1, `hsla(${particle.hue + 72}, 96%, 58%, 0)`);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius * (1 + progress * 0.22), 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });
  ctx.restore();
}

export function drawAudioreactiveSoonAura(ctx, current = {}, time = performance.now()) {
  const runtime = current?.audioReactive;
  const fish = current?.fish;
  if (!runtime?.mood || !fish) return;
  const mood = runtime.mood;
  const audio = runtime.audio || DEFAULT_AUDIO;
  const x = Number.isFinite(fish.x) ? fish.x : 0;
  const y = Number.isFinite(fish.y) ? fish.y : 0;
  const resonance = clamp(mood.resonance);
  const contact = clamp(mood.contact);
  const aura = clamp(0.08 + resonance * 0.28 + contact * 0.18 + audio.beatPulse * 0.12);
  if (aura <= 0.08) return;

  const pulse = Math.sin(time * 0.003 + runtime.breathPhase) * 0.5 + 0.5;
  const radius = 52 + aura * 118 + pulse * 18;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, `hsla(${runtime.goldHue}, 96%, 78%, ${aura * 0.18})`);
  grad.addColorStop(0.34, `hsla(${runtime.primaryHue}, 96%, 68%, ${aura * 0.12})`);
  grad.addColorStop(1, `hsla(${runtime.secondaryHue}, 96%, 60%, 0)`);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}
