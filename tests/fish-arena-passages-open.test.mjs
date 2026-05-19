import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLabybulle, resolveMembraneContact } from '../src/core/labybulleWorld.js';

test('aucun passage ouvert: contact bord reste en rebond', () => {
  const world = generateLabybulle(1);
  const result = resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });
  assert.equal(result.action, 'rebound');
});
