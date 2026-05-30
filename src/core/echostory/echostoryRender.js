import { ECHOSTORY_CORE_SYMBOL, ECHOSTORY_MUSIC_CORE_ID, getEchostoryLinks, makeLinkId } from "./echostoryConstellation.js";

const ECHOSTORY_STAR_MIN_VISUAL_RADIUS = 34;

function drawStar(ctx, x, y, radius, color, alpha = 1) {
  const halo = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.6);
  halo.addColorStop(0, `${color}aa`);
  halo.addColorStop(0.5, `${color}44`);
  halo.addColorStop(1, `${color}00`);
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.1, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.globalAlpha = alpha;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.86 * alpha;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.globalAlpha = 0.9 * alpha;
  ctx.fill();
}

function drawDreamcatcherChord(ctx, fromStar, toStar, time = 0, options = {}) {
  if (!fromStar || !toStar) return;
  const fromX = Number.isFinite(fromStar.x) ? fromStar.x : 0;
  const fromY = Number.isFinite(fromStar.y) ? fromStar.y : 0;
  const toX = Number.isFinite(toStar.x) ? toStar.x : 0;
  const toY = Number.isFinite(toStar.y) ? toStar.y : 0;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy);
  if (length < 0.001) return;

  const normalX = -dy / length;
  const normalY = dx / length;
  const pulse = Math.sin(time * 0.008 + length * 0.003) * 0.5 + 0.5;
  const playbackPulse = options.playbackPulse ? (Math.sin(time * 0.018) * 0.5 + 0.5) : 0;
  const strandOffset = 1.45 + pulse * 0.45;
  const alphaScale = options.dashed ? 0.42 : 1;
  const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
  gradient.addColorStop(0, `${fromStar.color || "#ffffff"}33`);
  gradient.addColorStop(0.5, `rgba(255,248,214,${0.46 * alphaScale})`);
  gradient.addColorStop(1, `${toStar.color || "#ffffff"}33`);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  if (options.dashed) ctx.setLineDash([10, 13]);
  ctx.shadowColor = options.playbackPulse ? "rgba(130, 245, 255, 0.98)" : "rgba(255, 230, 148, 0.88)";
  ctx.shadowBlur = 5 + pulse * 3 + playbackPulse * 10;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = (options.dashed ? 0.82 : 1.15) + pulse * 0.28 + playbackPulse * 1.15;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.shadowBlur = 5;
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 0.38;
  [-strandOffset, strandOffset].forEach((offset) => {
    ctx.beginPath();
    ctx.moveTo(fromX + normalX * offset, fromY + normalY * offset);
    ctx.lineTo(toX + normalX * offset, toY + normalY * offset);
    ctx.stroke();
  });

  ctx.shadowBlur = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 0.28;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.restore();
}

function drawSelectedContourHalo(ctx, x, y, radius, time = 0, phase = 0) {
  const pulse = Math.sin(time * 0.01 + phase) * 0.5 + 0.5;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(255, 250, 205, ${0.74 + pulse * 0.2})`;
  ctx.lineWidth = 3.2;
  ctx.shadowColor = "rgba(255, 232, 128, 0.95)";
  ctx.shadowBlur = 18 + pulse * 8;
  ctx.beginPath();
  ctx.arc(x, y, radius * (1.72 + pulse * 0.12), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawContourSnapHalo(ctx, x, y, radius, time = 0, phase = 0) {
  const pulse = Math.sin(time * 0.006 + phase) * 0.5 + 0.5;
  const haloRadius = radius * (2.8 + pulse * 0.35);
  const halo = ctx.createRadialGradient(x, y, radius * 0.25, x, y, haloRadius);
  halo.addColorStop(0, "rgba(255, 248, 214, 0.95)");
  halo.addColorStop(0.45, "rgba(255, 205, 92, 0.55)");
  halo.addColorStop(1, "rgba(255, 205, 92, 0)");
  ctx.beginPath();
  ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();
}

function drawCoreAnchor(ctx, time = 0, playback = {}) {
  const pulse = Math.sin(time * 0.006) * 0.5 + 0.5;
  const isCurrent = playback.currentNodeId === ECHOSTORY_MUSIC_CORE_ID;
  const isTarget = playback.playbackTargetNodeId === ECHOSTORY_MUSIC_CORE_ID;
  const radius = 34 + pulse * 3 + (isCurrent ? 7 : 0);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = "rgba(155, 226, 255, 0.95)";
  ctx.shadowBlur = 18 + pulse * 9 + (isCurrent || isTarget ? 18 : 0);
  ctx.strokeStyle = `rgba(220, 248, 255, ${0.74 + pulse * 0.18})`;
  ctx.lineWidth = isCurrent ? 5 : 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = `rgba(135, 217, 255, ${0.18 + pulse * 0.08})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.86, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "28px system-ui, Apple Color Emoji, Segoe UI Emoji, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.shadowBlur = 8;
  ctx.fillText(ECHOSTORY_CORE_SYMBOL, 0, 1);
  ctx.restore();
}

function drawLinkEffect(ctx, fromStar, toStar, effect, time = 0) {
  if (!fromStar || !toStar || !effect) return;
  const startedAt = Number.isFinite(effect.startedAt) ? effect.startedAt : time;
  const age = Math.max(0, time - startedAt);
  const duration = effect.type === "remove" ? 420 : 520;
  const t = Math.min(1, age / duration);
  if (t >= 1) return;

  const fromX = Number.isFinite(fromStar.x) ? fromStar.x : 0;
  const fromY = Number.isFinite(fromStar.y) ? fromStar.y : 0;
  const toX = Number.isFinite(toStar.x) ? toStar.x : 0;
  const toY = Number.isFinite(toStar.y) ? toStar.y : 0;
  const alpha = effect.type === "remove" ? 1 - t : Math.sin(t * Math.PI);
  const width = effect.type === "remove" ? 4 * (1 - t) + 0.8 : 1.2 + t * 4.5;
  const color = effect.type === "remove" ? "rgba(150, 220, 255," : "rgba(255, 242, 170,";

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.strokeStyle = `${color}${0.82 * alpha})`;
  ctx.shadowColor = effect.type === "remove" ? "rgba(120, 210, 255, 0.95)" : "rgba(255, 236, 150, 0.98)";
  ctx.shadowBlur = 14 * alpha;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  const midX = fromX + (toX - fromX) * 0.5;
  const midY = fromY + (toY - fromY) * 0.5;
  const r = 24 + t * 48;
  const glow = ctx.createRadialGradient(midX, midY, 0, midX, midY, r);
  glow.addColorStop(0, `${color}${0.64 * alpha})`);
  glow.addColorStop(1, `${color}0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(midX, midY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawEchostoryConstellationLinks(ctx, echostory = {}, time = 0) {
  const playback = echostory?.echostoryPlayback || {};
  drawCoreAnchor(ctx, time, playback);

  const stars = Array.isArray(echostory?.stars) ? echostory.stars : [];
  const links = getEchostoryLinks(echostory);
  const effects = Array.isArray(echostory?.linkEffects) ? echostory.linkEffects : [];
  if (!stars.length || (!links.length && !effects.length)) return;

  const starsById = new Map(stars.map((star) => [star?.id, star]).filter(([id]) => id));
  starsById.set(ECHOSTORY_MUSIC_CORE_ID, {
    id: ECHOSTORY_MUSIC_CORE_ID,
    x: 0,
    y: 0,
    r: 34,
    color: "#ffe58a",
  });
  links.forEach((link) => {
    const fromStar = starsById.get(link?.from);
    const toStar = starsById.get(link?.to);
    if (!fromStar || !toStar || fromStar.expired || toStar.expired) return;
    const linkId = link?.id || makeLinkId(link?.from, link?.to);
    const activeLinkId = echostory?.playbackCurrentLinkId || playback?.activeLinkId;
    const isPlayingAnyLink = Boolean(playback?.linkPlaybackActive || activeLinkId);
    drawDreamcatcherChord(ctx, fromStar, toStar, time, {
      playbackPulse: activeLinkId === linkId,
      dashed: isPlayingAnyLink && activeLinkId !== linkId,
    });
  });

  effects.forEach((effect) => {
    const fromStar = starsById.get(effect?.from);
    const toStar = starsById.get(effect?.to);
    drawLinkEffect(ctx, fromStar, toStar, effect, time);
  });
}

export function drawEchostoryContourLinks(ctx, echostory = {}, time = 0) {
  const playback = echostory?.echostoryPlayback || {};
  const stars = Array.isArray(echostory?.stars) ? echostory.stars : [];
  const links = Array.isArray(echostory?.contourStarLinks) ? echostory.contourStarLinks : [];
  if (!stars.length || !links.length) return;

  const starsById = new Map(stars.map((star) => [star?.id, star]).filter(([id]) => id));
  links.forEach((link) => {
    const fromStar = starsById.get(link?.from);
    const toStar = starsById.get(link?.to);
    if (!fromStar?.attachedToContour || !toStar?.attachedToContour) return;
    const linkId = link?.id || makeLinkId(link?.from, link?.to);
    const activeLinkId = echostory?.playbackCurrentLinkId || playback?.activeLinkId;
    const isPlayingAnyLink = Boolean(playback?.linkPlaybackActive || activeLinkId);
    drawDreamcatcherChord(ctx, fromStar, toStar, time, {
      playbackPulse: activeLinkId === linkId,
      dashed: isPlayingAnyLink && activeLinkId !== linkId,
    });
  });
}

export function drawEchostoryStars(ctx, stars = [], time = 0, fish = null, echostory = {}) {
  if (!Array.isArray(stars) || stars.length === 0) return;
  const playback = echostory?.echostoryPlayback || {};
  const visited = playback.visited || {};
  ctx.save();
  try {
    stars.forEach((star, index) => {
      if (!star || star.expired) return;

      const pulse = Math.sin(time * 0.005 + (star.phase || 0) + index * 0.4) * 0.5 + 0.5;
      const baseRadius = Math.max(ECHOSTORY_STAR_MIN_VISUAL_RADIUS, Number.isFinite(star.r) ? star.r : ECHOSTORY_STAR_MIN_VISUAL_RADIUS);
      const radius = baseRadius * (0.85 + pulse * 0.2);
      const x = Number.isFinite(star.x) ? star.x : 0;
      const y = Number.isFinite(star.y) ? star.y : 0;
      const color = star.color || "#ffffff";

      const blinking = star.previewPlaying === true;
      const isCurrent = playback.currentNodeId === star.id && !playback.playbackTargetNodeId;
      const isTarget = playback.playbackTargetNodeId === star.id;
      const wasVisited = Boolean(visited?.[star.id]);
      const stateAlpha = wasVisited ? 0.62 : 1;
      const blinkPulse = blinking ? (Math.sin(time * 0.028 + (star.phase || 0) + index) > 0 ? 1 : 0.18) : 1;
      if (star.attachedToContour) {
        drawContourSnapHalo(ctx, x, y, radius, time, (star.phase || 0) + index * 0.21);
      }
      if (star.selectedOnContour || isCurrent) {
        drawSelectedContourHalo(ctx, x, y, radius * (isCurrent ? 1.18 : 1), time, (star.phase || 0) + index * 0.31);
      }
      if (isTarget) {
        drawContourSnapHalo(ctx, x, y, radius * 0.82, time, (star.phase || 0) + index * 0.17);
      }
      drawStar(ctx, x, y, radius, color, blinkPulse * stateAlpha);
    });
  } finally {
    ctx.restore();
  }
}
