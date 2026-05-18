import test from 'node:test';
import assert from 'node:assert/strict';
import { tickFishEngine, getMembraneRadiusForLevel } from '../src/core/fishNavigationEngine.js';
import { generateLabybulle, resolveMembraneContact } from '../src/core/labybulleWorld.js';

function baseState(world, currentArenaId, fish) {
  return {
    worldGraph: world,
    currentArenaId,
    fish,
    fishTrail: [],
    bubbles: [],
    circuitAutopilot: false,
    circuitSegmentIndex: 0,
    circuitSegmentT: 0,
    traceCircuit: [],
  };
}

test('après transition d’arène, le poisson ne re-bascule pas immédiatement', () => {
  const world = generateLabybulle(7);
  resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });

  const arenaRadius = 1200;
  const outer = getMembraneRadiusForLevel(arenaRadius, 0);

  const initial = baseState(world, 'arena-1', {
    x: outer + 1,
    y: 0,
    vx: 0.05,
    vy: 0.01,
    targetX: outer + 16,
    targetY: 30,
    angle: 0,
    depth: 1,
    maxSpeed: 3.1,
    arenaLevel: 0,
    swimPhase: 0,
    mouthPull: 0,
    turnAmount: 0,
    turnVelocity: 0,
    wallHitCount: 0,
    lastWallHitAt: 0,
    hasQuill: false,
  });

  const transitioned = tickFishEngine(initial, { arenaRadius });
  assert.notEqual(transitioned.currentArenaId, 'arena-1');

  const settled = tickFishEngine({ ...initial, ...transitioned, worldGraph: world }, { arenaRadius });
  assert.equal(settled.currentArenaId, transitioned.currentArenaId);
});
