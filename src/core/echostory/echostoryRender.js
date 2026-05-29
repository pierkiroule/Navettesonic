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

function drawDreamcatcherChord(ctx, fromStar, toStar, time = 0) {
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
  const strandOffset = 3.5 + pulse * 1.5;
  const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
  gradient.addColorStop(0, `${fromStar.color || "#ffffff"}44`);
  gradient.addColorStop(0.5, "rgba(255,248,214,0.96)");
  gradient.addColorStop(1, `${toStar.color || "#ffffff"}44`);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(255, 230, 148, 0.88)";
  ctx.shadowBlur = 16 + pulse * 10;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 5.5 + pulse * 1.4;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.shadowBlur = 9;
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 1.25;
  [-strandOffset, strandOffset].forEach((offset) => {
    ctx.beginPath();
    ctx.moveTo(fromX + normalX * offset, fromY + normalY * offset);
    ctx.lineTo(toX + normalX * offset, toY + normalY * offset);
    ctx.stroke();
  });

  ctx.shadowBlur = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 0.9;
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

export function drawEchostoryContourLinks(ctx, echostory = {}, time = 0) {
  const stars = Array.isArray(echostory?.stars) ? echostory.stars : [];
  const links = Array.isArray(echostory?.contourStarLinks) ? echostory.contourStarLinks : [];
  if (!stars.length || !links.length) return;

  const starsById = new Map(stars.map((star) => [star?.id, star]).filter(([id]) => id));
  links.forEach((link) => {
    const fromStar = starsById.get(link?.from);
    const toStar = starsById.get(link?.to);
    if (!fromStar?.attachedToContour || !toStar?.attachedToContour) return;
    drawDreamcatcherChord(ctx, fromStar, toStar, time);
  });
}

export function drawEchostoryStars(ctx, stars = [], time = 0, fish = null) {
  if (!Array.isArray(stars) || stars.length === 0) return;
  ctx.save();
  try {
    stars.forEach((star, index) => {
      if (!star) return;

      const pulse = Math.sin(time * 0.005 + (star.phase || 0) + index * 0.4) * 0.5 + 0.5;
      const radius = (Number.isFinite(star.r) ? star.r : 18) * (0.85 + pulse * 0.2);
      const x = Number.isFinite(star.x) ? star.x : 0;
      const y = Number.isFinite(star.y) ? star.y : 0;
      const color = star.color || "#ffffff";

      const blinking = star.previewPlaying === true;
      const blinkPulse = blinking ? (Math.sin(time * 0.028 + (star.phase || 0) + index) > 0 ? 1 : 0.18) : 1;
      if (star.attachedToContour) {
        drawContourSnapHalo(ctx, x, y, radius, time, (star.phase || 0) + index * 0.21);
      }
      if (star.selectedOnContour) {
        drawSelectedContourHalo(ctx, x, y, radius, time, (star.phase || 0) + index * 0.31);
      }
      drawStar(ctx, x, y, radius, color, blinkPulse);
    });
  } finally {
    ctx.restore();
  }
}
