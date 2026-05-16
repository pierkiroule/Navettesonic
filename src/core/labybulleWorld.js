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

function createSeededRandom(seed = 1) {
  let state = (Number(seed) || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function makeArenaNode({ id, type, parentId = null, childrenIds = [] }) {
  return { id, type, parentId, childrenIds: [...childrenIds] };
}

function pushBidirectionalPortal(portals, fromArenaId, toArenaId, forwardHint, backwardHint) {
  portals.push({
    id: `${fromArenaId}__to__${toArenaId}`,
    fromArenaId,
    toArenaId,
    positionHint: forwardHint,
    bidirectional: false,
  });

  portals.push({
    id: `${toArenaId}__to__${fromArenaId}`,
    fromArenaId: toArenaId,
    toArenaId: fromArenaId,
    positionHint: backwardHint,
    bidirectional: false,
  });
}

export function generateLabybulle(seed = 1) {
  const rand = createSeededRandom(seed);
  const nodes = [];
  const portals = [];

  const gigaId = "giga-1";
  const megaIds = ["mega-1", "mega-2", "mega-3"];

  const megaOrder = megaIds
    .map((id) => ({ id, sort: rand() }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.id);

  const gigaNode = makeArenaNode({ id: gigaId, type: ARENA_TYPES.GIGA, childrenIds: megaOrder });
  nodes.push(gigaNode);

  megaOrder.forEach((megaId, megaIndex) => {
    const childArenaIds = [1, 2, 3].map((n) => `arena-${megaId.split("-")[1]}-${n}`);
    const megaNode = makeArenaNode({
      id: megaId,
      type: ARENA_TYPES.MEGA,
      parentId: gigaId,
      childrenIds: childArenaIds,
    });
    nodes.push(megaNode);

    // Liaison MEGA <-> GIGA: un passage dans chaque sens.
    pushBidirectionalPortal(
      portals,
      megaId,
      gigaId,
      PORTAL_POSITIONS.TOP,
      [PORTAL_POSITIONS.BOTTOM, PORTAL_POSITIONS.LEFT, PORTAL_POSITIONS.RIGHT][megaIndex]
    );

    childArenaIds.forEach((arenaId, childIndex) => {
      nodes.push(makeArenaNode({ id: arenaId, type: ARENA_TYPES.ARENA, parentId: megaId }));

      pushBidirectionalPortal(
        portals,
        arenaId,
        megaId,
        [PORTAL_POSITIONS.TOP, PORTAL_POSITIONS.RIGHT, PORTAL_POSITIONS.LEFT][childIndex],
        [PORTAL_POSITIONS.BOTTOM, PORTAL_POSITIONS.LEFT, PORTAL_POSITIONS.RIGHT][childIndex]
      );
    });
  });

  return {
    seed,
    nodes,
    portals,
    startArenaId: "arena-1-1",
    startPosition: { x: 0, y: 0, hint: "CENTER" },
  };
}

export function validateWorldGraph(world) {
  const errors = [];
  if (!world || !Array.isArray(world.nodes) || !Array.isArray(world.portals)) {
    return ["world invalide: nodes/portals manquants"]; 
  }

  const nodeById = new Map(world.nodes.map((node) => [node.id, node]));
  const gigaNodes = world.nodes.filter((node) => node.type === ARENA_TYPES.GIGA);
  const megaNodes = world.nodes.filter((node) => node.type === ARENA_TYPES.MEGA);
  const arenaNodes = world.nodes.filter((node) => node.type === ARENA_TYPES.ARENA);

  if (gigaNodes.length !== 1) errors.push(`attendu 1 GIGA, reçu ${gigaNodes.length}`);
  if (megaNodes.length !== 3) errors.push(`attendu 3 MEGA, reçu ${megaNodes.length}`);
  if (arenaNodes.length !== 9) errors.push(`attendu 9 ARENA, reçu ${arenaNodes.length}`);

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
  });

  gigaNodes.forEach((giga) => {
    const outbound = world.portals.filter((portal) => portal.fromArenaId === giga.id);
    outbound.forEach((portal) => {
      const target = nodeById.get(portal.toArenaId);
      if (!target || target.type !== ARENA_TYPES.MEGA) {
        errors.push(`sortie cosmos interdite depuis ${giga.id} via ${portal.id}`);
      }
    });
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

export { ARENA_TYPES, PORTAL_POSITIONS };
