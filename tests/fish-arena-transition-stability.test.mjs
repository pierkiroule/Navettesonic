import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLabybulle } from '../src/core/labybulleWorld.js';
import { tickFishEngine } from '../src/core/fishNavigationEngine.js';
import { getMembraneRadiusForLevel } from '../src/core/fishNavigationEngine.js';

function baseState(worldGraph) {
  const arenaRadius = 1200;
  const outer = getMembraneRadiusForLevel(arenaRadius, 0);
  return {
    worldGraph,
    currentArenaId: 'arena-1',
    fish: { x: outer + 1, y: 0, vx: 0.08, vy: 0.01, targetX: outer + 40, targetY: 60, angle: 0, depth: 1, maxSpeed: 3.1, arenaLevel: 0 },
  };
}

test('sans passages, le poisson reste dans la même arène', () => {
  const world = generateLabybulle(1);
  const next = tickFishEngine(baseState(world), { arenaRadius: 1200 });
  assert.equal(next.currentArenaId, 'arena-1');
});
