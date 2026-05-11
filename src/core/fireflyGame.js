import { FIREFLY_VOICES } from "../data/fireflyVoices.js";

const MAX_FIREFLIES = 18;
const MAX_TRAIL_POINTS = 42;

const FIREFLY_TRAIL_ATTACH_RADIUS = 42;
const FIREFLY_ATTACHED_SPACING_TARGETS = [0.34, 0.62, 0.9];
const FIREFLY_TAIL_MAX_ATTACHED = 3;
const FIREFLY_REPULSE_COOLDOWN_MS = 900;
const FISH_MOUTH_GUIDE_RADIUS = 58;
const FISH_MOUTH_GUIDE_FORCE = 0.045;

const PLUME_ATTRACT_RADIUS = 96;
const PLUME_ATTRACT_FORCE = 0.018;
const TRIANGLE_HEAD_PUSH_RADIUS = 76;
const TRIANGLE_HEAD_PUSH_FORCE = 0.42;
const TRIANGLE_FRICTION = 0.94;

const fireflies = [];
const plumeTrail = [];
let tailAttachmentCount = 0;
const placedTriangles = [];
const resonanceBubbles = [];

let spawnClock = 1;

const FIREFLY_TYPES = [
  {
    id: "morphose",
    label: "Morphose",
    symbol: "circle",
    voiceKind: "sensorialite",
    hue: 326,
  },
  {
    id: "semiose",
    label: "Sémiose",
    symbol: "triangle",
    voiceKind: "metaphore",
    hue: 48,
  },
  {
    id: "ontose",
    label: "Ontose",
    symbol: "square",
    voiceKind: "sagesse",
    hue: 205,
  },
];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function ensureTailFireflies(fish) {
  if (!fish.tailFireflies) fish.tailFireflies = [];
  return fish.tailFireflies;
}

function attachFireflyToTail(fish, firefly) {
  const tailFireflies = ensureTailFireflies(fish);

  if (tailFireflies.some((item) => item.id === firefly.id)) return;

  const index = tailFireflies.length;

  tailFireflies.push({
    id: firefly.id,
    slot: index,
    phase: Math.random() * Math.PI * 2,
  });

  fish.tailPower = Math.min(18, Math.max(fish.tailPower || 0, tailFireflies.length));
}

function growFishTail(fish, amount = 1) {
  if (!fish) return;

  const tailFireflies = ensureTailFireflies(fish);
  fish.tailPower = Math.min(18, Math.max(fish.tailPower || 0, tailFireflies.length + amount));
}

function safe(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function pickFireflyType() {
  return FIREFLY_TYPES[Math.floor(Math.random() * FIREFLY_TYPES.length)];
}

function getFireflyType(id) {
  return FIREFLY_TYPES.find((type) => type.id === id) || FIREFLY_TYPES[0];
}

function pickVoiceFragment(type) {
  const list = FIREFLY_VOICES[type.voiceKind] || [];
  return list[Math.floor(Math.random() * list.length)] || "";
}

function attachFireflyToTailSlot(firefly) {
  if (!firefly) return;

  if (!Number.isFinite(firefly.tailSlot)) {
    firefly.tailSlot = tailAttachmentCount;
    firefly.tailPhase = Math.random() * Math.PI * 2;
    tailAttachmentCount += 1;
  }
}

function getTail(fish) {
  const angle = safe(fish.angle, -Math.PI / 2);
  const offset = 28 + tailAttachmentCount * 8;

  return {
    x: safe(fish.x) - Math.cos(angle) * offset,
    y: safe(fish.y) - Math.sin(angle) * offset,
    angle,
  };
}

function getMouth(fish) {
  const angle = safe(fish.angle, -Math.PI / 2);

  return {
    x: safe(fish.x) + Math.cos(angle) * 38,
    y: safe(fish.y) + Math.sin(angle) * 38,
  };
}

function getArenaRadius() {
  return Math.max(window.innerWidth, window.innerHeight) * 0.95;
}

function getAttachedFirefliesSorted() {
  return fireflies
    .filter((item) => item.attached)
    .sort((a, b) => (a.attachedOrder || 0) - (b.attachedOrder || 0));
}

function getAttachedTypeIds() {
  return new Set(getAttachedFirefliesSorted().map((item) => item.typeId));
}

function normalizeAttachedOrders() {
  getAttachedFirefliesSorted().forEach((firefly, index) => {
    firefly.attachedOrder = index;
  });
}

function getPathPointAt(path, ratio) {
  if (!path || path.length === 0) return null;
  if (path.length === 1) return path[0];

  const safeRatio = Math.max(0, Math.min(1, ratio));
  const total = path.length - 1;
  const raw = safeRatio * total;
  const index = Math.floor(raw);
  const t = raw - index;

  const a = path[index];
  const b = path[Math.min(path.length - 1, index + 1)];

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function getDistanceToPath(path, point) {
  if (!path || path.length === 0) return Infinity;

  let best = Infinity;

  for (let i = 0; i < path.length; i += 2) {
    const p = path[i];
    const d = Math.hypot(point.x - p.x, point.y - p.y);

    if (d < best) best = d;
  }

  return best;
}

function spawnFirefly() {
  const type = pickFireflyType();
  const angle = Math.random() * Math.PI * 2;
  const radius = rand(160, 440);

  fireflies.push({
    id: makeId("luciole"),
    typeId: type.id,
    symbol: type.symbol,
    voiceKind: type.voiceKind,
    voiceText: pickVoiceFragment(type),
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    vx: Math.cos(angle + Math.PI + rand(-0.7, 0.7)) * rand(0.35, 0.85),
    vy: Math.sin(angle + Math.PI + rand(-0.7, 0.7)) * rand(0.35, 0.85),
    phase: rand(0, Math.PI * 2),
    r: rand(11, 16),
    alpha: 1,
    attached: false,
    attachedOrder: 0,
    linkedCooldownUntil: 0,
    mouthPushCooldownUntil: 0,
    pushedAt: 0,
    bornAt: performance.now(),
  });
}

function updatePlumeTrail(fish) {
  const tail = getTail(fish);
  const speed = Math.hypot(fish.vx || 0, fish.vy || 0);
  const last = plumeTrail[0];

  if (!last || Math.hypot(last.x - tail.x, last.y - tail.y) > 4 || speed > 0.4) {
    plumeTrail.unshift({
      x: tail.x,
      y: tail.y,
      bornAt: performance.now(),
      life: 1800,
    });
  }

  if (plumeTrail.length > MAX_TRAIL_POINTS) {
    plumeTrail.length = MAX_TRAIL_POINTS;
  }
}

function attachSingleFireflyToTail(firefly, now) {
  if (!firefly || firefly.attached) return false;

  const attached = getAttachedFirefliesSorted();
  const attachedTypes = getAttachedTypeIds();

  // Règle hétérogène : pas deux lucioles du même type.
  if (attachedTypes.has(firefly.typeId)) {
    firefly.linkedCooldownUntil = now + FIREFLY_REPULSE_COOLDOWN_MS;
    firefly.vx *= -0.6;
    firefly.vy *= -0.6;
    return false;
  }

  if (attached.length >= FIREFLY_TAIL_MAX_ATTACHED) {
    firefly.linkedCooldownUntil = now + FIREFLY_REPULSE_COOLDOWN_MS;
    return false;
  }

  firefly.attached = true;
        attachFireflyToTail(fish, firefly);
        growFishTail(fish, 1);
  firefly.attachedOrder = attached.length;
  firefly.attachedAt = now;
  firefly.linkedCooldownUntil = now + FIREFLY_REPULSE_COOLDOWN_MS;
  firefly.vx *= 0.25;
  firefly.vy *= 0.25;

  normalizeAttachedOrders();

  return true;
}

function updateAttachedFirefly(firefly, fish) {
  attachFireflyToTailSlot(firefly);

  const slot = Math.max(0, firefly.tailSlot || 0);
  const phase = firefly.tailPhase || 0;
  const angle = safe(fish.angle, -Math.PI / 2);

  const distanceBack = 24 + slot * 16;
  const side = slot % 2 === 0 ? 1 : -1;

  const time = performance.now();
  const wave =
    Math.sin(time * 0.004 + phase) * 5 +
    Math.sin(time * 0.002 + slot * 0.7) * 3;

  const sideOffset =
    side * (7 + Math.min(16, slot * 0.9)) + wave;

  const tx =
    safe(fish.x) -
    Math.cos(angle) * distanceBack +
    Math.cos(angle + Math.PI / 2) * sideOffset;

  const ty =
    safe(fish.y) -
    Math.sin(angle) * distanceBack +
    Math.sin(angle + Math.PI / 2) * sideOffset;

  const spring = 0.07;

  firefly.vx += (tx - firefly.x) * spring + (fish.vx || 0) * 0.006;
  firefly.vy += (ty - firefly.y) * spring + (fish.vy || 0) * 0.006;

  firefly.vx *= 0.83;
  firefly.vy *= 0.83;

  firefly.x += firefly.vx;
  firefly.y += firefly.vy;
}

function guideFireflyWithMouth(firefly, fish, now) {
  if (!firefly || firefly.attached) return;
  if (!isFireflyUsefulForCurrentTriangle(firefly)) return;

  const mouth = getMouth(fish);
  const dx = mouth.x - firefly.x;
  const dy = mouth.y - firefly.y;
  const d = Math.hypot(dx, dy) || 1;

  if (d > FISH_MOUTH_GUIDE_RADIUS + firefly.r) return;

  const strength = 1 - d / (FISH_MOUTH_GUIDE_RADIUS + firefly.r);

  // Guidage très doux : la luciole vient légèrement vers la bouche.
  firefly.vx += (dx / d) * FISH_MOUTH_GUIDE_FORCE * strength;
  firefly.vy += (dy / d) * FISH_MOUTH_GUIDE_FORCE * strength;

  // Elle prend un peu la direction du poisson, sans être expulsée.
  firefly.vx += (fish.vx || 0) * 0.018 * strength;
  firefly.vy += (fish.vy || 0) * 0.018 * strength;

  firefly.pushedAt = now;
}

function isFireflyUsefulForCurrentTriangle(firefly) {
  if (!firefly || firefly.attached) return false;

  const attachedTypes = getAttachedTypeIds();

  // Si ce type est déjà accroché, cette luciole ne convient pas.
  return !attachedTypes.has(firefly.typeId);
}

function getClosestTrailPoint(point) {
  if (!plumeTrail.length) return null;

  let best = null;
  let bestDistance = Infinity;

  for (let i = 0; i < plumeTrail.length; i += 2) {
    const trailPoint = plumeTrail[i];
    const d = Math.hypot(point.x - trailPoint.x, point.y - trailPoint.y);

    if (d < bestDistance) {
      bestDistance = d;
      best = trailPoint;
    }
  }

  return best ? { point: best, distance: bestDistance } : null;
}

function attractUsefulFireflyToPlume(firefly, now) {
  if (!firefly || firefly.attached) return;
  if (!isFireflyUsefulForCurrentTriangle(firefly)) return;

  const closest = getClosestTrailPoint({
    x: firefly.x,
    y: firefly.y,
  });

  if (!closest) return;
  if (closest.distance > PLUME_ATTRACT_RADIUS) return;

  const dx = closest.point.x - firefly.x;
  const dy = closest.point.y - firefly.y;
  const d = Math.hypot(dx, dy) || 1;
  const strength = 1 - closest.distance / PLUME_ATTRACT_RADIUS;

  firefly.vx += (dx / d) * PLUME_ATTRACT_FORCE * strength;
  firefly.vy += (dy / d) * PLUME_ATTRACT_FORCE * strength;

  firefly.pushedAt = now;
}

function tryCollectFirefly(firefly, now) {
  if (firefly.attached) return false;
  if (now < (firefly.linkedCooldownUntil || 0)) return false;

  const d = getDistanceToPath(plumeTrail, {
    x: firefly.x,
    y: firefly.y,
  });

  if (d > FIREFLY_TRAIL_ATTACH_RADIUS) return false;

  return attachSingleFireflyToTail(firefly, now);
}

function hasCompleteHaikuTriangle() {
  const attached = getAttachedFirefliesSorted();

  if (attached.length !== 3) return false;

  const types = new Set(attached.map((item) => item.typeId));

  return (
    types.has("morphose") &&
    types.has("semiose") &&
    types.has("ontose")
  );
}

function drawMinimalSymbol(ctx, symbol, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * 0.18);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (symbol === "circle") {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (symbol === "square") {
    ctx.beginPath();
    ctx.rect(x - size * 0.38, y - size * 0.38, size * 0.76, size * 0.76);
    ctx.stroke();
  }

  if (symbol === "triangle") {
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.46);
    ctx.lineTo(x + size * 0.42, y + size * 0.34);
    ctx.lineTo(x - size * 0.42, y + size * 0.34);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

function getTrianglePoints() {
  const attached = getAttachedFirefliesSorted();
  if (attached.length < 3) return [];

  return attached.slice(0, 3).map((firefly) => ({
    x: firefly.x,
    y: firefly.y,
    firefly,
  }));
}

function getTriangleCenter(points) {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

function spawnResonanceBubble(x, y, hue, now) {
  resonanceBubbles.push({
    x,
    y,
    hue,
    bornAt: now,
    life: rand(900, 1600),
    r: rand(2, 5),
    vx: rand(-0.18, 0.18),
    vy: rand(-0.18, 0.18),
  });

  if (resonanceBubbles.length > 80) {
    resonanceBubbles.splice(0, resonanceBubbles.length - 80);
  }
}

function autoDetachHaikuTriangle(now) {
  if (!hasCompleteHaikuTriangle()) return false;

  const attached = getAttachedFirefliesSorted().slice(0, 3);

  if (attached.length < 3) return false;

  const points = getTrianglePoints();
  const center = getTriangleCenter(points);

  const placedRadius = 48;

  const placed = attached.map((firefly, index) => {
    const type = getFireflyType(firefly.typeId);
    const a = -Math.PI / 2 + index * ((Math.PI * 2) / 3);

    return {
      id: firefly.id,
      typeId: firefly.typeId,
      symbol: type.symbol,
      voiceKind: firefly.voiceKind,
      text: firefly.voiceText,
      dx: Math.cos(a) * placedRadius,
      dy: Math.sin(a) * placedRadius,
    };
  });

  placedTriangles.push({
    id: makeId("triangle"),
    x: center.x + rand(-20, 20),
    y: center.y + rand(-20, 20),
    bornAt: now,
    autoPlaced: true,
    fireflies: placed,
  });

  for (let i = fireflies.length - 1; i >= 0; i -= 1) {
    if (fireflies[i].attached) {
      fireflies.splice(i, 1);
    }
  }

  normalizeAttachedOrders();

  plumeTrail.length = Math.min(plumeTrail.length, 10);

  return true;
}

function pushPlacedTrianglesWithHead(fish) {
  if (!fish || !placedTriangles.length) return;

  const mouth = getMouth(fish);

  placedTriangles.forEach((triangle) => {
    const dx = triangle.x - mouth.x;
    const dy = triangle.y - mouth.y;
    const d = Math.hypot(dx, dy) || 1;

    if (d > TRIANGLE_HEAD_PUSH_RADIUS) return;

    const nx = dx / d;
    const ny = dy / d;
    const strength = 1 - d / TRIANGLE_HEAD_PUSH_RADIUS;
    const fishSpeed = Math.hypot(fish.vx || 0, fish.vy || 0);

    triangle.vx = triangle.vx || 0;
    triangle.vy = triangle.vy || 0;

    // Poussée douce : direction tête -> triangle + petite inertie du poisson.
    triangle.vx += nx * TRIANGLE_HEAD_PUSH_FORCE * strength;
    triangle.vy += ny * TRIANGLE_HEAD_PUSH_FORCE * strength;

    triangle.vx += (fish.vx || 0) * 0.025 * strength;
    triangle.vy += (fish.vy || 0) * 0.025 * strength;

    triangle.pushedAt = performance.now();
    triangle.pushAmount = Math.min(1, strength + fishSpeed * 0.04);
  });
}

function updatePlacedTrianglesPhysics() {
  placedTriangles.forEach((triangle) => {
    triangle.vx = (triangle.vx || 0) * TRIANGLE_FRICTION;
    triangle.vy = (triangle.vy || 0) * TRIANGLE_FRICTION;

    triangle.x += triangle.vx;
    triangle.y += triangle.vy;

    if (Math.abs(triangle.vx) < 0.002) triangle.vx = 0;
    if (Math.abs(triangle.vy) < 0.002) triangle.vy = 0;

    triangle.pushAmount = (triangle.pushAmount || 0) * 0.92;
  });
}

export function updateFireflyGame({ fish, mode }) {
  if (!fish) return;

  const now = performance.now();
  const arenaRadius = getArenaRadius();

  updatePlumeTrail(fish);

  pushPlacedTrianglesWithHead(fish);
  updatePlacedTrianglesPhysics();

  if (mode === "compo") {
    spawnClock += 0.08;

    while (spawnClock >= 1) {
      spawnClock -= 1;

      const freeCount = fireflies.filter((item) => !item.attached).length;

      if (fireflies.length < MAX_FIREFLIES && freeCount < 12) {
        spawnFirefly(arenaRadius);
      }
    }
  }

  for (let i = fireflies.length - 1; i >= 0; i -= 1) {
    const firefly = fireflies[i];

    if (firefly.attached) {
      updateAttachedFirefly(firefly, fish);
      continue;
    }

    firefly.phase += 0.05;
    firefly.vx += Math.sin(now * 0.0008 + firefly.phase) * 0.006;
    firefly.vy += Math.cos(now * 0.0007 + firefly.phase) * 0.006;

    firefly.x += firefly.vx;
    firefly.y += firefly.vy;

    guideFireflyWithMouth(firefly, fish, now);
    attractUsefulFireflyToPlume(firefly, now);
    tryCollectFirefly(firefly, now);

    const d = Math.hypot(firefly.x, firefly.y);

    if (d > arenaRadius + 420 && now - firefly.bornAt > 12000) {
      fireflies.splice(i, 1);
    }
  }

  if (hasCompleteHaikuTriangle()) {
    const points = getTrianglePoints();
    const center = getTriangleCenter(points);

    if (Math.random() < 0.22) {
      spawnResonanceBubble(center.x, center.y, rand(185, 250), now);
    }

    autoDetachHaikuTriangle(now);
  }

  for (let i = resonanceBubbles.length - 1; i >= 0; i -= 1) {
    const bubble = resonanceBubbles[i];
    const age = now - bubble.bornAt;

    bubble.x += bubble.vx;
    bubble.y += bubble.vy;
    bubble.vy -= 0.002;

    if (age > bubble.life) {
      resonanceBubbles.splice(i, 1);
    }
  }

  for (let i = plumeTrail.length - 1; i >= 0; i -= 1) {
    const point = plumeTrail[i];
    const age = now - point.bornAt;

    if (age > point.life) {
      plumeTrail.splice(i, 1);
    }
  }
}

export function drawPlumeTrail(ctx) {
  if (!plumeTrail.length) return;

  ctx.save();

  for (let i = plumeTrail.length - 1; i > 0; i -= 1) {
    const point = plumeTrail[i];
    const prev = plumeTrail[i - 1];

    const k = 1 - i / plumeTrail.length;
    const age = (performance.now() - point.bornAt) / point.life;
    const alpha = Math.max(0, (1 - age) * k * 0.28);

    if (alpha <= 0.008) continue;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = `rgba(245, 250, 255, ${alpha})`;
    ctx.lineWidth = 0.55 + k * 1.15;
    ctx.lineCap = "round";
    ctx.stroke();

    if (i % 4 === 0) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 0.8 + k * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(250, 252, 255, ${alpha * 0.62})`;
      ctx.fill();
    }
  }

  // Triangle haïkuatique : la traîne devient triangle quand les 3 types sont réunis.
  if (hasCompleteHaikuTriangle()) {
    const points = getTrianglePoints();
    const center = getTriangleCenter(points);
    const pulse = Math.sin(performance.now() * 0.006) * 0.5 + 0.5;

    // On écarte visuellement les sommets autour du centre.
    const expanded = points.map((point) => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const len = Math.hypot(dx, dy) || 1;
      const expand = 1.55 + pulse * 0.16;

      return {
        x: center.x + dx * expand + (dx / len) * 10,
        y: center.y + dy * expand + (dy / len) * 10,
        firefly: point.firefly,
      };
    });

    // Halo respirant très discret dans le triangle.
    ctx.beginPath();
    ctx.moveTo(expanded[0].x, expanded[0].y);
    ctx.lineTo(expanded[1].x, expanded[1].y);
    ctx.lineTo(expanded[2].x, expanded[2].y);
    ctx.closePath();
    ctx.fillStyle = `rgba(245, 250, 255, ${0.025 + pulse * 0.025})`;
    ctx.fill();

    // Contour pulsant.
    ctx.beginPath();
    ctx.moveTo(expanded[0].x, expanded[0].y);
    ctx.lineTo(expanded[1].x, expanded[1].y);
    ctx.lineTo(expanded[2].x, expanded[2].y);
    ctx.closePath();
    ctx.strokeStyle = `rgba(245, 250, 255, ${0.42 + pulse * 0.28})`;
    ctx.lineWidth = 1.6 + pulse * 0.8;
    ctx.stroke();

    // Petites bulles sur les côtés du triangle.
    expanded.forEach((point, index) => {
      const next = expanded[(index + 1) % expanded.length];

      for (let j = 1; j <= 3; j += 1) {
        const t = j / 4;
        const bx = point.x + (next.x - point.x) * t;
        const by = point.y + (next.y - point.y) * t;
        const bPulse = Math.sin(performance.now() * 0.005 + index * 2 + j) * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(bx, by, 1.1 + bPulse * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 250, 255, ${0.18 + bPulse * 0.16})`;
        ctx.fill();
      }
    });
  }

  ctx.restore();
}

export function drawFireflies(ctx, time) {
  ctx.save();

  fireflies.forEach((firefly) => {
    const type = getFireflyType(firefly.typeId);
    const pulse = Math.sin(time * 0.004 + firefly.phase) * 0.5 + 0.5;
    const r = firefly.r * (firefly.attached ? 0.82 : 0.92) * (0.94 + pulse * 0.18);
    const alpha = firefly.attached ? 0.86 : 0.72;
    const pushedAge = performance.now() - (firefly.pushedAt || 0);
    const pushedGlow = Math.max(0, 1 - pushedAge / 260);

    const glow = ctx.createRadialGradient(
      firefly.x,
      firefly.y,
      0,
      firefly.x,
      firefly.y,
      r * 3.1
    );

    glow.addColorStop(0, `hsla(${type.hue}, 72%, 82%, ${0.22 * alpha})`);
    glow.addColorStop(0.48, `hsla(${type.hue}, 70%, 70%, ${0.08 * alpha})`);
    glow.addColorStop(1, `hsla(${type.hue}, 70%, 60%, 0)`);

    ctx.beginPath();
    ctx.arc(firefly.x, firefly.y, r * 3.1, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    if (pushedGlow > 0.01) {
      ctx.beginPath();
      ctx.arc(firefly.x, firefly.y, r * (1.6 + pushedGlow * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 250, 255, ${0.055 * pushedGlow})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(firefly.x, firefly.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${type.hue}, 78%, ${firefly.attached ? 86 : 74}%, ${alpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(firefly.x - r * 0.22, firefly.y - r * 0.22, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
    ctx.fill();

    if (firefly.attached) {
      drawMinimalSymbol(
        ctx,
        type.symbol,
        firefly.x,
        firefly.y,
        r * 0.9,
        "rgba(15, 23, 42, 0.58)"
      );
    }
  });

  ctx.restore();
}

export function drawResonanceBubbles(ctx, time) {
  ctx.save();

  resonanceBubbles.forEach((bubble) => {
    const age = performance.now() - bubble.bornAt;
    const k = age / bubble.life;
    const alpha = Math.max(0, Math.sin(Math.PI * k) * 0.42);

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r * (1 + k * 2.2), 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${bubble.hue}, 60%, 84%, ${alpha})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });

  ctx.restore();
}

export function detachHaikuTriangleAt(x, y) {
  if (!hasCompleteHaikuTriangle()) return false;

  const attached = getAttachedFirefliesSorted().slice(0, 3);

  if (attached.length < 3) return false;

  // Triangle posé : forme stable, lisible, indépendante de la traîne.
  const placedRadius = 48;

  const placed = attached.map((firefly, index) => {
    const type = getFireflyType(firefly.typeId);
    const a = -Math.PI / 2 + index * ((Math.PI * 2) / 3);

    return {
      id: firefly.id,
      typeId: firefly.typeId,
      symbol: type.symbol,
      voiceKind: firefly.voiceKind,
      text: firefly.voiceText,
      dx: Math.cos(a) * placedRadius,
      dy: Math.sin(a) * placedRadius,
    };
  });

  placedTriangles.push({
    id: makeId("triangle"),
    x,
    y,
    bornAt: performance.now(),
    fireflies: placed,
  });

  // Suppression robuste : on retire toutes les lucioles accrochées.
  for (let i = fireflies.length - 1; i >= 0; i -= 1) {
    if (fireflies[i].attached) {
      fireflies.splice(i, 1);
    }
  }

  normalizeAttachedOrders();

  // Nettoyage visuel de la traîne pour éviter un triangle fantôme.
  plumeTrail.length = Math.min(plumeTrail.length, 12);

  return true;
}

export function drawPlacedTriangles(ctx, time) {
  ctx.save();

  placedTriangles.forEach((triangle) => {
    const pulse = Math.sin(time * 0.004 + triangle.x * 0.01) * 0.5 + 0.5;
    const push = triangle.pushAmount || 0;

    const points = triangle.fireflies.map((item) => ({
      x: triangle.x + item.dx,
      y: triangle.y + item.dy,
      item,
    }));

    if (points.length < 3) return;

    // Halo très subtil quand le triangle est déplacé.
    if (push > 0.02) {
      ctx.beginPath();
      ctx.arc(triangle.x, triangle.y, 42 + push * 34, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(245, 250, 255, ${0.08 * push})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();
    ctx.fillStyle = `rgba(245, 250, 255, ${0.024 + pulse * 0.018})`;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();
    ctx.strokeStyle = `rgba(245, 250, 255, ${0.34 + pulse * 0.18 + push * 0.18})`;
    ctx.lineWidth = 1.4 + pulse * 0.35 + push * 0.5;
    ctx.stroke();

    points.forEach((point) => {
      const type = getFireflyType(point.item.typeId);

      ctx.beginPath();
      ctx.arc(point.x, point.y, 8.5 + pulse * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${type.hue}, 50%, 78%, 0.82)`;
      ctx.fill();

      drawMinimalSymbol(
        ctx,
        type.symbol,
        point.x,
        point.y,
        8.4,
        "rgba(15, 23, 42, 0.62)"
      );
    });

    ctx.beginPath();
    ctx.arc(triangle.x, triangle.y, 4.5 + pulse * 1.1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245, 250, 255, ${0.38 + pulse * 0.18})`;
    ctx.fill();
  });

  ctx.restore();
}

export function getCollectedFireflyCount() {
  return fireflies.filter((item) => item.attached).length;
}

export function getFireflyDebugStats() {
  return {
    total: fireflies.length,
    attached: fireflies.filter((item) => item.attached).length,
    completeTriangle: hasCompleteHaikuTriangle(),
    placedTriangles: placedTriangles.length,
  };
}

export function resetFireflyGame() {
  fireflies.length = 0;
  plumeTrail.length = 0;
  tailAttachmentCount = 0;
  placedTriangles.length = 0;
  resonanceBubbles.length = 0;
  spawnClock = 1;
}
