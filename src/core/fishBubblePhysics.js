import { clampToCircle, getBubblePhysicsRadius, normalizeDepth } from "./geometry.js";
import { DEFAULT_ARENA_RADIUS } from "../store/soonInitialState.js";

export function clampDepth(depth) {
  return normalizeDepth(depth);
}

export function pushBubblesFromFish(bubbles = [], fish = {}, fishDepth = 1) {
  const fishX = fish.x || 0;
  const fishY = fish.y || 0;
  const fishAngle = Number.isFinite(fish.angle) ? fish.angle : -Math.PI / 2;
  const head = { x: fishX + Math.cos(fishAngle) * 36, y: fishY + Math.sin(fishAngle) * 36, radius: 34 };
  const body = { x: fishX - Math.cos(fishAngle) * 10, y: fishY - Math.sin(fishAngle) * 10, radius: 40 };
  return bubbles.map((bubble) => {
    const bubbleRadius = getBubblePhysicsRadius(bubble);
    let pushX = 0; let pushY = 0;
    [head, body].forEach((zone) => {
      const dx = (bubble.x || 0) - zone.x;
      const dy = (bubble.y || 0) - zone.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const overlap = zone.radius + bubbleRadius - d;
      if (overlap <= 0) return;
      const push = overlap * 0.2;
      pushX += (dx / d) * push;
      pushY += (dy / d) * push;
    });
    if (pushX === 0 && pushY === 0) return bubble;
    const boundaryRadius = DEFAULT_ARENA_RADIUS * 1.6;
    const nextX = (bubble.x || 0) + pushX;
    const nextY = (bubble.y || 0) + pushY;
    const dist = Math.hypot(nextX, nextY);
    const stickThreshold = boundaryRadius - Math.max(18, bubbleRadius * 0.35);
    if (dist >= stickThreshold && dist > 0) {
      const angle = Math.atan2(nextY, nextX);
      return { ...bubble, x: Math.cos(angle) * boundaryRadius, y: Math.sin(angle) * boundaryRadius };
    }
    const safe = clampToCircle({ x: nextX, y: nextY }, boundaryRadius);
    return { ...bubble, x: safe.x, y: safe.y };
  });
}

export function separateBubblesByDepth(bubbles = []) {
  const next = bubbles.map((bubble) => ({ ...bubble }));
  for (let iteration = 0; iteration < 2; iteration += 1) {
    for (let i = 0; i < next.length; i += 1) {
      for (let j = i + 1; j < next.length; j += 1) {
        const a = next[i]; const b = next[j];
        const dx = (b.x || 0) - (a.x || 0);
        const dy = (b.y || 0) - (a.y || 0);
        const rawDistance = Math.hypot(dx, dy);
        const useFallbackAxis = rawDistance < 0.0001;
        const nx = useFallbackAxis ? 1 : dx / rawDistance;
        const ny = useFallbackAxis ? 0 : dy / rawDistance;
        const d = useFallbackAxis ? 0.0001 : rawDistance;
        const radiusA = getBubblePhysicsRadius(a);
        const radiusB = getBubblePhysicsRadius(b);
        const overlap = radiusA + radiusB + 6 - d;
        if (overlap <= 0) continue;
        const shift = overlap * 0.08;
        const safeA = clampToCircle({ x: a.x - nx * shift, y: a.y - ny * shift }, DEFAULT_ARENA_RADIUS * 1.6);
        const safeB = clampToCircle({ x: b.x + nx * shift, y: b.y + ny * shift }, DEFAULT_ARENA_RADIUS * 1.6);
        a.x = safeA.x; a.y = safeA.y; b.x = safeB.x; b.y = safeB.y;
      }
    }
  }
  return next;
}
