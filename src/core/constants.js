export const ARENA_INNER_BOUNDARY_INSET = 32;

export function getFishNavigableRadius(arenaRadius = 0) {
  const safeArenaRadius = Number.isFinite(arenaRadius) ? arenaRadius : 0;
  return Math.max(0, safeArenaRadius - ARENA_INNER_BOUNDARY_INSET);
}
