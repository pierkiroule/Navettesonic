import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMazeByArena, generateLabybulle, resolveMembraneContact, validateWorldGraph } from '../src/core/labybulleWorld.js';

test('structure simple: une seule arène sans passages', () => {
  const world = generateLabybulle(42);
  assert.equal(world.startArenaId, 'arena-1');
  assert.equal(world.nodes.length, 1);
  assert.equal(world.portals.length, 0);
  assert.deepEqual(validateWorldGraph(world), []);
});

test('contact membrane: rebond systématique, pas de transition', () => {
  const world = generateLabybulle(1);
  const result = resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });
  assert.equal(result.action, 'rebound');
  assert.equal(result.portal, null);
});

test('contact membrane + creuse: ouvre une galerie vers une nouvelle arène', () => {
  const world = generateLabybulle(1);
  const result = resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200, allowDig: true });
  assert.equal(result.action, 'transition');
  assert.equal(result.portal?.fromArenaId, 'arena-1');
  assert.ok(result.portal?.toArenaId?.startsWith('arena-'));
  assert.equal(result.world.nodes.length, 2);
  assert.equal(result.world.portals.length, 2);
  assert.deepEqual(validateWorldGraph(result.world), []);
});

test('maze: pas d ouverture liée à des passages', () => {
  const world = generateLabybulle(1);
  const mazes = buildMazeByArena(world);
  assert.ok(mazes['arena-1']);
});
