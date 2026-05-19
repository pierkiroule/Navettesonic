const TAU = Math.PI * 2;

export function createArenaBlob(pointCount = 96, baseRadius = 1200) {
  const count = Math.max(16, pointCount | 0);
  return {
    baseRadius,
    points: Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * TAU,
      offset: 0,
      velocity: 0,
    })),
  };
}

export function shortestAngularDistance(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export function getBlobRadiusAtAngle(blob, angle) {
  const points = blob?.points;
  const baseRadius = Number.isFinite(blob?.baseRadius) ? blob.baseRadius : 1200;
  if (!Array.isArray(points) || points.length < 2) return baseRadius;
  const normalized = ((angle % TAU) + TAU) % TAU;
  const step = TAU / points.length;
  const index = Math.floor(normalized / step);
  const nextIndex = (index + 1) % points.length;
  const localT = (normalized - index * step) / step;
  const a = points[index]?.offset || 0;
  const b = points[nextIndex]?.offset || 0;
  return baseRadius + a + (b - a) * localT;
}

export function updateBlobPhysics(blob, { smoothFactor = 0.09, damping = 0.9, maxOffset = 420 } = {}) {
  const points = blob?.points;
  if (!Array.isArray(points) || points.length < 3) return blob;
  const nextOffsets = points.map((point, i) => {
    const prev = points[(i - 1 + points.length) % points.length];
    const next = points[(i + 1) % points.length];
    const centerPull = ((prev.offset + next.offset) * 0.5 - point.offset) * smoothFactor;
    const nextVelocity = (point.velocity + centerPull) * damping;
    return {
      offset: Math.max(-maxOffset, Math.min(maxOffset, point.offset + nextVelocity)),
      velocity: nextVelocity,
    };
  });
  nextOffsets.forEach((nextPoint, i) => {
    points[i].offset = nextPoint.offset;
    points[i].velocity = nextPoint.velocity;
  });
  return blob;
}

function applyGaussian(blob, impactAngle, spread, mutate) {
  const points = blob?.points;
  if (!Array.isArray(points) || points.length === 0) return blob;
  points.forEach((point) => {
    const delta = shortestAngularDistance(point.angle, impactAngle);
    const falloff = Math.exp(-((delta * delta) / (spread * spread)));
    mutate(point, falloff);
  });
  return blob;
}

export function inflateBlobAtAngle(blob, angle, force = 120) {
  return applyGaussian(blob, angle, 0.46, (point, falloff) => {
    point.offset += force * falloff;
  });
}

export function digBlobAtAngle(blob, angle, force = 120) {
  return applyGaussian(blob, angle, 0.42, (point, falloff) => {
    point.offset -= force * falloff;
  });
}

export function smoothBlobAtAngle(blob, angle, amount = 0.4) {
  const points = blob?.points;
  if (!Array.isArray(points) || points.length < 3) return blob;
  return applyGaussian(blob, angle, 0.7, (point, falloff) => {
    const index = points.indexOf(point);
    const prev = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const average = (prev.offset + point.offset + next.offset) / 3;
    const blend = amount * falloff;
    point.offset = point.offset + (average - point.offset) * blend;
    point.velocity *= 0.75;
  });
}

export function sealBlobAtAngle(blob, angle, amount = 0.5) {
  return applyGaussian(blob, angle, 0.5, (point, falloff) => {
    const blend = amount * falloff;
    point.offset = point.offset + (0 - point.offset) * blend;
    point.velocity *= 0.7;
  });
}

export function applyBlobAction(blob, type, angle) {
  if (!blob?.points?.length) return blob;
  const nextBlob = {
    ...blob,
    points: blob.points.map((point) => ({ ...point })),
  };
  if (type === "inflate") return inflateBlobAtAngle(nextBlob, angle, 140);
  if (type === "dig") return digBlobAtAngle(nextBlob, angle, 130);
  if (type === "smooth") return smoothBlobAtAngle(nextBlob, angle, 0.55);
  if (type === "seal") return sealBlobAtAngle(nextBlob, angle, 0.65);
  return nextBlob;
}
