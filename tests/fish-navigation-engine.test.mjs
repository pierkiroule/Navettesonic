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

test('nage libre: Soon choisit une cible organique sans suivre directement les lignes du réseau', () => {
  const world = generateLabybulle(1);
  const state = {
    ...baseState(world, {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      targetX: 0,
      targetY: 0,
      angle: 0,
      depth: 1,
      maxSpeed: 3.1,
      arenaLevel: 0,
    }),
    mode: 'echostory',
    bubbles: [],
    echostory: {
      stars: [
        { id: 'a', x: 300, y: 120, r: 34, connectedToCore: true },
        { id: 'b', x: -260, y: -180, r: 34 },
      ],
      links: [{ id: 'a__b', from: 'a', to: 'b' }],
    },
  };

  const next = tickFishEngine(state, { arenaRadius: 1200 });

  assert.ok(next.fish.freeSwimTarget);
  assert.notEqual(next.fish.targetX, state.fish.targetX);
  assert.notEqual(Math.hypot(next.fish.vx, next.fish.vy), 0);
});

test('résonance tactile: une onde conserve son expansion et perturbe légèrement la nage', () => {
  const world = generateLabybulle(1);
  const now = performance.now();
  const state = {
    ...baseState(world, {
      x: 120,
      y: 0,
      vx: 0,
      vy: 0,
      targetX: 500,
      targetY: 0,
      angle: 0,
      depth: 1,
      maxSpeed: 3.1,
      arenaLevel: 0,
      freeSwimTarget: { x: 500, y: 0, bornAt: now, kind: 'wander' },
    }),
    mode: 'echostory',
    bubbles: [],
    echostory: { stars: [] },
    resonantRipples: [{ id: 'tap-1', x: 0, y: 0, bornAt: now - 207, life: 1700, speed: 0.58, strength: 1 }],
  };

  const next = tickFishEngine(state, { arenaRadius: 1200 });

  assert.equal(next.resonantRipples.length, 1);
  assert.ok(next.resonantRipples[0].radius > 100);
  assert.ok(next.fish.vx > 0.01);
  assert.notEqual(next.fish.targetX, state.fish.freeSwimTarget.x);
});
