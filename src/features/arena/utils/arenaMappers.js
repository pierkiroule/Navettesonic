export function dbBubbleToRuntimeBubble(row) {
  return {
    id: row.id,
    _sampleId: row.sample_id,
    label: row.label,
    x: row.x,
    y: row.y,
    r: row.radius,
    hue: row.hue,
    layer: row.layer,
    haloStyle: row.halo_style,
    version: row.version,
  };
}

export function runtimeBubbleToDbInsert({ arenaId, userId, bubble }) {
  return {
    id: bubble.id,
    arena_id: arenaId,
    created_by: userId || null,
    sample_id: bubble._sampleId,
    label: bubble.label || null,
    x: Number(bubble.x) || 0,
    y: Number(bubble.y) || 0,
    radius: Number(bubble.r) || 72,
    hue: Number.isFinite(Number(bubble.hue)) ? Number(bubble.hue) : 195,
    layer: bubble.layer || 'front',
    halo_style: bubble.haloStyle || 'aurora',
    version: Number.isFinite(Number(bubble.version)) ? Number(bubble.version) : 1,
  };
}

export function runtimeBubbleToDbPatch(bubble, patch = {}) {
  const next = { ...bubble, ...patch };
  return {
    sample_id: next._sampleId,
    label: next.label || null,
    x: Number(next.x) || 0,
    y: Number(next.y) || 0,
    radius: Number(next.r) || 72,
    hue: Number.isFinite(Number(next.hue)) ? Number(next.hue) : 195,
    layer: next.layer || 'front',
    halo_style: next.haloStyle || 'aurora',
    version: (Number.isFinite(Number(bubble.version)) ? Number(bubble.version) : 0) + 1,
  };
}
