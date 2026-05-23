import { getDepthAtPathIndex } from "../odysseoPath.js";

const DEFAULT_DURATION_SEC = 180;
const DEFAULT_TICKS_PER_SEC = 60;

function getTraversalSpeed(pathLength, desiredDurationSec) {
  if (pathLength < 2) return 0;

  const duration = Number.isFinite(desiredDurationSec) && desiredDurationSec > 0
    ? desiredDurationSec
    : DEFAULT_DURATION_SEC;

  return (pathLength - 1) / (duration * DEFAULT_TICKS_PER_SEC);
}

function interpolateForward(path, index) {
  const clampedIndex = Math.max(0, Math.min(path.length - 1, index));
  const low = Math.floor(clampedIndex);
  const high = Math.min(path.length - 1, low + 1);
  const t = clampedIndex - low;

  const a = path[low];
  const b = path[high];

  const point = {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };

  const lookBehind = Math.max(0, Math.floor(clampedIndex - 3));
  const lookAhead = Math.min(path.length - 1, Math.floor(clampedIndex + 3));
  const prev = path[lookBehind] || a;
  const next = path[lookAhead] || b;
  const angle = Math.atan2(next.y - prev.y, next.x - prev.x);

  return { point, angle, index: clampedIndex };
}

export function tickEchostoryTraversal(state, options = {}) {
  const path = state.odysseoPath || [];
  const currentIndex = Math.max(0, state.echostoryPathIndex ?? 0);

  if (path.length < 2) return null;

  const speed = getTraversalSpeed(path.length, options.desiredDurationSec);
  const endIndex = path.length - 1;
  const nextIndex = Math.min(endIndex, currentIndex + speed);
  const finished = nextIndex >= endIndex;

  const { point, angle, index } = interpolateForward(path, nextIndex);
  const depth = getDepthAtPathIndex(state.odysseoDepthMarkers || [], Math.round(index));

  return {
    echostoryPathIndex: index,
    fish: {
      ...state.fish,
      x: point.x,
      y: point.y,
      targetX: point.x,
      targetY: point.y,
      depth,
      angle,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    },
    finished,
    traversalFinished: finished,
    traversalActive: !finished,
    escapeState: finished ? "approach" : (state.echostory?.escapeState || "idle"),
  };
}
