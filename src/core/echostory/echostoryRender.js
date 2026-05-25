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

function drawCollectedStarThread(ctx, stars = [], fish = {}, time = 0) {
  if (!Array.isArray(stars) || !stars.length) return;
  const collected = stars.filter((star) => star?.collected).slice(0, 15);
  if (!collected.length) return;

  const headX = Number.isFinite(fish?.x) ? fish.x : 0;
  const headY = Number.isFinite(fish?.y) ? fish.y : 0;
  const angle = Number.isFinite(fish?.angle) ? fish.angle : 0;
  const tailSpacing = 34;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(189, 232, 255, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();

  collected.forEach((star, index) => {
    const lag = (index + 1) * tailSpacing;
    const sway = Math.sin(time * 0.004 + index * 0.7) * (8 + index * 0.45);
    const posX = headX - Math.cos(angle) * lag + Math.cos(angle + Math.PI / 2) * sway;
    const posY = headY - Math.sin(angle) * lag + Math.sin(angle + Math.PI / 2) * sway;
    if (index === 0) ctx.moveTo(headX, headY);
    ctx.lineTo(posX, posY);
    drawStar(ctx, posX, posY, 10 + Math.max(0, 4 - index * 0.2), star.color || "#ffffff", 0.9);
  });
  ctx.stroke();
  ctx.restore();
}

export function drawEchostoryStars(ctx, stars = [], time = 0, fish = null) {
  if (!Array.isArray(stars) || stars.length === 0) return;
  ctx.save();
  try {
    stars.forEach((star, index) => {
      if (!star || star.collected) return;

      const pulse = Math.sin(time * 0.005 + (star.phase || 0) + index * 0.4) * 0.5 + 0.5;
      const radius = (Number.isFinite(star.r) ? star.r : 18) * (0.85 + pulse * 0.2);
      const x = Number.isFinite(star.x) ? star.x : 0;
      const y = Number.isFinite(star.y) ? star.y : 0;
      const color = star.color || "#ffffff";

      const blinking = star.previewPlaying === true;
      const blinkPulse = blinking ? (Math.sin(time * 0.028 + (star.phase || 0) + index) > 0 ? 1 : 0.18) : 1;
      drawStar(ctx, x, y, radius, color, blinkPulse);
    });

    drawCollectedStarThread(ctx, stars, fish, time);
  } finally {
    ctx.restore();
  }
}
