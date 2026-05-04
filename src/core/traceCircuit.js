import { makeId } from "./geometry.js";

export function createDefaultTraceCircuit(radius = 520) {
  const points = [];
  const count = 8;

  for (let i = 0; i < count; i += 1) {
    const t = (i / count) * Math.PI * 2;

    points.push({
      id: makeId("beacon"),
      x: Math.sin(t) * radius,
      y: Math.sin(t * 2) * radius * 0.42,
      depth: (i % 3) + 1,
      speed: i % 2 === 0 ? 2 : 1,
    });
  }

  return points;
}

export function getLoopPoint(points, index) {
  if (!points?.length) return null;
  return points[((index % points.length) + points.length) % points.length];
}

export function smoothLoopPoint(points, index, t) {
  if (!points || points.length < 2) return { x: 0, y: 0, depth: 1, speed: 2 };

  const p0 = getLoopPoint(points, index - 1);
  const p1 = getLoopPoint(points, index);
  const p2 = getLoopPoint(points, index + 1);
  const p3 = getLoopPoint(points, index + 2);

  const tt = t * t;
  const ttt = tt * t;

  const x =
    0.5 *
    ((2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * ttt);

  const y =
    0.5 *
    ((2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * ttt);

  return {
    x,
    y,
    depth: p1.depth,
    speed: p1.speed,
  };
}

export function sampleSmoothCircuit(points, samplesPerSegment = 18) {
  if (!points || points.length < 2) return [];

  const result = [];

  for (let i = 0; i < points.length; i += 1) {
    for (let s = 0; s < samplesPerSegment; s += 1) {
      result.push(smoothLoopPoint(points, i, s / samplesPerSegment));
    }
  }

  return result;
}

export function getCircuitSpeedValue(speed) {
  if (speed === 1) return 0.008;
  if (speed === 3) return 0.022;
  return 0.014;
}

export function createSlalomCircuitFromBubbles(bubbles = []) {
  const usable = bubbles.filter((bubble) =>
    Number.isFinite(bubble.x) &&
    Number.isFinite(bubble.y)
  );

  if (usable.length < 2) {
    return createDefaultTraceCircuit();
  }

  const sorted = [...usable].sort((a, b) => {
    const aa = Math.atan2(a.y, a.x);
    const bb = Math.atan2(b.y, b.x);
    return aa - bb;
  });

  const beacons = [];

  sorted.forEach((bubble, index) => {
    const angle = Math.atan2(bubble.y, bubble.x);
    const distance = Math.hypot(bubble.x, bubble.y) || 180;

    const side = index % 2 === 0 ? -1 : 1;
    const slalomOffset = 72 + (bubble.r || 70) * 0.34;

    const tangent = angle + Math.PI / 2;
    const radialBreath = index % 2 === 0 ? 0.86 : 1.12;

    const baseX = Math.cos(angle) * distance * radialBreath;
    const baseY = Math.sin(angle) * distance * radialBreath;

    const x = baseX + Math.cos(tangent) * slalomOffset * side;
    const y = baseY + Math.sin(tangent) * slalomOffset * side;

    beacons.push({
      id: `auto-beacon-${bubble.id || index}`,
      x,
      y,
      depth: bubble.depth || ((index % 3) + 1),
      speed: index % 2 === 0 ? 1 : 2,
      auto: true,
      bubbleId: bubble.id,
    });
  });

  if (beacons.length === 2) {
    const a = beacons[0];
    const b = beacons[1];

    beacons.push({
      id: "auto-beacon-between-1",
      x: (a.x + b.x) / 2 + 120,
      y: (a.y + b.y) / 2 - 80,
      depth: 2,
      speed: 2,
      auto: true,
    });

    beacons.push({
      id: "auto-beacon-between-2",
      x: (a.x + b.x) / 2 - 120,
      y: (a.y + b.y) / 2 + 80,
      depth: 3,
      speed: 1,
      auto: true,
    });
  }

  return beacons;
}
