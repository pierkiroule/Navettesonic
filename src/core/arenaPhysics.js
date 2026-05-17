import { clampToCircle } from "./geometry.js";

export function clampWithinBand({ x = 0, y = 0, minRadius = 0, maxRadius = 0, damping = 0.6, vx = 0, vy = 0 }) {
  const dist = Math.hypot(x, y);
  if (dist <= maxRadius && dist >= minRadius) {
    return { x, y, vx, vy, clamped: false };
  }
  const target = dist > maxRadius ? maxRadius : minRadius;
  const sx = x / Math.max(0.0001, dist);
  const sy = y / Math.max(0.0001, dist);
  return {
    x: sx * target,
    y: sy * target,
    vx: vx * damping,
    vy: vy * damping,
    clamped: true,
  };
}

export function slideOnCircularWall({ x = 0, y = 0, vx = 0, vy = 0, wallRadius = 0, inwardOffset = 4 }) {
  const radialAngle = Math.atan2(y, x);
  const radialX = Math.cos(radialAngle);
  const radialY = Math.sin(radialAngle);
  const tx = -radialY;
  const ty = radialX;
  const ts = vx * tx + vy * ty;
  const projectedVx = tx * ts;
  const projectedVy = ty * ts;
  const clamped = clampToCircle({ x, y }, Math.max(1, wallRadius - inwardOffset));
  return {
    x: clamped.x,
    y: clamped.y,
    vx: projectedVx,
    vy: projectedVy,
  };
}
