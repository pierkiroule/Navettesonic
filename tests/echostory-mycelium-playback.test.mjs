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
import { computeCuriousFishStep, tickMyceliumPlayback } from '../src/core/echostory/fishPlaybackRuntime.js';
import { useSoonStore } from '../src/store/useSoonStore.js';

function snapshotStars(stars) {
  return stars.map((star) => ({ id: star.id, x: star.x, y: star.y, vx: star.vx, vy: star.vy }));
}

function snapshotLinks(links) {
  return links.map((link) => ({ id: link.id, from: link.from, to: link.to }));
}

test('fish playback lets Soon pass without moving stars or breaking links', () => {
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
  for (let i = 0; i < 5; i += 1) pushNearbyEchostoryStars(current, 1000 + i * 16);

  assert.deepEqual(snapshotStars(stars), beforeStars);
  assert.deepEqual(snapshotLinks(current.echostory.links), snapshotLinks(links));
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


test('curious fish step follows the target with a non-rectilinear swim curve', () => {
  const step = computeCuriousFishStep({
    currentX: 48,
    currentY: 0,
    targetX: 160,
    targetY: 0,
    segmentStartX: 0,
    segmentStartY: 0,
    now: 2400,
    seed: 1.618,
    speed: 4.8,
    arrivalThreshold: 18,
  });

  assert.ok(step.x > 48, 'Soon continues progressing toward the target');
  assert.notEqual(step.y, 0, 'Soon receives a lateral wave instead of a straight segment');
  assert.equal(step.arrived, false);
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
        segmentStartX: 0,
        segmentStartY: 0,
        swimSeed: 1.618,
        visited: { [core]: 1 },
        path: [core],
        waitingUntil: 0,
      },
    },
  });
  const beforeStars = snapshotStars(stars);
  const beforeLinks = snapshotLinks(useSoonStore.getState().echostory.links);

  tickMyceliumPlayback(2000);
  tickMyceliumPlayback(2016);
  const state = useSoonStore.getState();

  assert.notEqual(state.fish.x, 0);
  assert.notEqual(state.fish.y, 0);
  assert.deepEqual(snapshotStars(state.echostory.stars), beforeStars);
  assert.deepEqual(snapshotLinks(state.echostory.links), beforeLinks);
});

test('traverser un lien met le fil en résonance et pause Soon', () => {
  const stars = [
    { id: 'A', x: 0, y: -80, vx: 0, vy: 0, r: 34, text: 'A' },
    { id: 'B', x: 0, y: 80, vx: 0, vy: 0, r: 34, text: 'B' },
  ];
  const links = [link('A', 'B')];
  useSoonStore.setState({
    resonantRipples: [],
    fish: { x: -2, y: 0, vx: 0, vy: 0, angle: 0, visible: true, arenaRadius: 1200 },
    echostory: {
      stars,
      links: links.map((item) => ({ ...item })),
      constellationLinks: links.map((item) => ({ ...item })),
      playbackCurrentLinkId: null,
      echostoryPlayback: {
        active: true,
        visible: true,
        roamWaypoint: { x: 500, y: 0, bornAt: 0 },
        segmentStartX: -2,
        segmentStartY: 0,
        swimSeed: 0,
        linkCooldowns: {},
        resumeStartedAt: 0,
        waitingUntil: 0,
      },
    },
  });

  tickMyceliumPlayback(3000);
  const state = useSoonStore.getState();

  assert.equal(state.echostory.playbackCurrentLinkId, 'A-B');
  assert.equal(state.echostory.echostoryPlayback.linkPlaybackActive, true);
  assert.equal(state.echostory.echostoryPlayback.activeLinkId, 'A-B');
  assert.equal(state.fish.vx, 0);
  assert.equal(state.fish.vy, 0);
});

test('lecture mycélienne: Soon erre librement avant de lire une étoile sans suivre la ligne visible', () => {
  const stars = [{ id: 'A', x: 420, y: 0, vx: 0, vy: 0, r: 34, text: 'A' }];
  const links = [link(core, 'A')];
  useSoonStore.setState({
    resonantRipples: [],
    fish: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, visible: true, arenaRadius: 1200 },
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
        segmentStartX: 0,
        segmentStartY: 0,
        swimSeed: 1.618,
        visited: { [core]: 1 },
        path: [core],
        waitingUntil: 0,
        wanderUntil: 5000,
      },
    },
  });

  tickMyceliumPlayback(2000);
  const state = useSoonStore.getState();

  assert.equal(state.echostory.echostoryPlayback.playbackTargetNodeId, null);
  assert.equal(state.echostory.playbackCurrentLinkId, null);
  assert.ok(state.echostory.echostoryPlayback.roamWaypoint, 'un waypoint libre est créé');
  assert.notEqual(state.fish.targetX, stars[0].x, 'la cible visuelle de nage n’est pas directement l’étoile');
});

test('lecture mycélienne: les taps résonants perturbent Soon et restent visibles', () => {
  const stars = [{ id: 'A', x: 420, y: 0, vx: 0, vy: 0, r: 34, text: 'A' }];
  const links = [link(core, 'A')];
  useSoonStore.setState({
    resonantRipples: [{ id: 'tap-playback', x: 0, y: 0, bornAt: 1793, life: 1700, speed: 0.58, strength: 1 }],
    fish: { x: 120, y: 0, vx: 0, vy: 0, angle: 0, visible: true, arenaRadius: 1200 },
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
        segmentStartX: 120,
        segmentStartY: 0,
        swimSeed: 1.618,
        visited: { [core]: 1 },
        path: [core],
        waitingUntil: 0,
        roamWaypoint: { x: 500, y: 0, bornAt: 1800 },
        wanderUntil: 5000,
      },
    },
  });

  tickMyceliumPlayback(2000);
  const state = useSoonStore.getState();

  assert.equal(state.resonantRipples.length, 1);
  assert.ok(state.resonantRipples[0].radius > 100);
  assert.notEqual(state.fish.targetX, 500, 'la résonance décale la nage prévue');
  assert.ok(state.fish.vx > 0.01);
});
