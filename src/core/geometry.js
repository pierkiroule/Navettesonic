export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function clampToCircle(point, radius) {
  const d = Math.hypot(point.x, point.y);

  if (d <= radius) return point;

  const ratio = radius / d;

  return {
    x: point.x * ratio,
    y: point.y * ratio,
  };
}

export function screenToWorld({ clientX, clientY, rect, camera }) {
  const x = clientX - rect.left - rect.width / 2;
  const y = clientY - rect.top - rect.height / 2;

  return {
    x: x / camera.zoom + camera.x,
    y: y / camera.zoom + camera.y,
  };
}

export function worldToScreen({ x, y, rect, camera }) {
  return {
    x: (x - camera.x) * camera.zoom + rect.width / 2,
    y: (y - camera.y) * camera.zoom + rect.height / 2,
  };
}

export function makeId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getBubbleVisualRadius(bubble) {
  const depth = Math.max(1, Math.min(3, Math.round(bubble?.depth || 1)));
  const depthScale = 0.82 + depth * 0.12;
  return (bubble?.r || 70) * depthScale;
}

export function getBubbleHitRadius(bubble) {
  return getBubbleVisualRadius(bubble) + 12;
}

export function getBubblePhysicsRadius(bubble) {
  return getBubbleVisualRadius(bubble);
}

export function getBubbleAudioRadius(bubble) {
  return getBubbleVisualRadius(bubble) + 85;
}
