import { distance, getBubbleVisualRadius } from "./geometry.js";
import { drawPoissonPlume } from "./poissonPlumeRenderer.js";
import { drawCharacters } from "./characters/characterEngine.js";
import { drawOdysseoPath } from "./odysseoPath.js";
import { ARENA_INNER_BOUNDARY_INSET } from "./constants.js";
import {
  drawFireflies,
  drawPlacedTriangles,
  drawPlumeTrail,
  drawResonanceBubbles,
} from "./fireflyGame.js";
import {
  drawEcosystemWorld,
} from "./ecosystemFx.js";

export function drawScene(ctx, rect, time, refs) {
  const { stateRef, arenaRef, cameraRef, enterWorld, exitWorld } = refs;
  const current = stateRef.current;
  const isCircuitMode = current.interactionMode === "circuit";

  drawOcean(ctx, rect, time, current);
  drawDepthVeil(ctx, rect, current.fish);


  enterWorld(ctx, rect, cameraRef, stateRef);

  drawArenaBoundary(ctx, arenaRef, time);
  drawArenaNightSky(ctx, arenaRef, time);
  drawArenaPulseHalo(ctx, arenaRef, time);
  drawPinkSeedTransporters(ctx, arenaRef, time);
  drawEcosystemWorld(ctx, current, time);
  drawWorldParticles(ctx, arenaRef, time);

  if (current.mode === "reso") {
    drawOdysseoPath(
      ctx,
      current.odysseoPath || [],
      current.odysseoDepthMarkers || [],
      time
    );
  }
  // drawFishTrail(ctx, current.fishTrail || [], time);

  if (!current.eyesClosed) {
    if (current.mode === "reso") {
      // Ancien circuit à balises désactivé : Odysséo utilise odysseoPath.
    }

    drawBubbles(
      ctx,
      current.bubbles,
      current.selectedBubbleId,
      current.mode,
      time,
      current.interactionMode
    );
  } else {
    drawEyesClosedEchoes(ctx, current.bubbles, current.fish, time);
  }

  drawPlacedTriangles(ctx, time);
  drawFireflies(ctx, time);
  // drawPlumeTrail(ctx);
  drawResonanceBubbles(ctx, time);
  if (current.interactionMode !== "edit") {
    drawCharacters(ctx, time);

drawFish(ctx, current.fish, time);
  }

  exitWorld(ctx);

  if (current.eyesClosed) {
    drawEyesClosedVeil(ctx, rect, time);
  }

  drawCameraVignette(ctx, rect, current.fish);
  drawHud(ctx, rect, current, arenaRef);
}

export function drawOcean(ctx, rect, time, current) {
  const gradient = ctx.createRadialGradient(
    rect.width * 0.5,
    rect.height * 0.42,
    40,
    rect.width * 0.5,
    rect.height * 0.5,
    Math.max(rect.width, rect.height)
  );

  gradient.addColorStop(0, "rgba(34, 211, 238, 0.2)");
  gradient.addColorStop(0.46, "rgba(15, 23, 42, 0.98)");
  gradient.addColorStop(1, "rgba(2, 6, 23, 1)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  if (current.eyesClosed) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }


}

export function drawDepthVeil() {
  return;
}

export function drawArenaBoundary(ctx, arenaRef, time) {
  const radius = arenaRef.current.radius;
  const pulse = Math.sin(time * 0.0012) * 8;

  ctx.save();

  ctx.beginPath();
  ctx.arc(0, 0, radius + pulse, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(125, 211, 252, 0.32)";
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius - ARENA_INNER_BOUNDARY_INSET + pulse * 0.4, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const halo = ctx.createRadialGradient(0, 0, radius * 0.72, 0, 0, radius);
  halo.addColorStop(0, "rgba(0,0,0,0)");
  halo.addColorStop(1, "rgba(14,165,233,0.12)");

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  drawArenaPolesAndMarkers(ctx, radius, time);

  ctx.restore();
}


function drawArenaPolesAndMarkers(ctx, radius, time) {
  const poles = [
    { label: "N", angle: -Math.PI / 2 },
    { label: "E", angle: 0 },
    { label: "S", angle: Math.PI / 2 },
    { label: "O", angle: Math.PI },
  ];

  const passageHalfArc = 0.055; // ~taille poisson rose sur la circonférence
  const pulse = (Math.sin(time * 0.003) * 0.5 + 0.5) * 0.22;

  poles.forEach(({ label, angle }) => {
    const alpha = 0.48 + pulse;

    ctx.beginPath();
    ctx.arc(0, 0, radius + 2, angle - passageHalfArc, angle + passageHalfArc);
    ctx.strokeStyle = `rgba(255, 141, 205, ${alpha})`;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.setLineDash([5, 9]);
    ctx.lineDashOffset = -time * 0.02;
    ctx.stroke();
    ctx.setLineDash([]);

    const textRadius = radius + 46;
    const tx = Math.cos(angle) * textRadius;
    const ty = Math.sin(angle) * textRadius;

    const glowRemaining = Math.max(0, (seedTransportState.poleGlowUntil[label] || 0) - time);
    const glowBoost = Math.min(1, glowRemaining / 3000);

    ctx.save();
    ctx.shadowBlur = 18 + glowBoost * 36;
    ctx.shadowColor = `rgba(255, 120, 220, ${0.78 + glowBoost * 0.22})`;
    ctx.fillStyle = glowBoost > 0
      ? `rgba(255, 120, 220, ${0.58 + glowBoost * 0.2})`
      : "rgba(255, 215, 248, 0.5)";
    ctx.font = "700 120px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, tx, ty);
    ctx.restore();
  });
}

function fitText(ctx, text, maxWidth, baseSize, minSize, family, weight = 500) {
  let size = baseSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return minSize;
}

export function drawWorldParticles(ctx, arenaRef, time) {
  const radius = arenaRef.current?.radius || 1200;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < 38; i += 1) {
    const seed = i * 928.213;
    const angle = i * 2.399963 + Math.sin(time * 0.00008 + i) * 0.025;
    const r = 90 + ((i * 173) % Math.floor(radius * 0.86));

    const x =
      Math.cos(angle) * r +
      Math.sin(time * 0.00018 + seed) * 5;

    const y =
      Math.sin(angle) * r +
      Math.cos(time * 0.00014 + seed) * 5;

    const size = 0.9 + (i % 4) * 0.42;
    const alpha =
      0.045 +
      (i % 5) * 0.012 +
      (Math.sin(time * 0.001 + i) * 0.5 + 0.5) * 0.018;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(165, 243, 252, ${alpha})`;
    ctx.fill();
  }

  ctx.restore();
}


export function drawBubbles(ctx, bubbles = [], selectedBubbleId, mode, time, interactionMode) {
  ctx.save();

  bubbles.forEach((bubble) => {
    const selected = bubble.id === selectedBubbleId;
    const pulse = Math.sin(time * 0.003 + bubble.x * 0.01) * 5;
    const depth = Math.round(bubble.depth || 1);
    const radius = getBubbleVisualRadius(bubble);
    const alpha = depth === 1 ? 0.58 : depth === 2 ? 0.46 : 0.32;

    const glow = ctx.createRadialGradient(
      bubble.x,
      bubble.y,
      radius * 0.2,
      bubble.x,
      bubble.y,
      radius * 1.7
    );

    glow.addColorStop(0, `hsla(${bubble.hue}, 100%, 74%, ${alpha})`);
    glow.addColorStop(1, `hsla(${bubble.hue}, 100%, 60%, 0)`);

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, radius * 1.7 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, radius + pulse, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${bubble.hue}, 90%, 66%, ${alpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, radius + 12 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = selected
      ? "rgba(255,255,255,0.95)"
      : `hsla(${bubble.hue}, 100%, 78%, 0.35)`;
    ctx.lineWidth = selected ? 5 : 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(3, 7, 18, 0.76)";
    ctx.font = "700 14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bubble.label, bubble.x, bubble.y);
    if (selected || mode === "compo" || interactionMode === "edit") {
      ctx.fillStyle = "rgba(226, 232, 240, 0.68)";
      ctx.font = "700 10px system-ui";
      ctx.fillText(`P${depth}`, bubble.x, bubble.y + radius + 18);
    }

    drawNestedDepositFigure(ctx, bubble, radius, bubble.deposits || [], time);
  });

  ctx.restore();
}

export function drawEyesClosedEchoes(ctx, bubbles = [], fish, time) {
  if (!fish) return;

  ctx.save();

  bubbles.forEach((bubble) => {
    const d = distance(bubble, fish);
    const strength = Math.max(0, 1 - d / 680);

    if (strength <= 0.015) return;

    const pulse = Math.sin(time * 0.004 + bubble.x * 0.01) * 10;
    const radius = bubble.r * (0.8 + strength * 1.4) + pulse;

    const glow = ctx.createRadialGradient(
      bubble.x,
      bubble.y,
      radius * 0.1,
      bubble.x,
      bubble.y,
      radius * 2.3
    );

    glow.addColorStop(0, `hsla(${bubble.hue}, 100%, 76%, ${0.05 + strength * 0.24})`);
    glow.addColorStop(0.45, `hsla(${bubble.hue}, 100%, 62%, ${0.03 + strength * 0.14})`);
    glow.addColorStop(1, `hsla(${bubble.hue}, 100%, 50%, 0)`);

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, radius * 2.3, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${bubble.hue}, 100%, 82%, ${0.06 + strength * 0.34})`;
    ctx.lineWidth = 1.5 + strength * 4;
    ctx.stroke();
  });

  ctx.restore();
}

export function drawNestedDepositFigure(ctx, bubble, radius, deposits = [], time = 0) {
  if (!Array.isArray(deposits) || !deposits.length) return;

  const hasMorphose = deposits.some((item) => item.typeId === "morphose");
  const hasOntose = deposits.some((item) => item.typeId === "ontose");
  const hasSemiose = deposits.some((item) => item.typeId === "semiose");

  const pulse = Math.sin(time * 0.004 + bubble.x * 0.01) * 0.5 + 0.5;
  const cx = bubble.x;
  const cy = bubble.y;

  const base = Math.max(16, radius * 0.34);
  const alpha = 0.46 + pulse * 0.12;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (hasMorphose) {
    ctx.beginPath();
    ctx.arc(cx, cy, base, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(326, 54%, 78%, ${alpha})`;
    ctx.lineWidth = 1.35;
    ctx.stroke();
  }

  if (hasOntose) {
    const s = base * 1.1;
    ctx.beginPath();
    ctx.rect(cx - s * 0.5, cy - s * 0.5, s, s);
    ctx.strokeStyle = `hsla(205, 48%, 78%, ${alpha})`;
    ctx.lineWidth = 1.35;
    ctx.stroke();
  }

  if (hasSemiose) {
    const t = base * 0.72;
    ctx.beginPath();
    ctx.moveTo(cx, cy - t * 0.58);
    ctx.lineTo(cx + t * 0.56, cy + t * 0.42);
    ctx.lineTo(cx - t * 0.56, cy + t * 0.42);
    ctx.closePath();
    ctx.strokeStyle = `hsla(48, 58%, 78%, ${alpha})`;
    ctx.lineWidth = 1.35;
    ctx.stroke();
  }

  if (hasMorphose && hasOntose && hasSemiose) {
    ctx.beginPath();
    ctx.arc(cx, cy, base + 5 + pulse * 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245, 250, 255, ${0.12 + pulse * 0.08})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawFish(ctx, fish, time) {
  if (!fish) return;

  ctx.save();

  try {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;

    drawPoissonPlume(ctx, fish, {
      time,
      audio: {
        bass: 0,
        mids: 0,
        highs: 0,
        energy: 0,
      },
      proximity: 0.9,
      audioInfluence: 0.8,
    });
  } catch (error) {
    console.warn("[Soon] poisson renderer failed", error);

    ctx.beginPath();
    ctx.arc(fish.x || 0, fish.y || 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();
  } finally {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function drawEyesClosedVeil(ctx, rect, time) {
  const t = time * 0.001;
  const breath = Math.sin(t * 0.7) * 0.5 + 0.5;

  ctx.save();

  ctx.fillStyle = "rgba(2, 6, 23, 0.46)";
  ctx.fillRect(0, 0, rect.width, rect.height);

  const mist = ctx.createRadialGradient(
    rect.width * 0.5,
    rect.height * 0.48,
    Math.min(rect.width, rect.height) * 0.08,
    rect.width * 0.5,
    rect.height * 0.5,
    Math.max(rect.width, rect.height) * 0.72
  );

  mist.addColorStop(0, `rgba(220, 235, 255, ${0.035 + breath * 0.025})`);
  mist.addColorStop(0.45, "rgba(80, 110, 160, 0.035)");
  mist.addColorStop(1, "rgba(2, 6, 23, 0.22)");

  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, rect.width, rect.height);

  const vignette = ctx.createRadialGradient(
    rect.width * 0.5,
    rect.height * 0.5,
    Math.min(rect.width, rect.height) * 0.28,
    rect.width * 0.5,
    rect.height * 0.5,
    Math.max(rect.width, rect.height) * 0.78
  );

  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.65, "rgba(0,0,0,0.12)");
  vignette.addColorStop(1, "rgba(0,0,0,0.52)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.restore();
}

export function drawCameraVignette(ctx, rect, fish) {
  const depth = Math.max(1, Math.min(3, Math.round(fish?.depth || 1)));
  const speed = Math.hypot(fish?.vx || 0, fish?.vy || 0);
  const speedNorm = Math.min(1, speed / 18);

  const alpha =
    depth === 1
      ? 0.16 + speedNorm * 0.03
      : depth === 2
        ? 0.24 + speedNorm * 0.04
        : 0.34 + speedNorm * 0.05;

  const gradient = ctx.createRadialGradient(
    rect.width * 0.5,
    rect.height * 0.48,
    Math.min(rect.width, rect.height) * 0.16,
    rect.width * 0.5,
    rect.height * 0.5,
    Math.max(rect.width, rect.height) * 0.72
  );

  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.68, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.restore();
}

function getPolePrompt(fish, arenaRadius) {
  if (!fish || !Number.isFinite(arenaRadius)) return null;

  const navigableRadius = arenaRadius - ARENA_INNER_BOUNDARY_INSET;
  const poleRadius = Math.max(0, navigableRadius - 8);
  const detectRadius = 120;

  const polePrompts = [
    {
      title: "NORD",
      question: "Qui rencontres-tu dans l’Onde sonore ?",
      x: 0,
      y: -poleRadius,
    },
    {
      title: "EST",
      question: "Que vois-tu les yeux fermés dans l’Onde sonore ?",
      x: poleRadius,
      y: 0,
    },
    {
      title: "SUD",
      question: "Qu’est-ce qui vibre en toi dans l’Onde sonore ?",
      x: 0,
      y: poleRadius,
    },
    {
      title: "OUEST",
      question: "Comment écoutes-tu l’Onde sonore ?",
      x: -poleRadius,
      y: 0,
    },
  ];

  let nearest = null;
  let nearestDist = Infinity;
  polePrompts.forEach((pole) => {
    const dist = Math.hypot((fish.x || 0) - pole.x, (fish.y || 0) - pole.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = pole;
    }
  });

  if (nearestDist > detectRadius) return null;
  return nearest;
}

export function drawHud(ctx, rect, current, arenaRef) {
  const fishDepth = Math.round(current?.fish?.depth || 1);
  const showDepth = current.mode === "compo" || current.mode === "reso";

  ctx.save();

  if (showDepth) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.66)";
    ctx.strokeStyle = "rgba(186, 230, 253, 0.42)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(rect.width - 90, 18, 64, 30, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`P${fishDepth}`, rect.width - 58, 33);
  }

  const arenaRadius = arenaRef?.current?.radius || 1200;
  const polePrompt = getPolePrompt(current?.fish, arenaRadius);
  if (polePrompt) {
    const viewportScale = typeof window !== "undefined" && window.visualViewport?.scale
      ? window.visualViewport.scale
      : 1;
    const zoomAdjust = 1 / Math.max(0.8, Math.min(2.2, viewportScale));
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const panelWidth = Math.min(rect.width - 28, 760 * zoomAdjust);
    const panelHeight = Math.min(rect.height * 0.28, 180 * zoomAdjust);
    const panelX = cx - panelWidth / 2;
    const panelY = cy - panelHeight / 2;

    ctx.save();
    ctx.fillStyle = "rgba(2, 6, 23, 0.5)";
    ctx.strokeStyle = "rgba(186, 230, 253, 0.42)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 225, 248, 0.95)";
    const titleSize = fitText(
      ctx,
      polePrompt.title,
      panelWidth - 24,
      34 * zoomAdjust,
      18 * zoomAdjust,
      "system-ui",
      700
    );
    ctx.font = `700 ${titleSize}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(polePrompt.title, cx, panelY + panelHeight * 0.34);

    ctx.fillStyle = "rgba(226, 232, 240, 0.96)";
    const questionSize = fitText(
      ctx,
      polePrompt.question,
      panelWidth - 30,
      24 * zoomAdjust,
      12 * zoomAdjust,
      "Georgia",
      500
    );
    ctx.font = `500 ${questionSize}px Georgia`;
    ctx.fillText(polePrompt.question, cx, panelY + panelHeight * 0.68);
    ctx.restore();
  }

  if (!current.eyesClosed) {
    ctx.restore();
    return;
  }

  ctx.fillStyle = "rgba(226, 232, 240, 0.78)";
  ctx.font = "500 18px Georgia";
  ctx.textAlign = "center";

  ctx.fillText("Réso•° · suis le circuit", rect.width / 2, rect.height / 2 + 98);

  ctx.restore();
}


export function drawArenaNightSky(ctx, arenaRef, time) {
  const radius = arenaRef.current?.radius || 1200;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  // Ciel étoilé bleu nuit autour de l'arène.
  for (let i = 0; i < 110; i += 1) {
    const angle = (Math.PI * 2 * i) / 110;
    const band = radius + 240 + (i % 7) * 70;
    const x = Math.cos(angle + time * 0.00001) * band;
    const y = Math.sin(angle + time * 0.00001) * band;
    const alpha = 0.14 + (Math.sin(time * 0.0018 + i * 1.3) * 0.5 + 0.5) * 0.26;

    ctx.beginPath();
    ctx.arc(x, y, 1 + (i % 3) * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(170, 210, 255, ${alpha})`;
    ctx.fill();
  }

  // Voile bleu nuit diffus.
  const veil = ctx.createRadialGradient(0, 0, radius * 0.9, 0, 0, radius * 2.1);
  veil.addColorStop(0, "rgba(10, 24, 64, 0)");
  veil.addColorStop(1, "rgba(16, 38, 86, 0.24)");
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.1, 0, Math.PI * 2);
  ctx.fillStyle = veil;
  ctx.fill();

  ctx.restore();
}

export function drawArenaPulseHalo(ctx, arenaRef, time) {
  const radius = arenaRef.current?.radius || 1200;
  const pulse = Math.sin(time * 0.0022) * 20;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const halo = ctx.createRadialGradient(0, 0, radius - 40, 0, 0, radius + 180 + pulse);
  halo.addColorStop(0, "rgba(255, 214, 238, 0)");
  halo.addColorStop(0.55, "rgba(255, 195, 120, 0.16)");
  halo.addColorStop(0.82, "rgba(255, 145, 214, 0.24)");
  halo.addColorStop(1, "rgba(255, 240, 160, 0)");

  ctx.beginPath();
  ctx.arc(0, 0, radius + 180 + pulse, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  ctx.restore();
}


const seedTransportState = {
  lastTime: 0,
  fishes: [],
  sprouts: [],
  poleGlowUntil: { N: 0, E: 0, S: 0, O: 0 },
};

function getPoleLabelFromAngle(angle, tolerance = 0.12) {
  const normalized = Math.atan2(Math.sin(angle), Math.cos(angle));
  const poles = [
    { label: "N", angle: -Math.PI / 2 },
    { label: "E", angle: 0 },
    { label: "S", angle: Math.PI / 2 },
    { label: "O", angle: Math.PI },
  ];

  for (const pole of poles) {
    const delta = Math.atan2(
      Math.sin(normalized - pole.angle),
      Math.cos(normalized - pole.angle)
    );
    if (Math.abs(delta) <= tolerance) return pole.label;
  }
  return null;
}

function initSeedTransporters(radius) {
  if (seedTransportState.fishes.length) return;
  for (let i = 0; i < 34; i += 1) {
    const angle = (Math.PI * 2 * i) / 34;
    seedTransportState.fishes.push({
      angle,
      orbit: radius + 190 + (i % 6) * 24,
      speed: 0.00022 + (i % 5) * 0.00003,
      phase: Math.random() * Math.PI * 2,
      carry: Math.random() > 0.28,
      diving: Math.random() > 0.55,
    });
  }
}

export function drawPinkSeedTransporters(ctx, arenaRef, time) {
  const radius = arenaRef.current?.radius || 1200;
  initSeedTransporters(radius);

  const prev = seedTransportState.lastTime || time;
  const dt = Math.max(8, Math.min(34, time - prev));
  seedTransportState.lastTime = time;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  seedTransportState.fishes.forEach((fish) => {
    fish.angle += fish.speed * dt;

    let currentOrbit = fish.orbit + Math.sin(time * 0.001 + fish.phase) * 10;
    const poleLabel = getPoleLabelFromAngle(fish.angle);
    const canCrossMembrane = Boolean(poleLabel);
    if (fish.diving) {
      if (canCrossMembrane) {
        currentOrbit -= 120 + Math.sin(time * 0.0018 + fish.phase) * 60;
      }
      if (currentOrbit < radius - 8 && fish.carry && Math.random() > 0.985) {
        seedTransportState.sprouts.push({
          x: Math.cos(fish.angle) * (radius - 20),
          y: Math.sin(fish.angle) * (radius - 20),
          bornAt: time,
        });
      }
      if (canCrossMembrane && currentOrbit < radius - 8) {
        seedTransportState.poleGlowUntil[poleLabel] = Math.max(
          seedTransportState.poleGlowUntil[poleLabel],
          time + 3000
        );
      }
    }

    const x = Math.cos(fish.angle) * currentOrbit;
    const y = Math.sin(fish.angle) * currentOrbit;
    const heading = fish.angle + Math.PI * 0.5;

    // Poisson rose top-view (2D).
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);

    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 141, 205, 0.62)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-18, -5);
    ctx.lineTo(-18, 5);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 176, 222, 0.52)";
    ctx.fill();

    ctx.restore();
  });

  // Graines-étoiles qui éclosent en lucioles (visuel).
  seedTransportState.sprouts = seedTransportState.sprouts.filter((sprout) => time - sprout.bornAt < 3400);
  seedTransportState.sprouts.forEach((sprout) => {
    const age = time - sprout.bornAt;
    const t = Math.min(1, age / 1200);

    // étoile blanche lumineuse
    ctx.save();
    ctx.translate(sprout.x, sprout.y);
    ctx.rotate(age * 0.0016);
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = `rgba(255,255,255,${0.22 + (1 - t) * 0.5})`;
      ctx.fillRect(-1.2, -8 - (1 - t) * 4, 2.4, 16 + (1 - t) * 8);
    }
    ctx.restore();

    // eclosion luciole
    if (age > 900) {
      const fly = (age - 900) * 0.03;
      ctx.beginPath();
      ctx.arc(
        sprout.x + Math.cos(fly * 0.07) * 10,
        sprout.y + Math.sin(fly * 0.09) * 10,
        2.2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(253, 255, 188, 0.85)";
      ctx.fill();
    }
  });

  ctx.restore();
}
