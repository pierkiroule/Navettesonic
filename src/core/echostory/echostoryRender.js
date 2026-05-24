export function drawEchostoryStars(ctx, stars = [], time = 0) {
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

      const halo = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.8);
      halo.addColorStop(0, `${color}aa`);
      halo.addColorStop(0.45, `${color}44`);
      halo.addColorStop(1, `${color}00`);
      ctx.beginPath();
      ctx.arc(x, y, radius * (2 + pulse * 0.6), 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.globalAlpha = 0.85;
      ctx.fill();

      if (star.text) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(224, 242, 254, 0.95)";
        ctx.font = "600 12px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(String(star.text), x, y - radius - 10);
      }
    });
  } finally {
    ctx.restore();
  }
}
