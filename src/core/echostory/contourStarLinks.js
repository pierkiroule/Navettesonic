function getSafeSelectedStarIds(echostory = {}) {
  const ids = Array.isArray(echostory.selectedContourStarIds)
    ? echostory.selectedContourStarIds
    : [];
  const available = new Set((echostory.stars || []).map((star) => star?.id).filter(Boolean));
  return ids.filter((id, index) => id && ids.indexOf(id) === index && available.has(id));
}

function buildContourStarLinks(selectedIds = []) {
  const links = [];
  for (let index = 1; index < selectedIds.length; index += 1) {
    links.push({
      id: `contour-star-link-${selectedIds[index - 1]}-${selectedIds[index]}`,
      from: selectedIds[index - 1],
      to: selectedIds[index],
    });
  }
  return links;
}

export function toggleContourStarSelection(echostory = {}, starId) {
  if (!starId) return echostory;
  const sourceStar = (echostory.stars || []).find((star) => star?.id === starId);
  if (!sourceStar?.attachedToContour) return echostory;

  const selectedIds = getSafeSelectedStarIds(echostory);
  const alreadySelected = selectedIds.includes(starId);
  const nextSelectedIds = alreadySelected
    ? selectedIds.filter((id) => id !== starId)
    : [...selectedIds, starId];
  const selectedSet = new Set(nextSelectedIds);

  return {
    ...echostory,
    selectedContourStarIds: nextSelectedIds,
    contourStarLinks: buildContourStarLinks(nextSelectedIds),
    stars: (echostory.stars || []).map((star) => (
      star?.id
        ? { ...star, selectedOnContour: selectedSet.has(star.id) }
        : star
    )),
  };
}

export function clearContourStarSelection(echostory = {}) {
  return {
    ...echostory,
    selectedContourStarIds: [],
    contourStarLinks: [],
    stars: (echostory.stars || []).map((star) => (
      star?.selectedOnContour ? { ...star, selectedOnContour: false } : star
    )),
  };
}
