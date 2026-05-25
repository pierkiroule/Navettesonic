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

export function buildStarMp3Trace({ collectedStars = [], path = [] } = {}) {
  const safeStars = Array.isArray(collectedStars) ? collectedStars : [];
  const ordered = [...safeStars].sort((a, b) => {
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
    };
  });
}
