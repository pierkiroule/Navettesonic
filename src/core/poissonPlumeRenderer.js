function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const BODY = {
  startY: -48,
  endY: 54,
  steps: 36,
};

function getSpinePoint(t, d) {
  const y = lerp(BODY.startY, BODY.endY, t);

  const tailWeight = Math.pow(t, 1.85);
  const midWeight = Math.sin(t * Math.PI);
  const headLock = Math.pow(t, 1.35);

  const phase = d.swimT * (4 + d.glide * 2.35);
  const straightGlide = Math.max(0, 1 - Math.abs(d.bend) * 1.6);

  const mainWave =
    Math.sin(t * Math.PI * 2.65 - phase) *
    (0.46 + d.glide * 1.9 + straightGlide * 0.45 + d.waveBoost * 0.5) *
    tailWeight;

  const subWave =
    Math.sin(t * Math.PI * 5.1 - phase * 1.24 + 0.6) *
    (0.08 + d.glide * 0.52 + straightGlide * 0.12 + d.waveBoost * 0.12) *
    tailWeight;

  const ropeLag = Math.pow(t, 1.9);
  const flexTwist = d.flex * Math.pow(t, 1.35) * (10 + d.glide * 13);

  const turnCurve =
    d.bend *
    Math.pow(t, 1.47) *
    (14 + d.glide * 14) *
    (0.74 + ropeLag * 0.46);

  const bodyArc =
    d.bend *
    Math.pow(midWeight, 0.9) *
    (6 + d.glide * 6.5);

  const x =
    (mainWave + subWave) * headLock +
    turnCurve +
    bodyArc +
    flexTwist;

  return { x, y };
}

function getSpineNormal(t, d) {
  const a = getSpinePoint(Math.max(0, t - 0.012), d);
  const b = getSpinePoint(Math.min(1, t + 0.012), d);

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;

  return { x: -dy / len, y: dx / len };
}

function getBodyWidth(t, breath = 0) {
  const head = Math.exp(-Math.pow((t - 0.12) / 0.16, 2)) * 8.4;
  const chest = Math.exp(-Math.pow((t - 0.34) / 0.24, 2)) * 5.5;
  const taper = Math.pow(1 - t, 1.45) * 1.2;

  return Math.max(
    0.65,
    head + chest + taper + breath * Math.sin(t * Math.PI) * 0.3
  );
}

function traceBody(ctx, d) {
  const left = [];
  const right = [];

  for (let i = 0; i <= BODY.steps; i++) {
    const t = i / BODY.steps;
    const p = getSpinePoint(t, d);
    const n = getSpineNormal(t, d);
    const w = getBodyWidth(t, d.bodyBreath);

    left.push({ x: p.x + n.x * w, y: p.y + n.y * w });
    right.push({ x: p.x - n.x * w, y: p.y - n.y * w });
  }

  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);

  for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);

  ctx.closePath();
}

function tracePlume(ctx, side, length, span, curl = 0) {
  const asym = 1 + side * 0.08 + curl * 0.12;
  const root = span * 0.2;
  const tipSway = side * span * (0.46 + curl * 0.22);

  ctx.beginPath();
  ctx.moveTo(0, 0);

  ctx.bezierCurveTo(
    side * root * asym,
    length * 0.1,
    side * span * (0.82 + curl * 0.14),
    length * 0.5,
    tipSway,
    length * 0.98
  );

  ctx.bezierCurveTo(
    side * span * (0.2 + curl * 0.06),
    length * 0.9,
    side * root * 0.72,
    length * 0.36,
    0,
    0
  );

  ctx.closePath();
}

function drawBubbleTrail(ctx, d) {
  const intensity = clamp01(
    0.22 + d.glide * 0.28 + d.reactiveEnergy * 0.2 + d.mouthPull * 0.14
  );

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < 20; i++) {
    const p = i / 19;
    const flow = (p + d.swimT * (0.085 + d.glide * 0.04)) % 1;
    const t = Math.min(1, flow * 0.68);

    const sp = getSpinePoint(t, d);
    const n = getSpineNormal(t, d);

    const side = Math.sin(i * 12.9898) > 0 ? 1 : -1;
    const spread = getBodyWidth(t, d.bodyBreath) * 0.76 + flow * 4.8;
    const drift = Math.sin(d.swimT * 2.1 + i * 0.8) * (0.25 + flow);

    const x = sp.x + n.x * side * spread + drift;
    const y = sp.y + n.y * side * spread - flow * 4;

    const pop = flow > 0.82 ? (flow - 0.82) / 0.18 : 0;
    const r = (1.0 * (1 - flow) + 0.1) * (1 - pop * 0.6);

    const alpha =
      intensity *
      (0.13 * (1 - flow) + 0.045) *
      (1 - pop * 0.75) *
      (0.75 + d.reactiveHighs * 0.3);

    ctx.strokeStyle = `hsla(${d.bodyHueTop + 8 + flow * 32}, 95%, 92%, ${alpha})`;
    ctx.lineWidth = 0.22 + (1 - flow) * 0.14;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBody(ctx, d) {
  const grad = ctx.createLinearGradient(-14, BODY.startY, 14, BODY.endY);

  grad.addColorStop(0, `hsla(${d.bodyHueTop}, 92%, 96%, ${0.9 + d.shimmerPulse * 0.05})`);
  grad.addColorStop(0.34, `hsla(${d.bodyHueMid}, 88%, 84%, ${0.78 + d.shimmerPulse * 0.08})`);
  grad.addColorStop(0.74, `hsla(${d.bodyHueLow}, 82%, 72%, ${0.7 + d.shimmerPulse * 0.08})`);
  grad.addColorStop(1, `hsla(${d.bodyHueLow + 14}, 78%, 62%, 0.64)`);

  ctx.fillStyle = grad;
  traceBody(ctx, d);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const glow = ctx.createRadialGradient(-4, -36, 1, -3, -18, 62);
  glow.addColorStop(0, `rgba(255,255,255,${0.3 + d.reactiveHighs * 0.07})`);
  glow.addColorStop(0.35, "rgba(215,255,250,0.12)");
  glow.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = glow;
  traceBody(ctx, d);
  ctx.fill();

  ctx.strokeStyle = `hsla(${d.bodyHueTop + 18}, 90%, 96%, 0.07)`;
  ctx.lineWidth = 0.45;

  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();

    for (let j = 0; j <= 14; j++) {
      const t = j / 14;
      const p = getSpinePoint(t, d);
      const n = getSpineNormal(t, d);
      const offset = i * 1.4 * Math.sin(t * Math.PI);

      const x = p.x + n.x * offset;
      const y = p.y + n.y * offset;

      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  ctx.restore();

  ctx.strokeStyle = `hsla(${d.bodyHueTop}, 90%, 96%, 0.18)`;
  ctx.lineWidth = 0.55;
  traceBody(ctx, d);
  ctx.stroke();
}

function drawFins(ctx, d) {
  const t = 0.38;
  const p = getSpinePoint(t, d);
  const n = getSpineNormal(t, d);
  const w = getBodyWidth(t, d.bodyBreath);

  [-1, 1].forEach((side) => {
    const curl = Math.sin(d.swimT * 2.3 + side * 1.7) * 0.3;

    const rootX = p.x + n.x * w * side * 0.95;
    const rootY = p.y + n.y * w * side * 0.95;

    const length = 24 + d.finMorph * 32 + d.glide * 6;
    const span = 10 + d.finMorph * 18;

    ctx.save();
    ctx.translate(rootX, rootY);
    ctx.rotate(side * (0.5 + d.finFlap * side + curl * 0.08 + d.bend * 0.1));

    const grad = ctx.createLinearGradient(0, 0, side * span, length);
    grad.addColorStop(0, `hsla(${190 + d.audioInfluence * 12}, 94%, 90%, ${0.3 + d.finMorph * 0.16})`);
    grad.addColorStop(0.5, `hsla(${d.bodyHueMid + 22}, 92%, 78%, ${0.18 + d.finMorph * 0.12})`);
    grad.addColorStop(1, `hsla(${d.bodyHueMid + 52}, 96%, 88%, 0)`);

    ctx.fillStyle = grad;
    tracePlume(ctx, side, length, span, curl);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `hsla(${d.bodyHueMid + 18}, 95%, 94%, ${0.1 + d.finMorph * 0.06})`;
    ctx.lineWidth = 0.42;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      side * span * 0.14,
      length * 0.24,
      side * span * 0.45,
      length * 0.56,
      side * span * 0.52,
      length * 0.88
    );
    ctx.stroke();

    ctx.strokeStyle = `hsla(${d.bodyHueTop + 26}, 95%, 97%, ${0.07 + d.finMorph * 0.05})`;
    ctx.lineWidth = 0.34;
    ctx.beginPath();
    ctx.moveTo(side * span * 0.06, length * 0.06);
    ctx.bezierCurveTo(
      side * span * 0.25,
      length * 0.22,
      side * span * 0.18,
      length * 0.6,
      side * span * 0.38,
      length * 0.92
    );
    ctx.stroke();

    ctx.restore();
  });
}

function drawTail(ctx, d) {
  const base = getSpinePoint(0.88, d);
  const root = getSpinePoint(0.94, d);
  const tip = getSpinePoint(1, d);
  const n = getSpineNormal(1, d);
  const tng = { x: n.y, y: -n.x };

  const wag =
    Math.sin(d.swimT * (7.2 + d.glide * 2.8)) * (3.8 + d.glide * 5.2) +
    d.bend * 5.8;

  const tailRootX = tip.x + wag * 0.12;
  const tailRootY = tip.y + tng.y * 2.4 + n.y * 0.8;
  const featherX = tip.x + wag * 0.28 + tng.x * 3.4;
  const featherY = tip.y + wag * 0.02 + tng.y * 3.4 + n.y * 0.6;

  // pédoncule souple
  const baseGrad = ctx.createLinearGradient(base.x, base.y, featherX, featherY);
  baseGrad.addColorStop(0, `hsla(${d.bodyHueMid}, 88%, 82%, 0.48)`);
  baseGrad.addColorStop(1, `hsla(${d.bodyHueTop + 20}, 90%, 92%, 0)`);

  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.moveTo(base.x + n.x * 2.4, base.y + n.y * 2.4);
  ctx.bezierCurveTo(
    root.x + tng.x * 1.6 + wag * 0.04,
    root.y + tng.y * 1.6,
    tailRootX,
    tailRootY,
    featherX - 1.2,
    featherY
  );
  ctx.bezierCurveTo(
    tailRootX,
    tailRootY,
    root.x - tng.x * 1.6 + wag * 0.04,
    root.y - tng.y * 1.6,
    base.x - n.x * 2.4,
    base.y - n.y * 2.4
  );
  ctx.closePath();
  ctx.fill();

  // panache plumeux attaché à la pointe
  const feathers = [
    { side: -1, len: 30, span: 6.0, rot: -0.3, alpha: 0.36 },
    { side: -1, len: 36, span: 5.0, rot: -0.06, alpha: 0.42 },
    { side: 1, len: 36, span: 5.0, rot: 0.06, alpha: 0.42 },
    { side: 1, len: 30, span: 6.0, rot: 0.3, alpha: 0.36 },
  ];

  ctx.save();
  ctx.translate(featherX, featherY);
  ctx.rotate(Math.atan2(tng.y, tng.x) + wag * 0.006 + d.bend * 0.08 - Math.PI / 2);

  feathers.forEach((f, i) => {
    const curl = Math.sin(d.swimT * 2 + i * 1.35) * 0.3;

    ctx.save();
    ctx.rotate(f.rot + curl * 0.07);

    const grad = ctx.createLinearGradient(0, 0, f.side * f.span, f.len);
    grad.addColorStop(0, `hsla(${d.bodyHueMid}, 90%, 86%, ${f.alpha})`);
    grad.addColorStop(0.52, `hsla(${d.bodyHueTop + 18}, 92%, 92%, ${f.alpha * 0.52})`);
    grad.addColorStop(1, `hsla(${d.bodyHueTop + 36}, 95%, 96%, 0)`);

    ctx.fillStyle = grad;
    tracePlume(ctx, f.side, f.len, f.span, curl);
    ctx.fill();

    ctx.restore();
  });

  ctx.restore();
}

function drawDorsalLine(ctx, d) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";

  ctx.strokeStyle = `hsla(${d.bodyHueTop + 12}, 95%, 96%, ${0.15 + d.reactiveHighs * 0.07})`;
  ctx.lineWidth = 0.85;

  ctx.beginPath();

  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const p = getSpinePoint(t, d);

    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }

  ctx.stroke();

  ctx.restore();
}

function drawBackSail(ctx, d) {
  const root = getSpinePoint(0.46, d);
  const crestLift = 11 + d.glide * 6 + d.reactiveHighs * 4;
  const trailLift = 18 + d.glide * 8;

  ctx.save();
  ctx.translate(root.x, root.y);
  ctx.rotate(d.bend * 0.12);

  const grad = ctx.createLinearGradient(0, 0, -6, -trailLift);
  grad.addColorStop(0, `hsla(${d.bodyHueMid + 10}, 90%, 82%, 0.22)`);
  grad.addColorStop(0.42, `hsla(${d.bodyHueTop + 16}, 94%, 92%, 0.12)`);
  grad.addColorStop(1, `hsla(${d.bodyHueTop + 36}, 98%, 98%, 0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-2, -1);
  ctx.quadraticCurveTo(-6, -crestLift * 0.55, -0.2, -trailLift);
  ctx.quadraticCurveTo(3.6, -crestLift * 0.65, 2.4, 0.8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawHead(ctx, d, mouthPull = 0) {
  const head = getSpinePoint(0.1, d);
  const nose = getSpinePoint(0.0, d);
  const n = getSpineNormal(0.1, d);
  const w = getBodyWidth(0.1, d.bodyBreath);

  ctx.save();

  const headGlow = ctx.createRadialGradient(head.x, head.y - 2, 1, head.x, head.y, w * 1.15);
  headGlow.addColorStop(0, "rgba(255,255,255,0.18)");
  headGlow.addColorStop(0.6, "rgba(255,255,255,0.06)");
  headGlow.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = headGlow;
  traceBody(ctx, d);
  ctx.fill();

  const tn = getSpineNormal(0.02, d);
  const tt = { x: tn.y, y: -tn.x };
  const mouthCx = nose.x + tt.x * 1.15;
  const mouthCy = nose.y + tt.y * 1.15;
  const mouthLong = 1.25 + mouthPull * 0.2;
  const mouthWide = 0.72 + Math.abs(mouthPull) * 0.12;

  const snoutPearl = ctx.createRadialGradient(mouthCx, mouthCy, 0.1, mouthCx, mouthCy, 3.8);
  snoutPearl.addColorStop(0, "rgba(255,255,255,0.26)");
  snoutPearl.addColorStop(0.55, "rgba(216,250,255,0.11)");
  snoutPearl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = snoutPearl;
  ctx.beginPath();
  ctx.arc(mouthCx, mouthCy, 3.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(14, 32, 48, 0.22)";
  ctx.beginPath();
  ctx.moveTo(mouthCx + tt.x * mouthLong, mouthCy + tt.y * mouthLong);
  ctx.quadraticCurveTo(
    mouthCx + tn.x * mouthWide,
    mouthCy + tn.y * mouthWide,
    mouthCx - tt.x * mouthLong,
    mouthCy - tt.y * mouthLong
  );
  ctx.quadraticCurveTo(
    mouthCx - tn.x * mouthWide * 0.92,
    mouthCy - tn.y * mouthWide * 0.92,
    mouthCx + tt.x * mouthLong,
    mouthCy + tt.y * mouthLong
  );
  ctx.closePath();
  ctx.fill();

  const blink = Math.pow(Math.max(0, Math.sin(d.swimT * 0.82)), 34);
  const eyeScale = 1 - blink * 0.68;

  [-1, 1].forEach((side) => {
    const ex = head.x + n.x * w * side * 0.92;
    const ey = head.y + n.y * w * side * 0.92;

    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(side * 0.18);

    ctx.fillStyle = "rgba(5, 14, 28, 0.66)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.2, 1.95 * eyeScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.84)";
    ctx.beginPath();
    ctx.arc(-0.3 * side, -0.6, 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  ctx.restore();
}

export function drawPoissonPlume(ctx, fish, options = {}) {
  const time = options.time ?? performance.now();
  const swimT = time * 0.001;

  const x = safeNumber(fish.x);
  const y = safeNumber(fish.y);
  const vx = safeNumber(fish.vx);
  const vy = safeNumber(fish.vy);
  const angle = safeNumber(fish.angle, -Math.PI / 2);
  const guideAngle = safeNumber(fish.guideAngle, angle);

  const maxSpeed = safeNumber(fish.maxSpeed, 3.1);
  const speed = Math.hypot(vx, vy);
  const mouthPull = safeNumber(fish.mouthPull, 0);
  const turnAmount = safeNumber(fish.turnAmount, 0);
  const bodyFlex = safeNumber(fish.bodyFlex, 0);
  const bodyWaveBoost = safeNumber(fish.bodyWaveBoost, 0);

  const audio = options.audio || {};
  const reactiveBass = safeNumber(audio.bass);
  const reactiveMids = safeNumber(audio.mids);
  const reactiveHighs = safeNumber(audio.highs);
  const reactiveEnergy = safeNumber(audio.energy);

  const proximity = safeNumber(options.proximity, 0.42);
  const audioInfluence = safeNumber(options.audioInfluence, 0.28);

  const glide = clamp01(speed / maxSpeed + reactiveBass * 0.22 + mouthPull * 0.22);

  const bend =
    clamp01(Math.abs(turnAmount)) *
    Math.sign(turnAmount || Math.sin(swimT * 0.7)) *
    (0.24 + glide * 1.32);
  let pathDelta = guideAngle - angle;
  while (pathDelta > Math.PI) pathDelta -= Math.PI * 2;
  while (pathDelta < -Math.PI) pathDelta += Math.PI * 2;
  const pathBend = Math.max(-1, Math.min(1, pathDelta / 0.9));

  const wingPresence = Math.max(
    0.18,
    Math.min(1, Math.pow(proximity, 1.35) * Math.max(0.28, audioInfluence))
  );

  const finMorph = Math.min(1, wingPresence * (0.72 + reactiveMids * 0.28));

  const finFlap =
    Math.sin(swimT * (7 + reactiveMids * 1.5 + audioInfluence * 1.7) + 0.5) *
    (0.08 + glide * 0.08 + reactiveMids * 0.04 + finMorph * 0.16 + Math.abs(turnAmount) * 0.06);

  const d = {
    swimT,
    glide,
    bend: bend + pathBend * 0.35,
    bodyBreath: Math.sin(swimT * 2.3) * 0.34,
    finFlap,
    finMorph,
    bodyHueTop: 184 + Math.sin(swimT * 1.6) * 7,
    bodyHueMid: 198 + Math.sin(swimT * 1.2 + 1.4) * 10,
    bodyHueLow: 214 + Math.sin(swimT * 1.8 + 2.1) * 9,
    shimmerPulse: Math.min(
      1.2,
      (Math.sin(swimT * (2.1 + reactiveHighs * 0.7 + audioInfluence * 0.8)) + 1) * 0.5 +
        reactiveHighs * 0.36
    ),
    reactiveHighs,
    reactiveEnergy,
    audioInfluence,
    mouthPull,
    flex: bodyFlex + pathBend * 0.5,
    waveBoost: bodyWaveBoost,
  };

  const depth = Math.max(1, Math.min(3, Math.round(safeNumber(fish.depth, 1))));
  const depthScale = depth === 1 ? 1.26 : depth === 2 ? 1.18 : 1.08;
  const depthAlpha = depth === 1 ? 1 : depth === 2 ? 0.9 : 0.78;

  const fluidScale = 1 + Math.sin(swimT * 3.1) * 0.006;

  const ropeStretch =
    1 +
    Math.sin(swimT * (6.2 + glide * 2.2) - glide * 0.8) *
      (0.018 + glide * 0.026);

  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.globalAlpha *= depthAlpha;

  ctx.scale(
    depthScale * fluidScale * ropeStretch * (1 - mouthPull * 0.02),
    depthScale * (1 / ropeStretch) * (1 + mouthPull * 0.025)
  );

  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  drawBubbleTrail(ctx, d);
  drawTail(ctx, d);
  drawFins(ctx, d);
  drawBackSail(ctx, d);
  drawBody(ctx, d);
  drawDorsalLine(ctx, d);
  drawHead(ctx, d, mouthPull);

  ctx.restore();
}
