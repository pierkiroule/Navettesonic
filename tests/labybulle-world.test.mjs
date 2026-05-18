import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMazeByArena, clampPointToMaze, generateLabybulle, validateWorldGraph, resolvePortalAtPosition, getPortalArrivalPosition, getArenaRadiusForNode, getPortalAnchor, getPortalOpeningHalfSpan, POISSON_PLUME_WIDTH, PORTAL_WIDTH_MULTIPLIER, resolveMembraneContact } from '../src/core/labybulleWorld.js';

test("structure initiale: réseau d'arènes contiguës autour de la room de départ", () => {
  const world = generateLabybulle(42);
  assert.equal(world.nodes.length, 5);
  assert.equal(world.nodes[0].id, 'arena-1');
  assert.equal(world.nodes[0].type, 'ARENA');
  assert.equal(world.portals.length, 8);
});

test('premier contact bord aligné avec une sortie initiale => transition sans création', () => {
  const world = generateLabybulle(7);
  const beforeNodes = world.nodes.length;
  const beforePortals = world.portals.length;

  const result = resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });

  assert.equal(result.action, 'transition');
  assert.equal(result.created, false);
  assert.equal(world.nodes.length, beforeNodes);
  assert.equal(world.portals.length, beforePortals);

  const targetRoomId = result.portal?.toArenaId;
  assert.ok(targetRoomId);
  const forward = world.portals.find((p) => p.fromArenaId === 'arena-1' && p.toArenaId === targetRoomId);
  const backward = world.portals.find((p) => p.fromArenaId === targetRoomId && p.toArenaId === 'arena-1');
  assert.ok(forward);
  assert.ok(backward);
});

test('deuxième contact sur une autre sortie initiale => transition sans création', () => {
  const world = generateLabybulle(7);
  resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });
  const beforeNodes = world.nodes.length;
  const beforePortals = world.portals.length;

  const result = resolveMembraneContact({ world, arenaId: 'arena-1', x: -1200, y: 0, radius: 1200 });

  assert.equal(result.action, 'transition');
  assert.equal(result.created, false);
  assert.equal(world.nodes.length, beforeNodes);
  assert.equal(world.portals.length, beforePortals);
});

test('contact aligné sur sortie existante => transition sans création', () => {
  const world = generateLabybulle(1);
  const first = resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });
  const createdRoomId = first.portal.toArenaId;

  const second = resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });

  assert.equal(second.action, 'transition');
  assert.equal(second.created, false);
  assert.equal(second.portal?.toArenaId, createdRoomId);
  assert.equal(world.nodes.length, 5);
  assert.equal(world.portals.length, 8);
});


test('contact bord depuis une arène fille crée une nouvelle voisine (pas retour parent forcé)', () => {
  const world = generateLabybulle(11);
  const first = resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });
  const childId = first.portal.toArenaId;

  const beforeNodes = world.nodes.length;
  const beforePortals = world.portals.length;

  const second = resolveMembraneContact({ world, arenaId: childId, x: 0, y: -1200, radius: 1200 });

  assert.equal(second.action, 'transition');
  assert.equal(second.created, true);
  assert.ok(second.portal);
  assert.notEqual(second.portal.toArenaId, 'arena-1');
  assert.equal(world.nodes.length, beforeNodes + 1);
  assert.equal(world.portals.length, beforePortals + 2);
});

test('room fille contient sortie retour opposée', () => {
  const world = generateLabybulle(3);
  const first = resolveMembraneContact({ world, arenaId: 'arena-1', x: 0, y: -1200, radius: 1200 });
  const childId = first.portal.toArenaId;

  const forward = world.portals.find((p) => p.fromArenaId === 'arena-1' && p.toArenaId === childId);
  const backward = world.portals.find((p) => p.fromArenaId === childId && p.toArenaId === 'arena-1');

  assert.equal(forward.positionHint, 'TOP');
  assert.equal(backward.positionHint, 'BOTTOM');
  assert.equal(backward.bidirectional, true);
});

test('tous les nœuds atteignables depuis start après génération d’une sortie', () => {
  const world = generateLabybulle(7);
  resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });
  const errors = validateWorldGraph(world);
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('déterminisme: même seed + même premier contact => même structure et même placement', () => {
  const a = generateLabybulle(1337);
  const b = generateLabybulle(1337);
  resolveMembraneContact({ world: a, arenaId: 'arena-1', x: 800, y: -800, radius: 1200 });
  resolveMembraneContact({ world: b, arenaId: 'arena-1', x: 800, y: -800, radius: 1200 });
  assert.deepEqual(a, b);
});

test('détection de portail: proche du trou => transition possible', () => {
  const world = generateLabybulle(1);
  resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });
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
});

test('règles passages: largeur = 2x poisson-plume et bidirectionnels', () => {
  const world = generateLabybulle(9);
  resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });
  const expected = POISSON_PLUME_WIDTH * PORTAL_WIDTH_MULTIPLIER;
  world.portals.forEach((portal) => {
    assert.equal(portal.passageWidth, expected);
    assert.equal(portal.bidirectional, true);
  });
});

test('ouverture contour: largeur géométrique alignée avec la largeur de passage', () => {
  const expected = POISSON_PLUME_WIDTH * PORTAL_WIDTH_MULTIPLIER;
  const radius = 1200;
  const halfSpan = getPortalOpeningHalfSpan({ radius, passageWidth: expected });
  const openingWidth = 2 * radius * halfSpan;
  assert.ok(Math.abs(openingWidth - expected) < 0.01);
});

test('rayon imbriqué: un enfant de type ARENA garde le rayon de base', () => {
  const world = generateLabybulle(3);
  const first = resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });
  const childId = first.portal.toArenaId;
  const arenaRadius = getArenaRadiusForNode({ world, arenaId: 'arena-1', baseRadius: 1000 });
  const childRadius = getArenaRadiusForNode({ world, arenaId: childId, baseRadius: 1000 });

  assert.equal(arenaRadius, 1000);
  assert.equal(childRadius, 1000);
});

test('arrivée utilise le portail inverse de destination (pas de wrap implicite)', () => {
  const world = generateLabybulle(1);
  resolveMembraneContact({ world, arenaId: 'arena-1', x: 0, y: -1200, radius: 1200 }); // sortie TOP
  const forward = world.portals.find((p) => p.fromArenaId === 'arena-1' && p.positionHint === 'TOP');
  const childId = forward.toArenaId;
  const reverse = world.portals.find((p) => p.fromArenaId === childId && p.toArenaId === 'arena-1');
  const arrival = getPortalArrivalPosition({
    world,
    fromArenaId: 'arena-1',
    toArenaId: childId,
    radius: 1200,
    entryPositionHint: 'TOP', // doit être ignoré au profit du portail inverse
  });

  assert.equal(reverse.positionHint, 'BOTTOM');
  assert.ok(arrival.y > 700);
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
