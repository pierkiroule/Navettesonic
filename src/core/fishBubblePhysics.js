import { clampToCircle, getBubblePhysicsRadius, normalizeDepth } from "./geometry.js";
import { DEFAULT_ARENA_RADIUS } from "../store/soonInitialState.js";

export function clampDepth(depth) {
  return normalizeDepth(depth);
}

export function pushBubblesFromFish(bubbles = [], fish = {}, fishDepth = 1) {
  if (fish?.isOnContourRide) return bubbles;
  const fishX = fish.x || 0;
  const fishY = fish.y || 0;
  const fishAngle = Number.isFinite(fish.angle) ? fish.angle : -Math.PI / 2;
  const fishVX = Number.isFinite(fish.vx) ? fish.vx : 0;
  const fishVY = Number.isFinite(fish.vy) ? fish.vy : 0;
  const fishSpeed = Math.hypot(fishVX, fishVY);
  const fishDirX = fishSpeed > 0.0001 ? fishVX / fishSpeed : Math.cos(fishAngle);
  const fishDirY = fishSpeed > 0.0001 ? fishVY / fishSpeed : Math.sin(fishAngle);
  const head = { x: fishX + Math.cos(fishAngle) * 42, y: fishY + Math.sin(fishAngle) * 42, radius: 44 };
  const mouth = { x: fishX + Math.cos(fishAngle) * 64, y: fishY + Math.sin(fishAngle) * 64, radius: 34 };
  const body = { x: fishX - Math.cos(fishAngle) * 12, y: fishY - Math.sin(fishAngle) * 12, radius: 38 };
  const zones = [mouth, head, body];

  return bubbles.map((bubble) => {
    const bubbleRadius = getBubblePhysicsRadius(bubble);
    const previousVX = Number.isFinite(bubble.pushVX) ? bubble.pushVX : 0;
    const previousVY = Number.isFinite(bubble.pushVY) ? bubble.pushVY : 0;
    let pushX = 0;
    let pushY = 0;
    let hitByFish = false;

    zones.forEach((zone, index) => {
      const dx = (bubble.x || 0) - zone.x;
      const dy = (bubble.y || 0) - zone.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const overlap = zone.radius + bubbleRadius - d;
      if (overlap <= 0) return;
      hitByFish = true;

      const normalX = dx / d;
      const normalY = dy / d;
      const zonePower = index === 0 ? 1.45 : index === 1 ? 1.2 : 0.9;
      const overlapPush = overlap * 0.78 * zonePower;
      const straightThrust = fishSpeed * (1.35 + zonePower * 0.25);

      pushX += normalX * overlapPush + fishDirX * straightThrust;
      pushY += normalY * overlapPush + fishDirY * straightThrust;
    });

    const boundaryRadius = DEFAULT_ARENA_RADIUS * 1.6;
    const centerDist = Math.hypot(bubble.x || 0, bubble.y || 0);
    const snapRing = boundaryRadius - Math.max(42, bubbleRadius * 0.8);
    const nearContour = centerDist >= snapRing;

    // Attracteur de contour: aide au snap quand proche du bord.
    if (!hitByFish && nearContour && centerDist > 0.0001) {
      const toRing = Math.max(0, snapRing - centerDist);
      const contourPull = 0.65 + Math.min(1.4, Math.abs(toRing) * 0.02);
      pushX += (bubble.x / centerDist) * contourPull;
      pushY += (bubble.y / centerDist) * contourPull;
    }

    // Quand Soon touche un objet déjà snappé au contour, on le décolle vers le centre.
    if (hitByFish && nearContour && centerDist > 0.0001) {
      const inwardImpulse = fishSpeed * 1.9 + 2.2;
      pushX += -(bubble.x / centerDist) * inwardImpulse;
      pushY += -(bubble.y / centerDist) * inwardImpulse;
    }

    const nextVX = (previousVX + pushX) * 0.992;
    const nextVY = (previousVY + pushY) * 0.992;
    const impulseMagnitude = Math.hypot(nextVX, nextVY);
    if (impulseMagnitude < 0.001 && pushX === 0 && pushY === 0) {
      if (previousVX === 0 && previousVY === 0) return bubble;
      return { ...bubble, pushVX: 0, pushVY: 0 };
    }

    const nextX = (bubble.x || 0) + nextVX;
    const nextY = (bubble.y || 0) + nextVY;
    const dist = Math.hypot(nextX, nextY);

    if (!hitByFish && dist >= snapRing && dist <= boundaryRadius + 36 && dist > 0) {
      const angle = Math.atan2(nextY, nextX);
      return {
        ...bubble,
        x: Math.cos(angle) * boundaryRadius,
        y: Math.sin(angle) * boundaryRadius,
        pushVX: nextVX * 0.9,
        pushVY: nextVY * 0.9,
      };
    }

    const safe = clampToCircle({ x: nextX, y: nextY }, boundaryRadius);
    const atBoundary = Math.hypot(safe.x, safe.y) >= boundaryRadius - 0.5;
    if (atBoundary) {
      return { ...bubble, x: safe.x, y: safe.y, pushVX: nextVX * 0.94, pushVY: nextVY * 0.94 };
    }

    return { ...bubble, x: safe.x, y: safe.y, pushVX: nextVX, pushVY: nextVY };
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
