export function resetCanvasPaintState(ctx) {
  if (!ctx) return;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 1;
  ctx.lineDashOffset = 0;
  if (ctx.setLineDash) ctx.setLineDash([]);
}
