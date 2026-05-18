const ARENA_TYPES = Object.freeze({
  ARENA: "ARENA",
  MEGA: "MEGA",
  GIGA: "GIGA",
});

const PORTAL_POSITIONS = Object.freeze({
  TOP: "TOP",
  BOTTOM: "BOTTOM",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  CUSTOM: "CUSTOM",
});



const ARENA_RADIUS_MULTIPLIER = Object.freeze({
  ARENA: 1,
  MEGA: 2.2,
  GIGA: 3.6,
});

export const POISSON_PLUME_WIDTH = 52;
export const PORTAL_WIDTH_MULTIPLIER = 8;
export const DEFAULT_PORTAL_PASSAGE_WIDTH = POISSON_PLUME_WIDTH * PORTAL_WIDTH_MULTIPLIER;
export const ARENA_ID_BY_LEVEL = Object.freeze(["arena-1", "mega-1", "giga-1"]);

export function getArenaIdForLevel(level = 0) {
  const safeLevel = Math.max(0, Math.min(ARENA_ID_BY_LEVEL.length - 1, Number.isFinite(level) ? level : 0));
  return ARENA_ID_BY_LEVEL[safeLevel];
}

export function getArenaLevelFromId(arenaId = "") {
  const idx = ARENA_ID_BY_LEVEL.indexOf(arenaId);
  return idx >= 0 ? idx : 0;
}

export function getArenaTransitionIdsForLevel(level = 0) {
  const fromArenaId = getArenaIdForLevel(level);
  if (level <= 0) return { fromArenaId, toArenaId: getArenaIdForLevel(1) };
  if (level === 1) return { fromArenaId, toArenaId: getArenaIdForLevel(2) };
  return { fromArenaId, toArenaId: null };
}

export function getArenaRadiusMultiplier(type = ARENA_TYPES.ARENA) {
  return ARENA_RADIUS_MULTIPLIER[type] || ARENA_RADIUS_MULTIPLIER.ARENA;
}

export function getArenaRadiusForNode({ world, arenaId, baseRadius = 1200 }) {
  const node = (world?.nodes || []).find((item) => item.id === arenaId);
  return baseRadius * getArenaRadiusMultiplier(node?.type);
}

function createSeededRandom(seed = 1) {
  let state = (Number(seed) || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function makeArenaNode({ id, type, parentId = null, childrenIds = [], centerOffset = { x: 0, y: 0 } }) {
  return {
    id,
    type,
    parentId,
    childrenIds: [...childrenIds],
    centerOffset: { x: centerOffset.x || 0, y: centerOffset.y || 0 },
    hasSpawnedNeighbor: false,
    generatedExit: null,
  };
}

function pushBidirectionalPortal(portals, fromArenaId, toArenaId, forwardHint, backwardHint) {
  const passageWidth = DEFAULT_PORTAL_PASSAGE_WIDTH;
  portals.push({
    id: `${fromArenaId}__to__${toArenaId}`,
    fromArenaId,
    toArenaId,
    positionHint: forwardHint,
    bidirectional: true,
    passageWidth,
  });

  portals.push({
    id: `${toArenaId}__to__${fromArenaId}`,
    fromArenaId: toArenaId,
    toArenaId: fromArenaId,
    positionHint: backwardHint,
    bidirectional: true,
    passageWidth,
  });
}

function getNodeById(world, id) {
  return (world?.nodes || []).find((node) => node.id === id) || null;
}

function makeChildArenaId(parentId, world) {
  const base = `${parentId}-child`;
  const existingIds = new Set((world?.nodes || []).map((node) => node.id));
  let idx = 1;
  let candidate = `${base}-${idx}`;
  while (existingIds.has(candidate)) {
    idx += 1;
    candidate = `${base}-${idx}`;
  }
  return candidate;
}

function invertHint(hint) {
  if (hint === PORTAL_POSITIONS.TOP) return PORTAL_POSITIONS.BOTTOM;
  if (hint === PORTAL_POSITIONS.BOTTOM) return PORTAL_POSITIONS.TOP;
  if (hint === PORTAL_POSITIONS.LEFT) return PORTAL_POSITIONS.RIGHT;
  if (hint === PORTAL_POSITIONS.RIGHT) return PORTAL_POSITIONS.LEFT;
  return PORTAL_POSITIONS.CUSTOM;
}

function getBorderHintFromAngle(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  if (Math.abs(c) >= Math.abs(s)) return c >= 0 ? PORTAL_POSITIONS.RIGHT : PORTAL_POSITIONS.LEFT;
  return s >= 0 ? PORTAL_POSITIONS.BOTTOM : PORTAL_POSITIONS.TOP;
}

export function ensureExitForBorderTouch({
  world,
  arenaId,
  borderHint = PORTAL_POSITIONS.RIGHT,
  nextType = ARENA_TYPES.ARENA,
}) {
  if (!world || !arenaId) return null;
  const sourceNode = getNodeById(world, arenaId);
  if (!sourceNode) return null;

  if (sourceNode.generatedExit?.toArenaId) {
    return {
      created: false,
      fromArenaId: arenaId,
      toArenaId: sourceNode.generatedExit.toArenaId,
      reason: "already-spawned",
    };
  }

  const childId = makeChildArenaId(arenaId, world);
  const childNode = makeArenaNode({
    id: childId,
    type: nextType,
    parentId: arenaId,
    centerOffset: { x: 0, y: 0 },
  });
  world.nodes.push(childNode);
  sourceNode.childrenIds = [...(sourceNode.childrenIds || []), childId];
  sourceNode.hasSpawnedNeighbor = true;
  sourceNode.generatedExit = { toArenaId: childId, borderHint };

  pushBidirectionalPortal(world.portals, arenaId, childId, borderHint, invertHint(borderHint));
  return { created: true, fromArenaId: arenaId, toArenaId: childId };
}

export function generateLabybulle(seed = 1) {
  // Initialisation minimale:
  // - un seul nœud de départ;
  // - mutations du graphe via ensureExitForBorderTouch.
  const startArenaId = "arena-1";
  const nodes = [makeArenaNode({ id: startArenaId, type: ARENA_TYPES.ARENA })];
  const portals = [];
  return {
    seed,
    nodes,
    portals,
    startArenaId,
    startPosition: { x: 0, y: 0, hint: "CENTER" },
  };
}

export function validateWorldGraph(world) {
  const errors = [];
  if (!world || !Array.isArray(world.nodes) || !Array.isArray(world.portals)) {
    return ["world invalide: nodes/portals manquants"]; 
  }

  const nodeById = new Map(world.nodes.map((node) => [node.id, node]));
  world.nodes.forEach((node) => {
    if (node.parentId && !nodeById.has(node.parentId)) {
      errors.push(`parent introuvable pour ${node.id}: ${node.parentId}`);
    }
    (node.childrenIds || []).forEach((childId) => {
      if (!nodeById.has(childId)) errors.push(`enfant introuvable pour ${node.id}: ${childId}`);
    });
  });

  world.portals.forEach((portal) => {
    if (!nodeById.has(portal.fromArenaId)) errors.push(`portal.from invalide: ${portal.id}`);
    if (!nodeById.has(portal.toArenaId)) errors.push(`portal.to invalide: ${portal.id}`);
    const expectedWidth = DEFAULT_PORTAL_PASSAGE_WIDTH;
    if (portal.passageWidth !== expectedWidth) {
      errors.push(`largeur passage invalide pour ${portal.id}: ${portal.passageWidth} (attendu ${expectedWidth})`);
    }
    if (portal.bidirectional !== true) {
      errors.push(`passage non bidirectionnel pour ${portal.id}`);
    }
  });

  world.nodes.forEach((node) => {
    if (!Object.values(ARENA_TYPES).includes(node.type)) {
      errors.push(`type de node invalide: ${node.id} (${node.type})`);
    }
  });

  if (world.startArenaId && nodeById.has(world.startArenaId)) {
    const visited = new Set();
    const stack = [world.startArenaId];
    while (stack.length) {
      const current = stack.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      world.portals
        .filter((portal) => portal.fromArenaId === current)
        .forEach((portal) => {
          if (!visited.has(portal.toArenaId)) stack.push(portal.toArenaId);
        });
    }

    if (visited.size !== world.nodes.length) {
      errors.push(`graphe non connexe: ${visited.size}/${world.nodes.length} nœuds atteignables depuis ${world.startArenaId}`);
    }
  } else {
    errors.push(`startArenaId invalide: ${world.startArenaId}`);
  }

  return errors;
}

export function buildWorldDebugSnapshot(world) {
  return {
    startArenaId: world.startArenaId,
    nodes: world.nodes.map((node) => ({ id: node.id, type: node.type, parentId: node.parentId, childrenIds: node.childrenIds })),
    portals: world.portals.map((portal) => ({ id: portal.id, from: portal.fromArenaId, to: portal.toArenaId, positionHint: portal.positionHint })),
  };
}



export function getPortalAnchor({ positionHint, radius = 1200, index = 0, total = 1 }) {
  const hintToAngle = { TOP: -Math.PI / 2, BOTTOM: Math.PI / 2, LEFT: Math.PI, RIGHT: 0 };
  const angle = hintToAngle[positionHint] ?? ((index / Math.max(1, total)) * Math.PI * 2);
  return { x: Math.cos(angle) * (radius - 30), y: Math.sin(angle) * (radius - 30), angle };
}

export function getPortalOpeningAngle(world, fromArenaId, toArenaId) {
  const portal = (world?.portals || []).find(
    (item) => item.fromArenaId === fromArenaId && item.toArenaId === toArenaId
  );
  if (!portal) return null;
  return getPortalAnchor({ positionHint: portal.positionHint, radius: 1 }).angle;
}

export function getPortalOpeningHalfSpan({ radius = 1200, passageWidth = DEFAULT_PORTAL_PASSAGE_WIDTH }) {
  const safeRadius = Math.max(1, radius);
  return Math.min(Math.PI / 3, Math.max(0.12, (passageWidth / 2) / safeRadius));
}

export function resolveMembraneContact({
  world,
  arenaId,
  x = 0,
  y = 0,
  radius = 1200,
  angularToleranceDeg = 20,
  nextType = ARENA_TYPES.ARENA,
}) {
  if (!world || !arenaId) return { action: "rebound", portal: null, contactAngle: 0 };
  const room = getNodeById(world, arenaId);
  if (!room) return { action: "rebound", portal: null, contactAngle: 0 };

  const roomX = room?.centerOffset?.x || 0;
  const roomY = room?.centerOffset?.y || 0;
  const contactAngle = Math.atan2((y || 0) - roomY, (x || 0) - roomX);
  const tolerance = Math.max(0, (Number.isFinite(angularToleranceDeg) ? angularToleranceDeg : 20) * (Math.PI / 180));
  const halfSpan = getPortalOpeningHalfSpan({ radius });
  const maxGap = Math.max(halfSpan, tolerance);
  const angleDistance = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const portals = (world.portals || []).filter((portal) => portal.fromArenaId === arenaId);

  let bestPortal = null;
  let bestGap = Number.POSITIVE_INFINITY;
  portals.forEach((portal) => {
    const opening = getPortalOpeningAngle(world, portal.fromArenaId, portal.toArenaId);
    if (!Number.isFinite(opening)) return;
    const gap = Math.abs(angleDistance(contactAngle, opening));
    if (gap <= maxGap && gap < bestGap) {
      bestGap = gap;
      bestPortal = portal;
    }
  });

  if (bestPortal) {
    return { action: "transition", portal: bestPortal, created: false, contactAngle };
  }

  const roomIsNonGenerative = !Boolean(room.hasSpawnedNeighbor);
  if (roomIsNonGenerative) {
    const borderHint = getBorderHintFromAngle(contactAngle);
    const result = ensureExitForBorderTouch({ world, arenaId, borderHint, nextType });
    const createdPortal = result?.toArenaId
      ? (world?.portals || []).find((p) => p.fromArenaId === arenaId && p.toArenaId === result.toArenaId) || null
      : null;
    return { action: "transition", portal: createdPortal, created: Boolean(result?.created), contactAngle };
  }

  return { action: "rebound", portal: null, created: false, contactAngle };
}

export function resolvePortalAtPosition({ world, arenaId, x = 0, y = 0, radius = 1200, activationDistance = 78 }) {
  if (!world || !arenaId) return null;
  const portals = (world.portals || []).filter((portal) => portal.fromArenaId === arenaId);
  for (let i = 0; i < portals.length; i += 1) {
    const portal = portals[i];
    const anchor = getPortalAnchor({ positionHint: portal.positionHint, radius, index: i, total: portals.length });
    if (Math.hypot((x || 0) - anchor.x, (y || 0) - anchor.y) <= activationDistance) {
      return portal;
    }
  }
  return null;
}



export function getPortalArrivalPosition({
  world,
  fromArenaId,
  toArenaId,
  radius = 1200,
  inwardOffset = 150,
  entryPositionHint = null,
}) {
  if (!world || !toArenaId) return { x: 0, y: 0 };

  // Règle labyrinthe simple: on conserve le même côté d'entrée/sortie quand possible.
  if (entryPositionHint) {
    const anchor = getPortalAnchor({ positionHint: entryPositionHint, radius, index: 0, total: 1 });
    return {
      x: anchor.x - Math.cos(anchor.angle) * inwardOffset,
      y: anchor.y - Math.sin(anchor.angle) * inwardOffset,
    };
  }

  if (!fromArenaId) return { x: 0, y: 0 };
  const destinationPortals = (world.portals || []).filter(
    (portal) => portal.fromArenaId === toArenaId && portal.toArenaId === fromArenaId
  );
  const reversePortal = destinationPortals[0];
  if (!reversePortal) return { x: 0, y: 0 };

  const outgoingFromDestination = (world.portals || []).filter((portal) => portal.fromArenaId === toArenaId);
  const index = outgoingFromDestination.findIndex((portal) => portal.id === reversePortal.id);
  const anchor = getPortalAnchor({
    positionHint: reversePortal.positionHint,
    radius,
    index: Math.max(0, index),
    total: Math.max(1, outgoingFromDestination.length),
  });

  return {
    x: anchor.x - Math.cos(anchor.angle) * inwardOffset,
    y: anchor.y - Math.sin(anchor.angle) * inwardOffset,
  };
}




export function createMazeForArena({ arenaId, size = 9, seed = 1 }) {
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => 1));
  const center = Math.floor(size / 2);
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      grid[y][x] = 0;
    }
  }

  // Murs internes simples et déterministes.
  const bias = (Number(seed) + String(arenaId).length) % 3;
  for (let i = 2; i < size - 2; i += 2) {
    for (let j = 1 + ((i + bias) % 2); j < size - 1; j += 2) {
      grid[i][j] = 1;
    }
  }

  grid[center][center] = 0;
  return { size, center, cellSize: 260, grid };
}

export function addMazePassageForHint(maze, hint) {
  const { size, center, grid } = maze;
  if (hint === PORTAL_POSITIONS.TOP) {
    for (let y = 0; y <= center; y += 1) grid[y][center] = 0;
  } else if (hint === PORTAL_POSITIONS.BOTTOM) {
    for (let y = center; y < size; y += 1) grid[y][center] = 0;
  } else if (hint === PORTAL_POSITIONS.LEFT) {
    for (let x = 0; x <= center; x += 1) grid[center][x] = 0;
  } else if (hint === PORTAL_POSITIONS.RIGHT) {
    for (let x = center; x < size; x += 1) grid[center][x] = 0;
  }
}

export function buildMazeByArena(world) {
  const map = {};
  const nodes = world?.nodes || [];
  nodes.forEach((node, idx) => {
    const maze = createMazeForArena({ arenaId: node.id, seed: (world?.seed || 1) + idx });
    const exits = (world.portals || []).filter((p) => p.fromArenaId === node.id);
    exits.forEach((p) => addMazePassageForHint(maze, p.positionHint));
    map[node.id] = maze;
  });
  return map;
}

export function clampPointToMaze({ x = 0, y = 0, maze }) {
  if (!maze?.grid?.length) return { x, y };
  const { size, cellSize, grid } = maze;
  const half = (size * cellSize) / 2;
  const cx = Math.max(-half + 1, Math.min(half - 1, x));
  const cy = Math.max(-half + 1, Math.min(half - 1, y));
  const gx = Math.max(0, Math.min(size - 1, Math.floor((cx + half) / cellSize)));
  const gy = Math.max(0, Math.min(size - 1, Math.floor((cy + half) / cellSize)));
  if (grid[gy]?.[gx] === 0) return { x: cx, y: cy };

  let best = null;
  for (let yCell = 0; yCell < size; yCell += 1) {
    for (let xCell = 0; xCell < size; xCell += 1) {
      if (grid[yCell]?.[xCell] !== 0) continue;
      const dx = xCell - gx;
      const dy = yCell - gy;
      const score = dx * dx + dy * dy;
      if (!best || score < best.score) {
        best = { xCell, yCell, score };
      }
    }
  }

  if (!best) return { x: cx, y: cy };

  const minX = -half + best.xCell * cellSize + 1;
  const maxX = minX + cellSize - 2;
  const minY = -half + best.yCell * cellSize + 1;
  const maxY = minY + cellSize - 2;

  return {
    x: Math.max(minX, Math.min(maxX, cx)),
    y: Math.max(minY, Math.min(maxY, cy)),
  };
}

export { ARENA_TYPES, PORTAL_POSITIONS };
