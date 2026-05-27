const WAVE_WEIGHT = {
  immersion: 1,
  bascule: 2,
  ouverture: 3,
};

function sanitizeSlug(input = "") {
  return String(input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}

function normalizeAngle(angle = 0) {
  const full = Math.PI * 2;
  let normalized = Number.isFinite(angle) ? angle % full : 0;
  if (normalized < 0) normalized += full;
  return normalized;
}

export function buildStarMp3Trace({ collectedStars = [], path = [] } = {}) {
  const safeStars = Array.isArray(collectedStars) ? collectedStars : [];
  const orbitingStars = safeStars.filter((star) => star?.attachedToContour);
  const ordered = [...safeStars].sort((a, b) => {
    if (orbitingStars.length > 0) {
      const aa = normalizeAngle(a?.contourAngle ?? Math.atan2(a?.y || 0, a?.x || 0));
      const ab = normalizeAngle(b?.contourAngle ?? Math.atan2(b?.y || 0, b?.x || 0));
      if (aa !== ab) return aa - ab;
    }
    const wa = WAVE_WEIGHT[a?.wave] || 9;
    const wb = WAVE_WEIGHT[b?.wave] || 9;
    if (wa !== wb) return wa - wb;
    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });

  return ordered.map((star, index) => {
    const cue = index + 1;
    const slug = sanitizeSlug(star?.text || star?.id || `etoile-${cue}`) || `etoile-${cue}`;
    return {
      cue,
      starId: star?.id || `star-${cue}`,
      wave: star?.wave || "immersion",
      title: star?.text || `Étoile ${cue}`,
      suggestedFile: `${String(cue).padStart(2, "0")}_${slug}.mp3`,
      traceProgress: path.length > 1 ? Number((cue / ordered.length).toFixed(3)) : 0,
      orbitFlow: Boolean(star?.attachedToContour),
      orbitAngle: normalizeAngle(star?.contourAngle ?? Math.atan2(star?.y || 0, star?.x || 0)),
    };
  });
}
