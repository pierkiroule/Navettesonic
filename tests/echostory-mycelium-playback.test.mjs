import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chooseNextMyceliumNode,
  computeConnectedToCore,
  findShortestPath,
  hasUnvisitedConnectedStars,
  makeGraph,
} from '../src/core/echostory/echostoryMyceliumPlayback.js';
import { ECHOSTORY_MUSIC_CORE_ID } from '../src/core/echostory/echostoryConstellation.js';

const core = ECHOSTORY_MUSIC_CORE_ID;
const nodes = (...ids) => ids.map((id) => ({ id }));
const link = (from, to) => ({ id: `${from}-${to}`, from, to });

function next(params) {
  return chooseNextMyceliumNode({ coreId: core, ...params });
}

test('cas 1: core - A - B - C lit la chaîne puis revient au core', () => {
  const graph = makeGraph(nodes('A', 'B', 'C'), [link(core, 'A'), link('A', 'B'), link('B', 'C')]);
  const connectedToCore = computeConnectedToCore(graph, core);
  const visited = {};
  const order = [core];
  let currentNodeId = core;

  for (let i = 0; i < 6; i += 1) {
    if (currentNodeId !== core) visited[currentNodeId] = 1;
    const chosen = next({ currentNodeId, graph, connectedToCore, visited });
    if (!chosen) break;
    order.push(chosen);
    currentNodeId = chosen;
  }

  assert.deepEqual(order, [core, 'A', 'B', 'C', 'B', 'A', core]);
});

test('cas 2: le lien transversal B - D sert de raccourci sans retour au core', () => {
  const graph = makeGraph(nodes('A', 'B', 'C', 'D'), [
    link(core, 'A'), link('A', 'B'), link(core, 'C'), link('C', 'D'), link('B', 'D'),
  ]);
  const connectedToCore = computeConnectedToCore(graph, core);

  assert.equal(next({ currentNodeId: 'B', graph, connectedToCore, visited: { A: 1, B: 1 } }), 'D');
  assert.deepEqual(findShortestPath(graph, 'B', (id) => id === 'C', connectedToCore), ['B', 'D', 'C']);
});

test('cas 3: une étoile libre non connectée au core est ignorée', () => {
  const graph = makeGraph(nodes('A', 'B'), [link(core, 'B')]);
  const connectedToCore = computeConnectedToCore(graph, core);

  assert.equal(connectedToCore.has('A'), false);
  assert.equal(hasUnvisitedConnectedStars(nodes('A'), connectedToCore, {}, core), false);
  assert.equal(next({ currentNodeId: core, graph, connectedToCore, visited: {} }), 'B');
});

test('cas 4: depuis B, C voisin non visité est choisi avant un voisin revisité', () => {
  const graph = makeGraph(nodes('A', 'B', 'C'), [link(core, 'A'), link('A', 'B'), link('B', 'C')]);
  const connectedToCore = computeConnectedToCore(graph, core);

  assert.equal(next({ currentNodeId: 'B', graph, connectedToCore, visited: { A: 1, B: 1 } }), 'C');
});

test('cas 5: toutes les étoiles visitées reviennent au core puis stoppent', () => {
  const graph = makeGraph(nodes('A', 'B'), [link(core, 'A'), link('A', 'B')]);
  const connectedToCore = computeConnectedToCore(graph, core);
  const visited = { A: 1, B: 1 };

  assert.equal(next({ currentNodeId: 'B', graph, connectedToCore, visited }), 'A');
  assert.equal(next({ currentNodeId: 'A', graph, connectedToCore, visited }), core);
  assert.equal(next({ currentNodeId: core, graph, connectedToCore, visited }), null);
});
