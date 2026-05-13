export function resizeCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  const width = Math.floor(rect.width * ratio);
  const height = Math.floor(rect.height * ratio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  return rect;
}

export function updateArena(arenaRef, rect) {
  const maxScreen = Math.max(rect.width, rect.height);
  arenaRef.current.radius = maxScreen * 1.5;
}

export function followFishCamera(cameraRef, arenaRef, fish, rect, viewZoom = 0) {
  if (!fish) return;

  const camera = cameraRef.current;
  const arenaRadius = arenaRef.current.radius;

  const speed = Math.hypot(fish.vx || 0, fish.vy || 0);
  const speedNorm = Math.min(1, speed / 18);
  const depth = Math.max(1, Math.min(3, Math.round(fish.depth || 1)));

  const lookAhead = 90 + speedNorm * 180;
  const angle = Number.isFinite(fish.angle)
    ? fish.angle
    : Math.atan2(fish.vy || 0, fish.vx || 1);

  const targetRawX = fish.x + Math.cos(angle) * lookAhead * speedNorm;
  const targetRawY = fish.y + Math.sin(angle) * lookAhead * speedNorm;

  const t = performance.now() * 0.001;
  const breath = Math.sin(t * 0.42) * 0.018;

  const depthZoom = depth === 1 ? 1 : depth === 2 ? 0.94 : 0.88;
  const speedZoom = 1 - speedNorm * 0.08;
  const targetZoom = depthZoom * speedZoom + breath;

  const fitZoom = Math.min(rect.width, rect.height) / (arenaRadius * 1.9);
  const extraViewZoom = 1.0 + Math.max(0, viewZoom) * 3.8;
  const effectiveZoom = Math.max(0.001, fitZoom * targetZoom * extraViewZoom);

  const halfVisibleWidth = rect.width * 0.5 / effectiveZoom;
  const halfVisibleHeight = rect.height * 0.5 / effectiveZoom;

  const maxCameraX = Math.max(0, arenaRadius - halfVisibleWidth);
  const maxCameraY = Math.max(0, arenaRadius - halfVisibleHeight);

  const targetX = Math.max(-maxCameraX, Math.min(maxCameraX, targetRawX));
  const targetY = Math.max(-maxCameraY, Math.min(maxCameraY, targetRawY));

  const positionEase = 0.035 + speedNorm * 0.045;
  const zoomEase = 0.025 + speedNorm * 0.025;

  camera.x += (targetX - camera.x) * positionEase;
  camera.y += (targetY - camera.y) * positionEase;
  camera.zoom += (targetZoom - camera.zoom) * zoomEase;
}

export function getEditFitZoom(rect, arenaRadius) {
  if (!rect?.width || !rect?.height || !arenaRadius) return 1;
  const pad = 0.92;
  const diameter = arenaRadius * 2;
  const zoomX = rect.width / diameter;
  const zoomY = rect.height / diameter;
  return Math.max(0.2, Math.min(2.2, Math.min(zoomX, zoomY) * pad));
}

export function resetEditCamera(cameraRef, rect, arenaRadius) {
  const camera = cameraRef.current;
  camera.x = 0;
  camera.y = 0;
  camera.zoom = getEditFitZoom(rect, arenaRadius);
}

export function clampEditCamera(cameraRef, rect, arenaRadius) {
  const camera = cameraRef.current;
  const minZoom = getEditFitZoom(rect, arenaRadius);
  const maxZoom = 2.2;
  camera.zoom = Math.max(minZoom, Math.min(maxZoom, camera.zoom));

  const marginX = rect.width * 0.5 / camera.zoom;
  const marginY = rect.height * 0.5 / camera.zoom;
  const maxX = Math.max(0, arenaRadius - marginX);
  const maxY = Math.max(0, arenaRadius - marginY);
  camera.x = Math.max(-maxX, Math.min(maxX, camera.x));
  camera.y = Math.max(-maxY, Math.min(maxY, camera.y));
}

export function panEditCamera(cameraRef, dx, dy) {
  const camera = cameraRef.current;
  camera.x -= dx;
  camera.y -= dy;
}

export function zoomEditCameraAt(cameraRef, factor, centerWorld, rect, arenaRadius) {
  const camera = cameraRef.current;
  const prevZoom = camera.zoom;
  camera.zoom *= factor;
  clampEditCamera(cameraRef, rect, arenaRadius);
  const nextZoom = camera.zoom;
  if (prevZoom <= 0 || nextZoom <= 0) return;

  camera.x = centerWorld.x - ((centerWorld.x - camera.x) * prevZoom) / nextZoom;
  camera.y = centerWorld.y - ((centerWorld.y - camera.y) * prevZoom) / nextZoom;
  clampEditCamera(cameraRef, rect, arenaRadius);
}

export function enterWorld(ctx, rect, cameraRef, stateRef) {
  const camera = cameraRef.current;
  const fish = stateRef.current.fish || {};

  const speed = Math.hypot(fish.vx || 0, fish.vy || 0);
  const speedNorm = Math.min(1, speed / 18);
  const t = performance.now() * 0.001;

  const driftX = Math.sin(t * 0.33) * 4 * (0.25 + speedNorm);
  const driftY = Math.cos(t * 0.27) * 4 * (0.25 + speedNorm);

  const viewZoom = Number.isFinite(stateRef.current.viewZoom)
    ? stateRef.current.viewZoom
    : 0;
  const arenaRadius = stateRef.current?.arenaRadius || 1200;
  const fitZoom = Math.min(rect.width, rect.height) / (arenaRadius * 1.9);
  const userZoom = Math.max(0.2, Number.isFinite(camera.zoom) ? camera.zoom : 1);
  const finalZoom = fitZoom * userZoom * (1.0 + viewZoom * 3.8);

  ctx.save();
  ctx.translate(rect.width / 2, rect.height / 2);
  ctx.scale(finalZoom, finalZoom);
  const followBlend = 1;
  const camX = camera.x * followBlend;
  const camY = camera.y * followBlend;

  ctx.translate(-camX + driftX * followBlend, -camY + driftY * followBlend);
}

export function exitWorld(ctx) {
  ctx.restore();
}
