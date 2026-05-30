export const ECHOSTORY_MUSIC_CORE_ID = "core-bubble";
export const ECHOSTORY_CORE_SYMBOL = "🫧";

export function normalizeCoreId(id) {
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
  return links;
}

export function canCreateEchostoryLink(echostory = {}, a, b) {
  void echostory;
  const normalizedA = normalizeCoreId(a);
  const normalizedB = normalizeCoreId(b);
  return Boolean(normalizedA && normalizedB && normalizedA !== normalizedB);
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

function getSelectableWeaveEndpointIds(echostory = {}) {
  const starIds = new Set((echostory.stars || []).map((star) => star?.id).filter(Boolean));
  return new Set([ECHOSTORY_MUSIC_CORE_ID, ...starIds]);
}

function getSafeSelectedWeaveEndpointIds(echostory = {}) {
  const selectable = getSelectableWeaveEndpointIds(echostory);
  const rawIds = Array.isArray(echostory.selectedWeaveEndpointIds)
    ? echostory.selectedWeaveEndpointIds
    : Array.isArray(echostory.selectedContourStarIds)
      ? echostory.selectedContourStarIds
      : [];
  return rawIds
    .map(normalizeCoreId)
    .filter((id, index, ids) => id && ids.indexOf(id) === index && selectable.has(id))
    .slice(0, 2);
}

function markSelectedWeaveEndpoints(echostory = {}, selectedIds = []) {
  const selectedSet = new Set(selectedIds);
  return {
    ...echostory,
    selectedWeaveEndpointIds: selectedIds,
    selectedContourStarIds: selectedIds.filter((id) => id !== ECHOSTORY_MUSIC_CORE_ID),
    stars: (echostory.stars || []).map((star) => (
      star?.id
        ? { ...star, selectedOnContour: selectedSet.has(star.id), selectedForWeaving: selectedSet.has(star.id) }
        : star
    )),
  };
}

export function toggleEchostoryWeaveSelection(echostory = {}, endpointId, options = {}) {
  const normalizedId = normalizeCoreId(endpointId);
  if (!normalizedId || !getSelectableWeaveEndpointIds(echostory).has(normalizedId)) {
    return normalizeEchostoryNetwork(markSelectedWeaveEndpoints(echostory, getSafeSelectedWeaveEndpointIds(echostory)));
  }

  const selectedIds = getSafeSelectedWeaveEndpointIds(echostory);
  const selectedSet = new Set(selectedIds);
  const alreadySelected = selectedSet.has(normalizedId);
  const otherSelectedId = selectedIds.find((id) => id !== normalizedId) || null;
  let next = echostory;
  let nextSelectedIds;

  if (alreadySelected) {
    if (otherSelectedId && getEchostoryLinks(next).some((link) => (link?.id || makeLinkId(link?.from, link?.to)) === makeLinkId(normalizedId, otherSelectedId))) {
      next = toggleEchostoryLink(next, normalizedId, otherSelectedId, options);
    }
    nextSelectedIds = selectedIds.filter((id) => id !== normalizedId);
  } else {
    nextSelectedIds = selectedIds.length >= 2 ? [normalizedId] : [...selectedIds, normalizedId];
    if (nextSelectedIds.length === 2) {
      const [from, to] = nextSelectedIds;
      const linkExists = getEchostoryLinks(next).some((link) => (link?.id || makeLinkId(link?.from, link?.to)) === makeLinkId(from, to));
      if (!linkExists) {
        next = toggleEchostoryLink(next, from, to, options);
      }
    }
  }

  return normalizeEchostoryNetwork(markSelectedWeaveEndpoints(next, nextSelectedIds));
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
