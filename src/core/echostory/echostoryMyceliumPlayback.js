import { ECHOSTORY_MUSIC_CORE_ID } from "./echostoryConstellation.js";

export const DEFAULT_MYCELIUM_CORE_ID = ECHOSTORY_MUSIC_CORE_ID;

function getNodeId(node) {
  if (typeof node === "string") return node;
  return node?.id || null;
}

export function makeGraph(nodes = [], links = []) {
  const graph = new Map();
  const addNode = (id) => {
    if (!id) return;
    if (!graph.has(id)) graph.set(id, new Set());
  };

  addNode(DEFAULT_MYCELIUM_CORE_ID);
  (Array.isArray(nodes) ? nodes : []).forEach((node) => addNode(getNodeId(node)));

  (Array.isArray(links) ? links : []).forEach((link) => {
    const from = link?.from;
    const to = link?.to;
    if (!from || !to || from === to) return;
    if (!graph.has(from) || !graph.has(to)) return;
    graph.get(from).add(to);
    graph.get(to).add(from);
  });

  return graph;
}

export const buildGraph = makeGraph;

export function computeConnectedToCore(graph, coreId = DEFAULT_MYCELIUM_CORE_ID) {
  const connected = new Set();
  if (!(graph instanceof Map) || !graph.has(coreId)) return connected;

  const queue = [coreId];
  while (queue.length) {
    const nodeId = queue.shift();
    if (!nodeId || connected.has(nodeId)) continue;
    connected.add(nodeId);
    (graph.get(nodeId) || new Set()).forEach((neighborId) => {
      if (!connected.has(neighborId)) queue.push(neighborId);
    });
  }
  return connected;
}

export function findShortestPath(graph, startId, targetPredicate, allowedSet = null) {
  if (!(graph instanceof Map) || !startId || !graph.has(startId)) return null;
  if (allowedSet && !allowedSet.has(startId)) return null;

  const visited = new Set([startId]);
  const queue = [[startId]];
  while (queue.length) {
    const path = queue.shift();
    const currentId = path[path.length - 1];
    if (path.length > 1 && targetPredicate?.(currentId)) return path;

    const neighbors = [...(graph.get(currentId) || new Set())].sort();
    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) continue;
      if (allowedSet && !allowedSet.has(neighborId)) continue;
      visited.add(neighborId);
      queue.push([...path, neighborId]);
    }
  }
  return targetPredicate?.(startId) ? [startId] : null;
}

export function hasUnvisitedConnectedStars(stars = [], connectedToCore = new Set(), visited = {}, coreId = DEFAULT_MYCELIUM_CORE_ID) {
  return (Array.isArray(stars) ? stars : []).some((star) => {
    const id = getNodeId(star);
    return id && id !== coreId && connectedToCore.has(id) && !visited?.[id];
  });
}

function hasUnvisitedReachableWithoutCore({ currentNodeId, graph, connectedToCore, visited, coreId }) {
  if (!currentNodeId || currentNodeId === coreId) return false;
  const allowedWithoutCore = new Set([...connectedToCore].filter((id) => id !== coreId));
  const path = findShortestPath(
    graph,
    currentNodeId,
    (nodeId) => nodeId !== coreId && !visited?.[nodeId],
    allowedWithoutCore
  );
  return Boolean(path && path.length > 0);
}

export function chooseNextMyceliumNode({
  currentNodeId,
  graph,
  connectedToCore,
  visited = {},
  coreId = DEFAULT_MYCELIUM_CORE_ID,
} = {}) {
  if (!(graph instanceof Map) || !currentNodeId || !graph.has(currentNodeId)) return null;
  const allowed = connectedToCore instanceof Set ? connectedToCore : new Set();
  if (!allowed.has(currentNodeId)) return null;

  const avoidCore = hasUnvisitedReachableWithoutCore({ currentNodeId, graph, connectedToCore: allowed, visited, coreId });
  const neighbors = [...(graph.get(currentNodeId) || new Set())]
    .filter((nodeId) => graph.has(nodeId) && allowed.has(nodeId))
    .filter((nodeId) => !(avoidCore && nodeId === coreId))
    .sort();

  const directUnvisitedStar = neighbors.find((nodeId) => nodeId !== coreId && !visited?.[nodeId]);
  if (directUnvisitedStar) return directUnvisitedStar;

  const unvisitedPath = findShortestPath(
    graph,
    currentNodeId,
    (nodeId) => nodeId !== coreId && !visited?.[nodeId],
    allowed
  );
  if (unvisitedPath && unvisitedPath.length > 1) return unvisitedPath[1];

  if (currentNodeId === coreId) return null;

  const corePath = findShortestPath(graph, currentNodeId, (nodeId) => nodeId === coreId, allowed);
  if (corePath && corePath.length > 1) return corePath[1];

  return null;
}
