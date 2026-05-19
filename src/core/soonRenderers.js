import { distance, getBubbleVisualRadius } from "./geometry.js";
import { drawPoissonPlume } from "./poissonPlumeRenderer.js";
import { drawCharacters } from "./characters/characterEngine.js";
import { drawOdysseoPath } from "./odysseoPath.js";
import { ARENA_INNER_BOUNDARY_INSET, MEMBRANE_LEVEL_MULTIPLIERS } from "./constants.js";
import { getArenaRadiusForNode, getPortalOpeningAngle, getPortalOpeningHalfSpan } from "./labybulleWorld.js";
import {
  drawFireflies,
  drawPlacedTriangles,
  drawPlumeTrail,
  drawResonanceBubbles,
} from "./fireflyGame.js";
import {
  drawEcosystemWorld,
} from "./ecosystemFx.js";
import { getBlobRadiusAtAngle } from "./blobArena.js";
import { spawnFireflyFromSeed } from "./fireflyGame.js";

const CONTOUR_WIDTH_MULTIPLIER = 3;
const guppyRuntime = {
  initialized: false,
  fish: [],
  pearls: [],
  driftingSeeds: [],
  pinkSmoke: [],
  cosmicStreaks: [],
  nextCosmicSpawnAt: 0,
};

export function drawScene(ctx, rect, time, refs) {
  const { stateRef, arenaRef, cameraRef, enterWorld, exitWorld } = refs;
  const current = stateRef.current;
  const isCircuitMode = current.interactionMode === "circuit";

  drawOcean(ctx, rect, time, current);
  drawDepthVeil(ctx, rect, current.fish);

  enterWorld(ctx, rect, cameraRef, stateRef);

  drawArenaBoundary(ctx, arenaRef, time, current);
  drawArenaGuppies(ctx, time, current, arenaRef.current?.radius || 1200);

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
    drawCameraVignette(ctx, rect, current.fish);
    drawHud(ctx, rect, current, arenaRef);
  }
}

function drawGuppyTopView(ctx, x, y, angle, size = 1, sway = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);

  const bodyGrad = ctx.createRadialGradient(-4, -2, 1, 0, 0, 16);
  bodyGrad.addColorStop(0, "rgba(255, 215, 240, 0.95)");
  bodyGrad.addColorStop(0.55, "rgba(255, 139, 200, 0.88)");
  bodyGrad.addColorStop(1, "rgba(240, 82, 166, 0.82)");

  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  const tailSwing = Math.sin(sway) * 3.4;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.quadraticCurveTo(-23, -8 - tailSwing, -31, 0);
  ctx.quadraticCurveTo(-23, 8 + tailSwing, -12, 0);
  ctx.fillStyle = "rgba(255, 116, 196, 0.85)";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(6, -1, 2, 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(17, 24, 39, 0.65)";
  ctx.fill();
  ctx.restore();
}

function getArenaEdgeRadius(current, arenaRadius, angle) {
  const hasBlob = Array.isArray(current?.arenaBlob?.points) && current.arenaBlob.points.length > 2;
  return hasBlob ? getBlobRadiusAtAngle(current.arenaBlob, angle) : arenaRadius;
}

function ensureGuppyRuntime(current, arenaRadius) {
  if (guppyRuntime.initialized) return;
  guppyRuntime.initialized = true;
  const count = 14;
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count;
    const edge = getArenaEdgeRadius(current, arenaRadius, a);
    const r = Math.max(120, edge * (0.22 + Math.random() * 0.54));
    guppyRuntime.fish.push({
      id: `guppy-${i}`,
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      vx: Math.cos(a + Math.PI / 2) * 0.7,
      vy: Math.sin(a + Math.PI / 2) * 0.7,
      angle: a,
      phase: Math.random() * Math.PI * 2,
    });
  }
  // Important narratif: au départ aucune perle/graine sur la membrane.
  // Elles arrivent uniquement via les étoiles filantes cosmiques.
}

function drawArenaGuppies(ctx, time = 0, current = {}, arenaRadius = 1200) {
  ensureGuppyRuntime(current, arenaRadius);
  const now = performance.now();
  const fish = guppyRuntime.fish;
  const pearls = guppyRuntime.pearls;
  const seeds = guppyRuntime.driftingSeeds;
  const pinkSmoke = guppyRuntime.pinkSmoke;
  const cosmicStreaks = guppyRuntime.cosmicStreaks;
  const dt = 1;

  if (now >= guppyRuntime.nextCosmicSpawnAt) {
    const impactAngle = Math.random() * Math.PI * 2;
    const edge = getArenaEdgeRadius(current, arenaRadius, impactAngle);
    const spawnR = edge + 340 + Math.random() * 220;
    // Impact sur membrane (pas de traversée de l'arène).
    const targetX = Math.cos(impactAngle) * Math.max(84, edge + 4);
    const targetY = Math.sin(impactAngle) * Math.max(84, edge + 4);
    const fromX = Math.cos(impactAngle + (Math.random() - 0.5) * 0.5) * spawnR;
    const fromY = Math.sin(impactAngle + (Math.random() - 0.5) * 0.5) * spawnR;
    cosmicStreaks.push({
      x: fromX,
      y: fromY,
      vx: (targetX - fromX) * 0.032,
      vy: (targetY - fromY) * 0.032,
      tx: targetX,
      ty: targetY,
      angle: impactAngle,
      life: 0,
      maxLife: 80 + Math.random() * 32,
    });
    guppyRuntime.nextCosmicSpawnAt = now + 1500 + Math.random() * 3000;
  }

  pearls.forEach((pearl) => {
    if (!pearl.attached) return;
    const edge = getArenaEdgeRadius(current, arenaRadius, pearl.angle);
    pearl.x = Math.cos(pearl.angle) * Math.max(44, edge - 8);
    pearl.y = Math.sin(pearl.angle) * Math.max(44, edge - 8);
    pearl.angle += 0.0002;
  });

  fish.forEach((g) => {
    const a = Math.atan2(g.y, g.x);
    const edge = getArenaEdgeRadius(current, arenaRadius, a);
    const navMax = Math.max(110, edge - 58);
    const navMin = Math.max(70, edge * 0.16);

    g.vx += (Math.random() - 0.5) * 0.06;
    g.vy += (Math.random() - 0.5) * 0.06;
    const speed = Math.hypot(g.vx, g.vy) || 1;
    const targetSpeed = 0.9 + Math.sin(time * 0.001 + g.phase) * 0.24;
    g.vx = (g.vx / speed) * targetSpeed;
    g.vy = (g.vy / speed) * targetSpeed;
    g.x += g.vx * dt;
    g.y += g.vy * dt;

    const d = Math.hypot(g.x, g.y);
    if (d > navMax) {
      const c = navMax / d;
      g.x *= c; g.y *= c;
      g.vx *= -0.35; g.vy *= -0.35;
    } else if (d < navMin) {
      const c = navMin / Math.max(0.001, d);
      g.x *= c; g.y *= c;
      g.vx += Math.cos(a) * 0.2;
      g.vy += Math.sin(a) * 0.2;
    }
    g.angle = Math.atan2(g.vy, g.vx);

    const mouthX = g.x + Math.cos(g.angle) * 11;
    const mouthY = g.y + Math.sin(g.angle) * 11;
    const near = pearls.find((p) => p.attached && Math.hypot((p.x || 0) - mouthX, (p.y || 0) - mouthY) < 34);
    if (near) {
      near.attached = false;
      const fromX = near.x + Math.cos(near.angle || 0) * 10;
      const fromY = near.y + Math.sin(near.angle || 0) * 10;
      const toX = g.x - Math.cos(g.angle) * 6;
      const toY = g.y - Math.sin(g.angle) * 6;
      seeds.push({
        x: fromX,
        y: fromY,
        vx: (toX - fromX) * 0.08,
        vy: (toY - fromY) * 0.08,
        bornAt: now,
        matureAt: now + 3000 + Math.random() * 3600,
        phase: Math.random() * Math.PI * 2,
        inhalingUntil: now + 480,
      });
      for (let j = 0; j < 9; j += 1) {
        pinkSmoke.push({
          x: fromX,
          y: fromY,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          bornAt: now,
          life: 450 + Math.random() * 350,
          r: 1.4 + Math.random() * 2.3,
        });
      }
    }
  });

  for (let i = seeds.length - 1; i >= 0; i -= 1) {
    const s = seeds[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.987;
    s.vy *= 0.987;
    s.x += Math.sin(time * 0.002 + s.phase) * 0.12;
    s.y += Math.cos(time * 0.002 + s.phase) * 0.12;
    fish.forEach((g) => {
      const mouthX = g.x + Math.cos(g.angle) * 11;
      const mouthY = g.y + Math.sin(g.angle) * 11;
      const dHead = Math.hypot(s.x - mouthX, s.y - mouthY);
      if (dHead < 34) {
        const push = (34 - dHead) / 34;
        const nx = (s.x - mouthX) / Math.max(0.001, dHead);
        const ny = (s.y - mouthY) / Math.max(0.001, dHead);
        s.vx += nx * (0.3 + push * 0.5) + (g.vx || 0) * 0.1;
        s.vy += ny * (0.3 + push * 0.5) + (g.vy || 0) * 0.1;
      }
      if (now < (s.inhalingUntil || 0)) {
        s.vx += (g.x - s.x) * 0.018;
        s.vy += (g.y - s.y) * 0.018;
      }
    });
    const a = Math.atan2(s.y, s.x);
    const edge = getArenaEdgeRadius(current, arenaRadius, a);
    const d = Math.hypot(s.x, s.y);
    if (d > edge - 40) {
      const c = (edge - 40) / Math.max(0.001, d);
      s.x *= c; s.y *= c;
      s.vx *= -0.2; s.vy *= -0.2;
    }
    if (now >= s.matureAt) {
      spawnFireflyFromSeed(s.x, s.y);
      seeds.splice(i, 1);
    }
  }
  for (let i = pinkSmoke.length - 1; i >= 0; i -= 1) {
    const p = pinkSmoke[i];
    const age = now - p.bornAt;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.97;
    p.vy *= 0.97;
    if (age >= p.life) pinkSmoke.splice(i, 1);
  }

  for (let i = cosmicStreaks.length - 1; i >= 0; i -= 1) {
    const c = cosmicStreaks[i];
    c.life += 1;
    c.x += c.vx;
    c.y += c.vy;
    c.vx *= 0.988;
    c.vy *= 0.988;
    if (Math.hypot(c.tx - c.x, c.ty - c.y) < 8 || c.life >= c.maxLife) {
      c.x = c.tx;
      c.y = c.ty;
      pearls.push({
        id: `pearl-cosmic-${now}-${i}`,
        angle: c.angle + (Math.random() - 0.5) * 0.04,
        attached: true,
        glow: Math.random() * Math.PI * 2,
      });
      cosmicStreaks.splice(i, 1);
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  pearls.forEach((p, i) => {
    if (!p.attached) return;
    const pulse = Math.sin(time * 0.006 + p.glow + i) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.7 + pulse * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.62 + pulse * 0.3})`;
    ctx.fill();
  });

  seeds.forEach((s) => {
    const pulse = Math.sin(time * 0.009 + s.phase) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.1 + pulse * 1.1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245,250,255,${0.52 + pulse * 0.28})`;
    ctx.fill();
  });
  pinkSmoke.forEach((p) => {
    const age = now - p.bornAt;
    const k = Math.max(0, 1 - age / p.life);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (1 + (1 - k) * 2), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,150,210,${k * 0.45})`;
    ctx.fill();
  });

  cosmicStreaks.forEach((c) => {
    const tailX = c.x - c.vx * 5.5;
    const tailY = c.y - c.vy * 5.5;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(c.x, c.y);
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x, c.y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();
  });

  fish.forEach((g, i) => {
    drawGuppyTopView(ctx, g.x, g.y, g.angle, 0.72 + (i % 4) * 0.08, time * 0.02 + g.phase);
  });

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



function getPortalClosestToFish(worldGraph, portals, fish = {}) {
  if (!Array.isArray(portals) || portals.length === 0) return null;
  if (portals.length === 1) return portals[0];
  const fishAngle = Math.atan2(fish?.y || 0, fish?.x || 0);
  const angleDistance = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  let best = portals[0];
  let bestGap = Number.POSITIVE_INFINITY;
  portals.forEach((portal) => {
    const opening = getPortalOpeningAngle(worldGraph, portal.fromArenaId, portal.toArenaId);
    if (!Number.isFinite(opening)) return;
    const gap = Math.abs(angleDistance(fishAngle, opening));
    if (gap < bestGap) {
      best = portal;
      bestGap = gap;
    }
  });
  return best;
}

function drawArenaNetworkBackdrop(ctx, current = {}, baseRadius = 1200) {
  const worldGraph = current?.worldGraph;
  const activeArenaId = current?.currentArenaId || worldGraph?.startArenaId || null;
  if (!worldGraph || !activeArenaId) return;

  const nodes = worldGraph?.nodes || [];
  const portals = worldGraph?.portals || [];
  const activeNode = nodes.find((n) => n.id === activeArenaId);
  if (!activeNode) return;

  const activeCenter = activeNode.absoluteCenter || { x: 0, y: 0 };
  ctx.save();
  nodes.forEach((node) => {
    if (node.id === activeArenaId) return;
    const center = node.absoluteCenter || { x: 0, y: 0 };
    const x = (center.x || 0) - (activeCenter.x || 0);
    const y = (center.y || 0) - (activeCenter.y || 0);
    const radius = getArenaRadiusForNode({ world: worldGraph, arenaId: node.id, baseRadius });

    const portalToActive = portals.find((p) => p.fromArenaId === node.id && p.toArenaId === activeArenaId) || null;
    const opening = portalToActive
      ? getPortalOpeningAngle(worldGraph, portalToActive.fromArenaId, portalToActive.toArenaId)
      : null;
    const halfSpan = opening !== null ? getPortalOpeningHalfSpan({ radius }) : 0;

    ctx.save();
    ctx.translate(x, y);

    ctx.beginPath();
    if (opening !== null) {
      ctx.arc(0, 0, radius, opening + halfSpan, opening - halfSpan + Math.PI * 2);
    } else {
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
    }
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.58)';
    ctx.lineWidth = 4 * CONTOUR_WIDTH_MULTIPLIER;
    ctx.stroke();

    ctx.beginPath();
    if (opening !== null) {
      ctx.arc(0, 0, radius * 0.95, opening + halfSpan, opening - halfSpan + Math.PI * 2);
    } else {
      ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
    }
    ctx.strokeStyle = 'rgba(14, 116, 144, 0.48)';
    ctx.lineWidth = 2 * CONTOUR_WIDTH_MULTIPLIER;
    ctx.stroke();

    ctx.restore();
  });
  ctx.restore();
}

export function drawArenaBoundary(ctx, arenaRef, time, current = {}) {
  const radius = arenaRef.current.radius;
  drawArenaNetworkBackdrop(ctx, current, radius);
  if (current?.arenaBlob?.points?.length) {
    drawBlobArena(ctx, current.arenaBlob, time);
    return;
  }
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
      ? getPortalClosestToFish(worldGraph, currentArenaPortals, current?.fish)
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

function drawBlobArena(ctx, blob, time = 0) {
  const points = blob?.points || [];
  if (points.length < 3) return;
  const pulse = Math.sin(time * 0.0022) * 0.5 + 0.5;
  const smoothing = 0.32;
  const positions = points.map((point) => {
    const radius = Math.max(
      40,
      getBlobRadiusAtAngle(blob, point.angle) - ARENA_INNER_BOUNDARY_INSET
    );
    return { x: Math.cos(point.angle) * radius, y: Math.sin(point.angle) * radius };
  });
  ctx.save();
  ctx.beginPath();
  const first = positions[0];
  ctx.moveTo(first.x, first.y);
  for (let i = 0; i < positions.length; i += 1) {
    const current = positions[i];
    const next = positions[(i + 1) % positions.length];
    const midX = current.x + (next.x - current.x) * smoothing;
    const midY = current.y + (next.y - current.y) * smoothing;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(125, 211, 252, ${0.62 + pulse * 0.18})`;
  ctx.shadowColor = "rgba(34,211,238,0.4)";
  ctx.shadowBlur = 22;
  ctx.lineWidth = 14;
  ctx.stroke();
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
  const arenaLevel = Number.isFinite(current?.fish?.arenaLevel) ? current.fish.arenaLevel : 0;

  ctx.save();

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
