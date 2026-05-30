export const ECHOSTORY_MUSIC_CORE_ID = "core";
export const ECHOSTORY_CORE_SYMBOL = "🫧";

export function makeLinkId(a, b) {
  return [a, b].sort().join("__");
}

export function getEchostoryLinks(echostory = {}) {
  if (Array.isArray(echostory.links)) return echostory.links;
  if (Array.isArray(echostory.constellationLinks)) {
    return echostory.constellationLinks.map((link) => ({
      ...link,
      id: link?.id || makeLinkId(link?.from, link?.to),
    }));
  }
  return [];
}

export function getCoreConnectedStarIds(links = []) {
  const adjacency = new Map();
  links.forEach((link) => {
    if (!link?.from || !link?.to) return;
    if (!adjacency.has(link.from)) adjacency.set(link.from, new Set());
    if (!adjacency.has(link.to)) adjacency.set(link.to, new Set());
    adjacency.get(link.from).add(link.to);
    adjacency.get(link.to).add(link.from);
  });

  const connected = new Set();
  const queue = [ECHOSTORY_MUSIC_CORE_ID];
  while (queue.length) {
    const id = queue.shift();
    if (!id || connected.has(id)) continue;
    connected.add(id);
    (adjacency.get(id) || []).forEach((nextId) => {
      if (!connected.has(nextId)) queue.push(nextId);
    });
  }
  connected.delete(ECHOSTORY_MUSIC_CORE_ID);
  return connected;
}

function normalizeRawLinks(echostory = {}) {
  const seen = new Set();
  return getEchostoryLinks(echostory)
    .filter((link) => link?.from && link?.to && link.from !== link.to)
    .map((link) => {
      const [from, to] = [link.from, link.to].sort();
      return {
        ...link,
        id: makeLinkId(from, to),
        from,
        to,
        kind: link.kind || (from === ECHOSTORY_MUSIC_CORE_ID || to === ECHOSTORY_MUSIC_CORE_ID ? "music-core" : "branch"),
      };
    })
    .filter((link) => {
      if (seen.has(link.id)) return false;
      seen.add(link.id);
      return true;
    });
}

function keepOnlyCoreReachableLinks(links = []) {
  const coreConnectedIds = getCoreConnectedStarIds(links);
  return links.filter((link) => {
    if (link?.from === ECHOSTORY_MUSIC_CORE_ID || link?.to === ECHOSTORY_MUSIC_CORE_ID) return true;
    return coreConnectedIds.has(link.from) && coreConnectedIds.has(link.to);
  });
}

export function canCreateEchostoryLink(echostory = {}, a, b) {
  if (!a || !b || a === b) return false;
  if (a === ECHOSTORY_MUSIC_CORE_ID || b === ECHOSTORY_MUSIC_CORE_ID) return true;
  const links = keepOnlyCoreReachableLinks(normalizeRawLinks(echostory));
  const coreConnectedIds = getCoreConnectedStarIds(links);
  return coreConnectedIds.has(a) || coreConnectedIds.has(b);
}

export function normalizeEchostoryNetwork(echostory = {}) {
  const links = keepOnlyCoreReachableLinks(normalizeRawLinks(echostory));
  const coreConnectedIds = getCoreConnectedStarIds(links);
  const stars = Array.isArray(echostory.stars)
    ? echostory.stars.map((star) => star?.id ? { ...star, connectedToCore: coreConnectedIds.has(star.id) } : star)
    : echostory.stars;

  return {
    ...echostory,
    stars,
    links,
    constellationLinks: links,
    coreConnectedStarIds: [...coreConnectedIds],
  };
}

export function toggleEchostoryLink(echostory = {}, a, b, options = {}) {
  if (!a || !b || a === b) return normalizeEchostoryNetwork(echostory);
  const [from, to] = [a, b].sort();
  const id = makeLinkId(from, to);
  const links = keepOnlyCoreReachableLinks(normalizeRawLinks(echostory));
  const exists = links.some((link) => link.id === id);
  if (!exists && !canCreateEchostoryLink({ ...echostory, links, constellationLinks: links }, from, to)) {
    return normalizeEchostoryNetwork({ ...echostory, links, constellationLinks: links });
  }
  const measuredLength = Number.isFinite(options.restLength) ? options.restLength : 132;
  const nextLinks = exists
    ? links.filter((link) => link.id !== id)
    : [
        ...links,
        {
          id,
          from,
          to,
          restLength: measuredLength,
          kind: options.kind || (from === ECHOSTORY_MUSIC_CORE_ID || to === ECHOSTORY_MUSIC_CORE_ID ? "music-core" : "branch"),
          createdAt: Date.now(),
        },
      ];
  const linkEffects = [
    ...(Array.isArray(echostory.linkEffects) ? echostory.linkEffects : []),
    {
      id: `${exists ? "remove" : "create"}-${id}-${Date.now()}`,
      linkId: id,
      from,
      to,
      type: exists ? "remove" : "create",
      startedAt: Number.isFinite(options.now) ? options.now : Date.now(),
    },
  ].slice(-24);

  return normalizeEchostoryNetwork({
    ...echostory,
    links: nextLinks,
    constellationLinks: nextLinks,
    linkEffects,
  });
}
