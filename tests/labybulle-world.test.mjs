import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLabybulle, validateWorldGraph, resolvePortalAtPosition } from '../src/core/labybulleWorld.js';

test('structure labybulle correcte: 1 GIGA, 3 MEGA, 9 ARENA', () => {
  const world = generateLabybulle(42);
  const giga = world.nodes.filter((node) => node.type === 'GIGA');
  const mega = world.nodes.filter((node) => node.type === 'MEGA');
  const arena = world.nodes.filter((node) => node.type === 'ARENA');

  assert.equal(giga.length, 1);
  assert.equal(mega.length, 3);
  assert.equal(arena.length, 9);
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
  const portal = resolvePortalAtPosition({
    world,
    arenaId: 'arena-1-1',
    x: 0,
    y: -1170,
    radius: 1200,
  });
  assert.ok(portal);
  assert.equal(portal.fromArenaId, 'arena-1-1');
  assert.equal(portal.toArenaId, 'mega-1');
});
