import { ECHOSTORY_MUSIC_CORE_ID } from "./echostoryConstellation.js";

export const ECHOSTORY_COMPOSITION_STYLES = [
  {
    id: "hypnotique",
    label: "Hypnotique",
    tempo: "lent",
    silence: "long",
    texture: "nappes respirées",
  },
  {
    id: "onirique",
    label: "Onirique",
    tempo: "souple",
    silence: "flottant",
    texture: "échos cristallins",
  },
  {
    id: "somatique",
    label: "Somatique",
    tempo: "ancré",
    silence: "pulsé",
    texture: "souffles graves",
  },
  {
    id: "lumiere",
    label: "Lumière",
    tempo: "ascendant",
    silence: "clair",
    texture: "harmoniques ouvertes",
  },
];

export function getEchostoryCompositionStyle(styleId = "hypnotique") {
  return ECHOSTORY_COMPOSITION_STYLES.find((style) => style.id === styleId) || ECHOSTORY_COMPOSITION_STYLES[0];
}

function collectConstellationComponents(stars = [], links = []) {
  const starsById = new Map(stars.map((star) => [star?.id, star]).filter(([id]) => id));
  const adjacency = new Map();

  links.forEach((link) => {
    const fromIsCore = link?.from === ECHOSTORY_MUSIC_CORE_ID;
    const toIsCore = link?.to === ECHOSTORY_MUSIC_CORE_ID;
    const from = fromIsCore ? { id: ECHOSTORY_MUSIC_CORE_ID } : starsById.get(link?.from);
    const to = toIsCore ? { id: ECHOSTORY_MUSIC_CORE_ID } : starsById.get(link?.to);
    if (!from || !to || from.expired || to.expired) return;
    if (!adjacency.has(from.id)) adjacency.set(from.id, new Set());
    if (!adjacency.has(to.id)) adjacency.set(to.id, new Set());
    adjacency.get(from.id).add(to.id);
    adjacency.get(to.id).add(from.id);
  });

  const visited = new Set();
  const components = [];
  adjacency.forEach((_neighbors, startId) => {
    if (visited.has(startId)) return;
    const queue = [startId];
    const ids = [];
    visited.add(startId);
    while (queue.length) {
      const id = queue.shift();
      ids.push(id);
      (adjacency.get(id) || []).forEach((nextId) => {
        if (visited.has(nextId)) return;
        visited.add(nextId);
        queue.push(nextId);
      });
    }
    const componentStars = ids.map((id) => starsById.get(id)).filter(Boolean);
    if (componentStars.length) components.push(componentStars);
  });

  return components.sort((a, b) => b.length - a.length);
}

export function buildEchostoryCompositionPlan({ echostory = {}, styleId = "hypnotique" } = {}) {
  const style = getEchostoryCompositionStyle(styleId);
  const stars = Array.isArray(echostory?.stars) ? echostory.stars.filter((star) => star && !star.expired) : [];
  const links = Array.isArray(echostory?.constellationLinks) ? echostory.constellationLinks : [];
  const components = collectConstellationComponents(stars, links);
  const linkedStarIds = new Set(components.flat().map((star) => star.id));
  const soloStars = stars.filter((star) => !linkedStarIds.has(star.id) && !star.attachedToContour && !star.expiring);
  const sections = components.map((component, index) => ({
    id: `constellation-${index + 1}`,
    type: "constellation",
    starIds: component.map((star) => star.id),
    texts: component.map((star) => star.text).filter(Boolean),
    density: component.length,
    durationSec: Math.max(24, Math.min(90, 18 + component.length * 12)),
  }));

  soloStars.forEach((star, index) => {
    sections.push({
      id: `etoile-libre-${index + 1}`,
      type: "solo",
      starIds: [star.id],
      texts: star.text ? [star.text] : [],
      density: 1,
      durationSec: 18,
    });
  });

  return {
    id: `echostory-composition-${Date.now()}`,
    style,
    generatedAt: Date.now(),
    constellationCount: components.length,
    starCount: sections.reduce((total, section) => total + section.starIds.length, 0),
    sections,
  };
}
