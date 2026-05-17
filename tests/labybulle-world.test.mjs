import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMazeByArena, clampPointToMaze, generateLabybulle, validateWorldGraph, resolvePortalAtPosition, getPortalArrivalPosition, getArenaRadiusForNode, getPortalAnchor, POISSON_PLUME_WIDTH, PORTAL_WIDTH_MULTIPLIER } from '../src/core/labybulleWorld.js';

test('structure labybulle concentrique: 1 GIGA, 1 MEGA, 1 ARENA', () => {
  const world = generateLabybulle(42);
  const giga = world.nodes.filter((node) => node.type === 'GIGA');
  const mega = world.nodes.filter((node) => node.type === 'MEGA');
  const arena = world.nodes.filter((node) => node.type === 'ARENA');

  assert.equal(giga.length, 1);
  assert.equal(mega.length, 1);
  assert.equal(arena.length, 1);
});

test('tous les nœuds atteignables depuis start', () => {
  const world = generateLabybulle(7);
  const errors = validateWorldGraph(world);
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('aucun portail de GIGA vers extérieur cosmos', () => {
  const world = generateLabybulle(7);
  const giga = world.nodes.find((node) => node.type === 'GIGA');
  const nodeById = new Map(world.nodes.map((node) => [node.id, node]));
  const outbound = world.portals.filter((portal) => portal.fromArenaId === giga.id);

  assert.ok(outbound.length > 0);
  outbound.forEach((portal) => {
    const target = nodeById.get(portal.toArenaId);
    assert.equal(target?.type, 'MEGA');
  });
});

test('déterminisme: même seed => même structure', () => {
  const a = generateLabybulle(1337);
  const b = generateLabybulle(1337);
  assert.deepEqual(a, b);
});


test('détection de portail: proche du trou => transition possible', () => {
  const world = generateLabybulle(1);
  const outgoing = world.portals.filter((p) => p.fromArenaId === 'arena-1');
  const anchor = getPortalAnchor({ positionHint: outgoing[0].positionHint, radius: 1200, index: 0, total: outgoing.length });
  const portal = resolvePortalAtPosition({
    world,
    arenaId: 'arena-1',
    x: anchor.x,
    y: anchor.y,
    radius: 1200,
  });
  assert.ok(portal);
  assert.equal(portal.fromArenaId, 'arena-1');
  assert.equal(portal.toArenaId, 'mega-1');
});

test('règles passages: largeur = 2x poisson-plume et bidirectionnels', () => {
  const world = generateLabybulle(9);
  const expected = POISSON_PLUME_WIDTH * PORTAL_WIDTH_MULTIPLIER;
  world.portals.forEach((portal) => {
    assert.equal(portal.passageWidth, expected);
    assert.equal(portal.bidirectional, true);
  });
});

test('règles imbriquées: centres asymétriques pour les arènes internes', () => {
  const world = generateLabybulle(9);
  const mega = world.nodes.find((n) => n.id === 'mega-1');
  const arena = world.nodes.find((n) => n.id === 'arena-1');
  assert.ok((mega.centerOffset.x !== 0) || (mega.centerOffset.y !== 0));
  assert.ok((arena.centerOffset.x !== 0) || (arena.centerOffset.y !== 0));
});


test("arrivée portail: transition ARENA -> MEGA n'arrive pas au centre", () => {
  const world = generateLabybulle(1);
  const arrival = getPortalArrivalPosition({
    world,
    fromArenaId: 'arena-1',
    toArenaId: 'mega-1',
    radius: 1200,
  });

  assert.notDeepEqual(arrival, { x: 0, y: 0 });
  assert.ok(Math.hypot(arrival.x, arrival.y) > 200);
});


test('rayon imbriqué: MEGA et GIGA sont plus vastes que ARENA', () => {
  const world = generateLabybulle(3);
  const arenaRadius = getArenaRadiusForNode({ world, arenaId: 'arena-1', baseRadius: 1000 });
  const megaRadius = getArenaRadiusForNode({ world, arenaId: 'mega-1', baseRadius: 1000 });
  const gigaRadius = getArenaRadiusForNode({ world, arenaId: 'giga-1', baseRadius: 1000 });

  assert.equal(arenaRadius, 1000);
  assert.ok(megaRadius > arenaRadius);
  assert.ok(gigaRadius > megaRadius);
});


test('arrivée conserve le côté du trou (labyrinthe simple)', () => {
  const world = generateLabybulle(1);
  const arrivalTop = getPortalArrivalPosition({
    world,
    fromArenaId: 'arena-1',
    toArenaId: 'mega-1',
    radius: 1200,
    entryPositionHint: 'TOP',
  });

  assert.ok(arrivalTop.y < -700);
});


test('maze: le centre et le couloir haut sont praticables', () => {
  const world = generateLabybulle(1);
  const mazes = buildMazeByArena(world);
  const maze = mazes['arena-1'];
  const center = clampPointToMaze({ x: 0, y: 0, maze });
  const top = clampPointToMaze({ x: 0, y: -1000, maze });
  assert.deepEqual(center, { x: 0, y: 0 });
  assert.ok(top.y < -500);
});
