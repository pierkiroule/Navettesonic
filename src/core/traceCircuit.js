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
