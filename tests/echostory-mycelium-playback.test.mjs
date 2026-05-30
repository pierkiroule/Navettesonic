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

import { pushNearbyEchostoryStars } from '../src/components/soon/useSoonCanvasLoop.js';
import { tickMyceliumPlayback } from '../src/core/echostory/fishPlaybackRuntime.js';
import { useSoonStore } from '../src/store/useSoonStore.js';

function snapshotStars(stars) {
  return stars.map((star) => ({ id: star.id, x: star.x, y: star.y, vx: star.vx, vy: star.vy }));
}

function snapshotLinks(links) {
  return links.map((link) => ({ id: link.id, from: link.from, to: link.to }));
}

test('fish playback freezes star positions and links across contact/physics ticks', () => {
  const stars = [
    { id: 'A', x: 120, y: 0, vx: 18, vy: -7, r: 34 },
    { id: 'B', x: 260, y: 0, vx: -12, vy: 5, r: 34 },
  ];
  const links = [link(core, 'A'), link('A', 'B')];
  const current = {
    mode: 'echostory',
    arenaRadius: 1200,
    fish: { x: 120, y: 0 },
    echostory: {
      stars,
      links: links.map((item) => ({ ...item })),
      constellationLinks: links.map((item) => ({ ...item })),
      echostoryPlayback: { active: true },
    },
  };
  const beforeStars = snapshotStars(stars);
  const beforeLinks = snapshotLinks(current.echostory.links);

  for (let i = 0; i < 5; i += 1) pushNearbyEchostoryStars(current, 1000 + i * 16);

  assert.deepEqual(snapshotStars(stars), beforeStars);
  assert.deepEqual(snapshotLinks(current.echostory.links), beforeLinks);
});

test('clicking fish playback action makes Soon visible at the core', () => {
  useSoonStore.setState({
    fish: { x: 99, y: -40, vx: 3, vy: 2, visible: false },
    echostory: { stars: [], links: [], echostoryPlayback: { active: false, visible: false } },
  });

  useSoonStore.getState().startMyceliumPlayback();
  const state = useSoonStore.getState();

  assert.equal(state.fish.visible, true);
  assert.equal(state.fish.x, 0);
  assert.equal(state.fish.y, 0);
  assert.equal(state.echostory.echostoryPlayback.active, true);
  assert.equal(state.echostory.echostoryPlayback.visible, true);
});

test('during playback Soon moves while stars and links stay fixed', () => {
  const stars = [{ id: 'A', x: 96, y: 0, vx: 13, vy: -9, r: 34, text: 'A' }];
  const links = [link(core, 'A')];
  useSoonStore.setState({
    fish: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, visible: true },
    echostory: {
      stars,
      links: links.map((item) => ({ ...item })),
      constellationLinks: links.map((item) => ({ ...item })),
      activeLine: null,
      playbackTargetNodeId: 'A',
      playbackCurrentLinkId: link(core, 'A').id,
      echostoryPlayback: {
        active: true,
        visible: true,
        currentNodeId: core,
        playbackTargetNodeId: 'A',
        targetNodeId: 'A',
        visited: { [core]: 1 },
        path: [core],
        waitingUntil: 0,
      },
    },
  });
  const beforeStars = snapshotStars(stars);
  const beforeLinks = snapshotLinks(useSoonStore.getState().echostory.links);

  tickMyceliumPlayback(2000);
  const state = useSoonStore.getState();

  assert.notEqual(state.fish.x, 0);
  assert.equal(state.fish.y, 0);
  assert.deepEqual(snapshotStars(state.echostory.stars), beforeStars);
  assert.deepEqual(snapshotLinks(state.echostory.links), beforeLinks);
});

test('on arrival Soon chooses a new target without moving the reached star', () => {
  const stars = [
    { id: 'A', x: 10, y: 0, vx: 4, vy: 5, r: 34, text: 'A' },
    { id: 'B', x: 80, y: 0, vx: -3, vy: 2, r: 34, text: 'B' },
  ];
  const links = [link(core, 'A'), link('A', 'B')];
  useSoonStore.setState({
    fish: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, visible: true },
    echostory: {
      stars,
      links: links.map((item) => ({ ...item })),
      constellationLinks: links.map((item) => ({ ...item })),
      playbackTargetNodeId: 'A',
      playbackCurrentLinkId: link(core, 'A').id,
      echostoryPlayback: {
        active: true,
        visible: true,
        currentNodeId: core,
        playbackTargetNodeId: 'A',
        targetNodeId: 'A',
        visited: { [core]: 1 },
        path: [core],
        waitingUntil: 0,
      },
    },
  });
  const reachedStarBefore = { ...stars[0] };

  tickMyceliumPlayback(3000);
  tickMyceliumPlayback(4000);
  useSoonStore.getState().echostory.stars[0].previewPlaying = false;
  tickMyceliumPlayback(5000);
  const state = useSoonStore.getState();

  assert.equal(state.echostory.echostoryPlayback.currentNodeId, 'A');
  assert.equal(state.echostory.echostoryPlayback.playbackTargetNodeId, 'B');
  assert.deepEqual(
    { x: state.echostory.stars[0].x, y: state.echostory.stars[0].y, vx: state.echostory.stars[0].vx, vy: state.echostory.stars[0].vy },
    { x: reachedStarBefore.x, y: reachedStarBefore.y, vx: reachedStarBefore.vx, vy: reachedStarBefore.vy }
  );
});
