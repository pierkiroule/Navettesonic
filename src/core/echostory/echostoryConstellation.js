export const ECHOSTORY_MUSIC_CORE_ID = "core-bubble";
export const ECHOSTORY_CORE_SYMBOL = "🫧";

function normalizeCoreId(id) {
  return id === "core" ? ECHOSTORY_MUSIC_CORE_ID : id;
}

export function makeLinkId(a, b) {
  return [normalizeCoreId(a), normalizeCoreId(b)].sort().join("__");
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
    const from = normalizeCoreId(link?.from);
    const to = normalizeCoreId(link?.to);
    if (!from || !to) return;
    if (!adjacency.has(from)) adjacency.set(from, new Set());
    if (!adjacency.has(to)) adjacency.set(to, new Set());
    adjacency.get(from).add(to);
    adjacency.get(to).add(from);
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
      const [from, to] = [normalizeCoreId(link.from), normalizeCoreId(link.to)].sort();
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
  const normalizedA = normalizeCoreId(a);
  const normalizedB = normalizeCoreId(b);
  if (!normalizedA || !normalizedB || normalizedA === normalizedB) return false;
  if (normalizedA === ECHOSTORY_MUSIC_CORE_ID || normalizedB === ECHOSTORY_MUSIC_CORE_ID) return true;
  const links = keepOnlyCoreReachableLinks(normalizeRawLinks(echostory));
  const coreConnectedIds = getCoreConnectedStarIds(links);
  return coreConnectedIds.has(normalizedA) || coreConnectedIds.has(normalizedB);
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
  const normalizedA = normalizeCoreId(a);
  const normalizedB = normalizeCoreId(b);
  if (!normalizedA || !normalizedB || normalizedA === normalizedB) return normalizeEchostoryNetwork(echostory);
  const [from, to] = [normalizedA, normalizedB].sort();
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
