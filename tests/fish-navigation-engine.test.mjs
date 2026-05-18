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

test('transition externe possible même avec vitesse radiale quasi nulle après clamp bord', () => {
  const world = generateLabybulle(5);
  resolveMembraneContact({ world, arenaId: 'arena-1', x: 1200, y: 0, radius: 1200 });

  const arenaRadius = 1200;
  const outer = getMembraneRadiusForLevel(arenaRadius, 0);

  const state = baseState(world, 'arena-1', {
    x: outer + 2,
    y: 0,
    vx: 0,
    vy: 0.15,
    targetX: outer + 2,
    targetY: 500,
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

  const next = tickFishEngine(state, { arenaRadius });
  assert.notEqual(next.currentArenaId, 'arena-1');
});

test("transition d'arène sans téléportation profonde: position d'arrivée reste proche du portail", () => {
  const world = generateLabybulle(8);
  resolveMembraneContact({ world, arenaId: "arena-1", x: 1200, y: 0, radius: 1200 });

  const arenaRadius = 1200;
  const outer = getMembraneRadiusForLevel(arenaRadius, 0);
  const state = baseState(world, "arena-1", {
    x: outer + 1,
    y: 0,
    vx: 0.1,
    vy: 0.01,
    targetX: outer + 12,
    targetY: 20,
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

  const next = tickFishEngine(state, { arenaRadius });
  assert.notEqual(next.currentArenaId, "arena-1");
  const arrivalRadius = Math.hypot(next.fish.x, next.fish.y);
  assert.ok(arrivalRadius > outer - 150, `arrival too deep inside arena: r=${arrivalRadius}`);
});

test("transition d'arène: n'applique pas de poussée de bulles sur la frame de passage", () => {
  const world = generateLabybulle(13);
  resolveMembraneContact({ world, arenaId: "arena-1", x: 1200, y: 0, radius: 1200 });
  const arenaRadius = 1200;
  const outer = getMembraneRadiusForLevel(arenaRadius, 0);
  const initialBubbles = [{ id: "drill-bubble", x: 0, y: 0, r: 72, depth: 1, sampleId: "drill" }];
  const state = {
    ...baseState(world, "arena-1", {
      x: outer + 1, y: 0, vx: 0.12, vy: 0.02, targetX: outer + 20, targetY: 30,
      angle: 0, depth: 1, maxSpeed: 3.1, arenaLevel: 0, swimPhase: 0, mouthPull: 0, turnAmount: 0, turnVelocity: 0, wallHitCount: 0, lastWallHitAt: 0, hasQuill: false,
    }),
    bubbles: initialBubbles.map((b) => ({ ...b })),
  };
  const next = tickFishEngine(state, { arenaRadius });
  assert.notEqual(next.currentArenaId, "arena-1");
  assert.deepEqual(next.bubbles, initialBubbles);
});
