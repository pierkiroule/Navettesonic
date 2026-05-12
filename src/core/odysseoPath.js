const MIN_POINT_DISTANCE = 10;
const MAX_PATH_POINTS = 900;

export function addOdysseoPathPoint(path = [], x, y) {
  const last = path[path.length - 1];

  if (last && Math.hypot(last.x - x, last.y - y) < MIN_POINT_DISTANCE) {
    return path;
  }

  return [
    ...path,
    {
      x,
      y,
      depth: last?.depth || 1,
    },
  ].slice(-MAX_PATH_POINTS);
}

export function clearOdysseoPath() {
  return [];
}

export function addDepthMarker(markers = [], path = [], x, y, depth = 1) {
  if (!path.length) return markers;

  let bestIndex = 0;
  let bestDistance = Infinity;

  path.forEach((point, index) => {
    const d = Math.hypot(point.x - x, point.y - y);

    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = index;
    }
  });

  return [
    ...markers,
    {
      id: `depth-marker-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      pathIndex: bestIndex,
      depth,
    },
  ];
}

export function getDepthAtPathIndex(markers = [], index = 0) {
  if (!markers.length) return 1;

  let best = markers[0];
  let bestDistance = Math.abs(index - best.pathIndex);

  markers.forEach((marker) => {
    const d = Math.abs(index - marker.pathIndex);

    if (d < bestDistance) {
      best = marker;
      bestDistance = d;
    }
  });

  return best?.depth || 1;
}

export function stepOdysseoTraversal({
  path = [],
  index = 0,
  direction = 1,
  speed = 1,
}) {
  if (path.length < 2) {
    return {
      index: 0,
      direction: 1,
      point: path[0] || null,
      angle: -Math.PI / 2,
    };
  }

  let nextIndex = index + direction * speed;

  if (nextIndex >= path.length - 1) {
    nextIndex = path.length - 1;
    direction = -1;
  }

  if (nextIndex <= 0) {
    nextIndex = 0;
    direction = 1;
  }

  const low = Math.floor(nextIndex);
  const high = Math.min(path.length - 1, low + 1);
  const t = nextIndex - low;

  const a = path[low];
  const b = path[high];

  const point = {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };

  const lookBehind = Math.max(0, Math.floor(nextIndex - direction * 3));
  const lookAhead = Math.min(path.length - 1, Math.floor(nextIndex + direction * 3));

  const prev = path[lookBehind] || a;
  const next = path[lookAhead] || b;

  let angle = Math.atan2(next.y - prev.y, next.x - prev.x);

  return {
    index: nextIndex,
    direction,
    point,
    angle,
  };
}

export function drawOdysseoPath(ctx, path = [], markers = [], time = performance.now()) {
  if (path.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  ctx.strokeStyle = "rgba(125, 211, 252, 0.58)";
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
  ctx.lineWidth = 2;
  ctx.stroke();

  markers.forEach((marker) => {
    const point = path[marker.pathIndex];
    if (!point) return;

    const pulse = Math.sin(time * 0.005 + marker.pathIndex) * 0.5 + 0.5;
    const hue = marker.depth === 1 ? 190 : marker.depth === 2 ? 250 : 145;

    ctx.beginPath();
    ctx.arc(point.x, point.y, 18 + pulse * 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 95%, 68%, 0.32)`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 95%, 72%, 0.82)`;
    ctx.fill();

    ctx.fillStyle = "rgba(2, 6, 23, 0.9)";
    ctx.font = "900 13px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`⚓${marker.depth}`, point.x, point.y);
  });

  ctx.restore();
}
