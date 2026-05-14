export const RADIAL_MENU_MIN_ITEMS = 3;
export const RADIAL_MENU_MAX_ITEMS = 6;

export function clampItems(items = []) {
  return items.slice(0, RADIAL_MENU_MAX_ITEMS);
}

export function getNextIndex(currentIndex, total, key) {
  if (!total) return -1;
  if (key === "ArrowRight" || key === "ArrowDown") return (currentIndex + 1 + total) % total;
  if (key === "ArrowLeft" || key === "ArrowUp") return (currentIndex - 1 + total) % total;
  return currentIndex;
}
