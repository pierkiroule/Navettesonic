import { distance, getBubbleVisualRadius } from "./geometry.js";
import { drawPoissonPlume } from "./poissonPlumeRenderer.js";
import { drawCharacters } from "./characters/characterEngine.js";
import { drawOdysseoPath } from "./odysseoPath.js";
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
  drawArenaCloudRing(ctx, arenaRef, time);
  drawOrbitingBubbleBird(ctx, arenaRef, time);
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
  drawHud(ctx, rect, current);
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
  ctx.arc(0, 0, radius - 32 + pulse * 0.4, 0, Math.PI * 2);
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

  ctx.restore();
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

export function drawHud(ctx, rect, current) {
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


export function drawArenaCloudRing(ctx, arenaRef, time) {
  const radius = arenaRef.current?.radius || 1200;
  const orbitBase = radius + 180;
  const cloudCount = 14;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < cloudCount; i += 1) {
    const progress = time * 0.000035 * (0.8 + (i % 4) * 0.11);
    const angle = (Math.PI * 2 * i) / cloudCount + progress;
    const orbit = orbitBase + (i % 3) * 46 + Math.sin(time * 0.0007 + i) * 10;
    const cx = Math.cos(angle) * orbit;
    const cy = Math.sin(angle) * orbit;

    // Petits nuages composés de 3 à 5 bulles blanches.
    const bubbleCount = 3 + (i % 3);
    for (let j = 0; j < bubbleCount; j += 1) {
      const localAngle = (Math.PI * 2 * j) / bubbleCount + Math.sin(time * 0.0012 + i + j) * 0.2;
      const offset = 12 + j * 7;
      const bx = cx + Math.cos(localAngle) * offset;
      const by = cy + Math.sin(localAngle) * (offset * 0.72);
      const br = 12 + (j % 2) * 4 + (i % 2) * 2;

      const glow = ctx.createRadialGradient(bx, by, br * 0.2, bx, by, br * 2.1);
      glow.addColorStop(0, "rgba(255,255,255,0.38)");
      glow.addColorStop(0.7, "rgba(255,255,255,0.14)");
      glow.addColorStop(1, "rgba(255,255,255,0)");

      ctx.beginPath();
      ctx.arc(bx, by, br * 2.1, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fill();
    }
  }

  ctx.restore();
}


export function drawOrbitingBubbleBird(ctx, arenaRef, time) {
  const radius = arenaRef.current?.radius || 1200;
  const orbit = radius + 260;
  const angle = time * 0.00032;
  const x = Math.cos(angle) * orbit;
  const y = Math.sin(angle) * orbit;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI * 0.5 + Math.sin(time * 0.0013) * 0.25);

  const bodyGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, 56);
  bodyGlow.addColorStop(0, "rgba(255,255,255,0.4)");
  bodyGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.fillStyle = bodyGlow;
  ctx.fill();

  ctx.strokeStyle = "rgba(250,255,255,0.75)";
  ctx.lineCap = "round";

  // Corps oiseau-bulle taille moyenne.
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-30, 8);
  ctx.quadraticCurveTo(-6, -24, 26, -2);
  ctx.quadraticCurveTo(2, 16, -22, 14);
  ctx.stroke();

  // Cou et tête.
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(6, -2);
  ctx.quadraticCurveTo(18, -30, 30, -20);
  ctx.stroke();

  // Bec.
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(30, -20);
  ctx.lineTo(46, -24);
  ctx.stroke();

  // Petite traîne de bulles pour l'effet virevoltant.
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const bx = -12 - t * 28 + Math.sin(time * 0.002 + i) * 2;
    const by = 10 + t * 18 + Math.cos(time * 0.0024 + i) * 2;
    const br = 3 + (4 - i) * 1.2;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.16 + (4 - i) * 0.05})`;
    ctx.fill();
  }

  ctx.restore();
}
