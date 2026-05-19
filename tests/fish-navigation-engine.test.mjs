import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLabybulle } from '../src/core/labybulleWorld.js';
import { tickFishEngine } from '../src/core/fishNavigationEngine.js';
import { getMembraneRadiusForLevel } from '../src/core/fishNavigationEngine.js';

function baseState(worldGraph, fish) {
  return { worldGraph, currentArenaId: 'arena-1', fish };
}

test('navigation bord: pas de transition vers une autre arène', () => {
  const world = generateLabybulle(1);
  const arenaRadius = 1200;
  const outer = getMembraneRadiusForLevel(arenaRadius, 0);
  const state = baseState(world, { x: outer + 1, y: 0, vx: 0.12, vy: 0.02, targetX: outer + 24, targetY: 40, angle: 0, depth: 1, maxSpeed: 3.1, arenaLevel: 0 });
  const next = tickFishEngine(state, { arenaRadius });
  assert.equal(next.currentArenaId, 'arena-1');
});
