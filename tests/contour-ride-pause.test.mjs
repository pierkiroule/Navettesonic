import test from "node:test";
import assert from "node:assert/strict";
import { updateContourRide } from "../src/components/soon/useSoonCanvasLoop.js";

function createPausedRideState() {
  return {
    arenaRadius: 1200,
    fish: {
      x: 0,
      y: -1200,
      targetX: 0,
      targetY: -1200,
      vx: 0,
      vy: 0,
      angle: 0,
      depth: 1,
      arenaLevel: 0,
    },
    contourRide: {
      active: true,
      startedAt: 0,
      baseAngle: -Math.PI / 2,
      durationMs: 10000,
      pausedAt: 1000,
      pausedDurationMs: 0,
      pausedStarId: "star-1",
    },
    echostory: {
      stars: [
        {
          id: "star-1",
          x: 0,
          y: -1200,
          r: 18,
          previewPlaying: true,
          previewPlayed: false,
        },
      ],
    },
  };
}

test("contour ride stays paused while a touched star is diffusing", () => {
  const state = createPausedRideState();

  updateContourRide(state, 1200, 5000);

  assert.equal(state.fish.x, 0);
  assert.equal(state.fish.y, -1200);
  assert.equal(state.fish.targetX, 0);
  assert.equal(state.fish.targetY, -1200);
  assert.equal(state.fish.isOnContourRide, true);
  assert.equal(state.contourRide.pausedAt, 1000);
  assert.equal(state.contourRide.pausedDurationMs, 0);
});

test("contour ride duration excludes completed star diffusion pauses", () => {
  const state = createPausedRideState();
  state.echostory.stars[0].previewPlaying = false;
  state.echostory.stars[0].previewPlayed = true;

  updateContourRide(state, 1200, 8000);

  assert.equal(state.contourRide.pausedAt, 0);
  assert.equal(state.contourRide.pausedDurationMs, 7000);
  assert.ok(state.contourRide.active);

  const expectedAngle = -Math.PI / 2 + 0.1 * Math.PI * 2;
  const actualAngle = Math.atan2(state.fish.y, state.fish.x);
  assert.ok(Math.abs(actualAngle - expectedAngle) < 0.0001);
});
