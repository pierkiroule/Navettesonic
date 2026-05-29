import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceWave,
  canAdvanceWave,
  collectStar,
  createWaveStars,
  getCurrentWaveKey,
  resetEchostoryState,
} from "../src/core/echostory/echostoryEngine.js";

test("echostory wave mapping and star generation", () => {
  assert.equal(getCurrentWaveKey(0), "immersion");
  assert.equal(getCurrentWaveKey(1), "bascule");
  assert.equal(getCurrentWaveKey(2), "ouverture");

  const stars = createWaveStars(0, 15);
  assert.equal(stars.length, 15);
  const colorCounts = stars.reduce((counts, star) => {
    counts.set(star.color, (counts.get(star.color) || 0) + 1);
    return counts;
  }, new Map());
  assert.deepEqual(colorCounts, new Map([["#53b9ff", 5], ["#ff9f40", 5], ["#51d37c", 5]]));
  stars.forEach((star) => {
    assert.equal(star.collected, false);
    assert.equal(typeof star.x, "number");
    assert.equal(typeof star.y, "number");
    assert.equal(star.attachedToContour, false);
    assert.ok(star.r >= 34);
    assert.ok(star.r <= 48);
    assert.equal(typeof star.contourAngle, "number");
    assert.ok(Math.hypot(star.x, star.y) >= 220);
    assert.ok(Math.hypot(star.x, star.y) <= 780);
  });
});

test("collect and advance wave", () => {
  let state = resetEchostoryState();
  assert.equal(state.stars.length, 15);
  assert.equal(canAdvanceWave(state), false);

  state.stars.forEach((star) => {
    state = collectStar(state, star.id);
  });

  assert.equal(state.collectedStars.length, 15);
  assert.equal(canAdvanceWave(state), true);

  const advanced = advanceWave(state);
  assert.equal(advanced.waveIndex, 0);
  assert.equal(advanced.phase, "story");
  assert.equal(advanced.stars.length, 0);
});
