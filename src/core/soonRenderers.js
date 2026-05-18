import { distance, getBubbleVisualRadius } from "./geometry.js";
import { drawPoissonPlume } from "./poissonPlumeRenderer.js";
import { drawCharacters } from "./characters/characterEngine.js";
import { drawOdysseoPath } from "./odysseoPath.js";
import { ARENA_INNER_BOUNDARY_INSET, MEMBRANE_LEVEL_MULTIPLIERS } from "./constants.js";
import { getPortalOpeningAngle, getPortalOpeningHalfSpan } from "./labybulleWorld.js";
import {
  drawFireflies,
  drawPlacedTriangles,
  drawPlumeTrail,
  drawResonanceBubbles,
} from "./fireflyGame.js";
import {
  drawEcosystemWorld,
} from "./ecosystemFx.js";

const CONTOUR_WIDTH_MULTIPLIER = 3;

export function drawScene(ctx, rect, time, refs) {
  const { stateRef, arenaRef, cameraRef, enterWorld, exitWorld } = refs;
  const current = stateRef.current;
  const isCircuitMode = current.interactionMode === "circuit";

  drawOcean(ctx, rect, time, current);
  drawDepthVeil(ctx, rect, current.fish);

  enterWorld(ctx, rect, cameraRef, stateRef);

  drawArenaWorldNetwork(ctx, current);
  drawArenaBoundary(ctx, arenaRef, time, current);

  if (!current.eyesClosed) {
    drawArenaNightSky(ctx, arenaRef, time);
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

    if (current.bubblesEnabled !== false) {
      drawBubbles(
        ctx,
        current.bubbles,
        current.selectedBubbleId,
        current.mode,
        time,
        current.interactionMode,
        current.bubblesIntensity
      );
    }

    drawPlacedTriangles(ctx, time);
    drawFireflies(ctx, time);
    drawResonanceBubbles(ctx, time);

    if (current.interactionMode !== "edit") {
      drawCharacters(ctx, time);
    }
  }

  drawFish(ctx, current.fish, time, current.worldGraph, current.currentArenaId);
  drawQuill(ctx, current.fish, time);

  exitWorld(ctx);

  if (!current.eyesClosed) {
    drawArenaNetworkMap(ctx, rect, current, arenaRef);
    drawCameraVignette(ctx, rect, current.fish);
    drawHud(ctx, rect, current, arenaRef);
  }
}



function drawArenaWorldNetwork(ctx, current = {}) {
  const world = current?.worldGraph;
  const nodes = world?.nodes || [];
  if (nodes.length < 2) return;
  const currentArenaId = current?.currentArenaId || world?.startArenaId || nodes[0]?.id;
  const centerNode = nodes.find((n) => n.id === currentArenaId) || nodes[0];
  const center = centerNode?.absoluteCenter || { x: 0, y: 0 };
  const toLocal = (abs) => ({ x: (abs?.x || 0) - (center?.x || 0), y: (abs?.y || 0) - (center?.y || 0) });
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  ctx.save();
  // Vue monde: on n'affiche pas de couloir continu entre arènes.
  // Les arènes restent tangentes et reliées par des portes seulement.

  nodes.forEach((node) => {
    const p = toLocal(node.absoluteCenter);
    const isCurrent = node.id === currentArenaId;
    ctx.beginPath();
    ctx.arc(p.x, p.y, isCurrent ? 56 : 36, 0, Math.PI * 2);
    ctx.fillStyle = isCurrent ? 'rgba(250,204,21,0.22)' : 'rgba(125,211,252,0.16)';
    ctx.fill();
  });
  ctx.restore();
}

function drawArenaNetworkMap(ctx, rect, current = {}, arenaRef) {
  const world = current?.worldGraph;
  const nodes = world?.nodes || [];
  if (!nodes.length) return;
  const currentArenaId = current?.currentArenaId || world?.startArenaId || nodes[0]?.id;
  const currentNode = nodes.find((n) => n.id === currentArenaId) || nodes[0];
  const center = currentNode?.absoluteCenter || { x: 0, y: 0 };

  const panelW = 240;
  const panelH = 190;
  const margin = 18;
  const ox = rect.width - panelW - margin;
  const oy = margin;
  const scale = 0.045;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(2, 10, 24, 0.7)';
  ctx.strokeStyle = 'rgba(125,211,252,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(ox, oy, panelW, panelH, 14);
  ctx.fill();
  ctx.stroke();

  const toMini = (abs) => ({
    x: ox + panelW * 0.5 + ((abs?.x || 0) - (center?.x || 0)) * scale,
    y: oy + panelH * 0.5 + ((abs?.y || 0) - (center?.y || 0)) * scale,
  });

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const links = world?.portals || [];
  ctx.strokeStyle = 'rgba(45,212,191,0.45)';
  ctx.lineWidth = 1.5;
  links.forEach((portal) => {
    const from = nodeById.get(portal.fromArenaId);
    const to = nodeById.get(portal.toArenaId);
    if (!from || !to) return;
    const a = toMini(from.absoluteCenter);
    const b = toMini(to.absoluteCenter);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  nodes.forEach((node) => {
    const p = toMini(node.absoluteCenter);
    const isCurrent = node.id === currentArenaId;
    ctx.beginPath();
    ctx.arc(p.x, p.y, isCurrent ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = isCurrent ? 'rgba(250,204,21,0.95)' : 'rgba(125,211,252,0.9)';
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(226,232,240,0.95)';
  ctx.font = '600 11px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText("Réseau d'arènes", ox + 12, oy + 18);
  ctx.fillStyle = 'rgba(148,163,184,0.95)';
  ctx.font = '500 10px system-ui';
  ctx.fillText(`Nœuds: ${nodes.length}  Corridors: ${Math.floor((world?.portals || []).length / 2)}`, ox + 12, oy + 34);
  ctx.restore();
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

function drawQuillShape(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.quadraticCurveTo(10, -6, 0, 22);
  ctx.quadraticCurveTo(-10, -6, 0, -24);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.lineTo(0, 32);
  ctx.stroke();
}

export function drawQuill(ctx, fish = {}, time = 0) {
  const hasQuill = Boolean(fish?.hasQuill);
  ctx.save();
  if (!hasQuill) {
    const bob = Math.sin(time * 0.003) * 6;
    ctx.translate(140, -60 + bob);
    ctx.rotate(-0.25);
  } else {
    const angle = Number.isFinite(fish?.angle) ? fish.angle : -Math.PI / 2;
    const mx = (fish?.x || 0) + Math.cos(angle) * 44;
    const my = (fish?.y || 0) + Math.sin(angle) * 44;
    ctx.translate(mx, my);
    ctx.rotate(angle + Math.PI / 2);
  }
  ctx.fillStyle = "rgba(240,248,255,0.9)";
  ctx.strokeStyle = "rgba(125,211,252,0.9)";
  ctx.lineWidth = 2 * CONTOUR_WIDTH_MULTIPLIER;
  drawQuillShape(ctx);
  ctx.restore();
}

export function drawArenaBoundary(ctx, arenaRef, time, current = {}) {
  const radius = arenaRef.current.radius;
  const innerRadius = Math.max(0, radius - ARENA_INNER_BOUNDARY_INSET);
  const arenaLevel = Number.isFinite(current?.fish?.arenaLevel) ? current.fish.arenaLevel : 0;
  const pulse = Math.sin(time * 0.0018) * 0.5 + 0.5;

  ctx.save();

  const rings = [
    innerRadius * (MEMBRANE_LEVEL_MULTIPLIERS[0] ?? 1),
    innerRadius * (MEMBRANE_LEVEL_MULTIPLIERS[1] ?? 1),
    innerRadius * (MEMBRANE_LEVEL_MULTIPLIERS[2] ?? 1),
  ];
  const worldGraph = current?.worldGraph;
  const currentArenaId = current?.currentArenaId || worldGraph?.startArenaId || null;
  const currentArenaPortals = currentArenaId
    ? (worldGraph?.portals || []).filter((p) => p.fromArenaId === currentArenaId)
    : [];

  rings.forEach((r, index) => {
    const isOuterWall = index === arenaLevel;
    const isInnerWall = index === arenaLevel - 1;
    const isActive = isOuterWall || isInnerWall;
    const openingPortal = isOuterWall
      ? currentArenaPortals[0] || null
      : isInnerWall
        ? currentArenaPortals.find((p) => p.toArenaId === worldGraph?.startArenaId) || null
        : null;
    const opening = openingPortal
      ? getPortalOpeningAngle(worldGraph, openingPortal.fromArenaId, openingPortal.toArenaId)
      : null;
    const halfSpan = opening !== null ? getPortalOpeningHalfSpan({ radius: r }) : 0;

    ctx.beginPath();
    if (opening !== null) {
      ctx.arc(0, 0, r, opening + halfSpan, opening - halfSpan + Math.PI * 2);
    } else {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    }
    const activeAlpha = 0.55 + pulse * 0.3;
    ctx.strokeStyle = isActive
      ? `rgba(125, 211, 252, ${activeAlpha})`
      : "rgba(15, 40, 70, 0.45)";
    ctx.lineWidth = (isActive ? 5 : 2) * CONTOUR_WIDTH_MULTIPLIER;
    ctx.stroke();

    if (opening !== null && isActive) {
      const glowX = Math.cos(opening) * r;
      const glowY = Math.sin(opening) * r;
      const glowRadius = r * halfSpan * 3.5;
      const grad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowRadius);
      const glowAlpha = 0.32 + pulse * 0.2;
      grad.addColorStop(0, `rgba(34, 211, 238, ${glowAlpha})`);
      grad.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.beginPath();
      ctx.arc(glowX, glowY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  });

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


export function drawBubbles(ctx, bubbles = [], selectedBubbleId, mode, time, interactionMode, intensity = 1) {
  ctx.save();

  bubbles.forEach((bubble) => {
    const selected = bubble.id === selectedBubbleId;
    const pulse = Math.sin(time * 0.003 + bubble.x * 0.01) * 5;
    const depth = Math.round(bubble.depth || 1);
    const radius = getBubbleVisualRadius(bubble);
    const alphaBase = depth === 1 ? 0.58 : depth === 2 ? 0.46 : 0.32;
    const alpha = alphaBase * Math.max(0.2, Math.min(2, intensity));

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


export function drawFish(ctx, fish, time, worldGraph, currentArenaId = null) {
  if (!fish) return;

  ctx.save();

  try {
    const arenaRadius = Number.isFinite(fish?.arenaRadius) ? fish.arenaRadius : 1200;
    const innerRadius = Math.max(0, arenaRadius - ARENA_INNER_BOUNDARY_INSET);
    const level = Number.isFinite(fish?.arenaLevel) ? fish.arenaLevel : 0;
    const safeLevel = Math.max(0, Math.min(MEMBRANE_LEVEL_MULTIPLIERS.length - 1, level));
    const membraneRadius = innerRadius * (MEMBRANE_LEVEL_MULTIPLIERS[safeLevel] ?? 1);
    const membraneSide = fish?.membraneSide === "outside" ? "outside" : "inside";
    const clipPadding = 70;
    const fishDistance = Math.hypot(fish?.x || 0, fish?.y || 0);
    // Sécurité anti-disparition: en transition de niveau, la side logique peut
    // être en retard d'un frame. On se base aussi sur la position réelle.
    const effectiveSide = fishDistance > membraneRadius + 16
      ? "outside"
      : fishDistance < membraneRadius - 16
        ? "inside"
        : membraneSide;
    const outerWorldRadius = Math.max(
      membraneRadius + 2200,
      fishDistance + 1800
    );

    const activeArenaId = currentArenaId || worldGraph?.startArenaId || null;
    const activePortals = activeArenaId
      ? (worldGraph?.portals || []).filter((p) => p.fromArenaId === activeArenaId)
      : [];
    const radialAngle = Math.atan2(fish?.y || 0, fish?.x || 0);
    const angleDistance = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
    const openingPortal = activePortals.reduce((best, portal) => {
      const opening = getPortalOpeningAngle(worldGraph, portal.fromArenaId, portal.toArenaId);
      if (!Number.isFinite(opening)) return best;
      const gap = Math.abs(angleDistance(radialAngle, opening));
      if (!best || gap < best.gap) return { portal, opening, gap };
      return best;
    }, null);
    const opening = openingPortal?.opening ?? null;
    if (opening !== null) {
      const clipPath = new Path2D();
      const halfSpan = getPortalOpeningHalfSpan({ radius: membraneRadius });
      if (effectiveSide === "inside") {
        clipPath.arc(0, 0, membraneRadius + clipPadding, opening + halfSpan, opening - halfSpan + Math.PI * 2);
        ctx.clip(clipPath);
      } else {
        clipPath.arc(0, 0, outerWorldRadius, 0, Math.PI * 2);
        clipPath.arc(0, 0, membraneRadius - clipPadding * 0.4, opening + halfSpan, opening - halfSpan + Math.PI * 2);
        ctx.clip(clipPath, "evenodd");
      }
    }

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

export function drawHud(ctx, rect, current, arenaRef) {
  void arenaRef;
  const fishDepth = Math.round(current?.fish?.depth || 1);
  const arenaLevel = Number.isFinite(current?.fish?.arenaLevel) ? current.fish.arenaLevel : 0;
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

  const dotR = 5;
  const dotSpacing = 16;
  const dotsTotal = 3;
  const dotsWidth = (dotsTotal - 1) * dotSpacing;
  const dotY = rect.height - 28;
  const dotX0 = rect.width * 0.5 - dotsWidth * 0.5;
  for (let i = 0; i < dotsTotal; i += 1) {
    const active = i === arenaLevel;
    ctx.beginPath();
    ctx.arc(dotX0 + i * dotSpacing, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = active
      ? "rgba(125, 211, 252, 0.9)"
      : "rgba(125, 211, 252, 0.22)";
    ctx.fill();
  }

  if (!current.eyesClosed) {
    ctx.restore();
    return;
  }

  ctx.fillStyle = "rgba(226, 232, 240, 0.78)";
  ctx.font = "500 18px Georgia";
  ctx.textAlign = "center";

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
