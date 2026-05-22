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

  const stars = createWaveStars(0, 5);
  assert.equal(stars.length, 5);
  stars.forEach((star) => {
    assert.equal(star.wave, "immersion");
    assert.equal(star.collected, false);
    assert.equal(typeof star.x, "number");
    assert.equal(typeof star.y, "number");
  });
});

test("collect and advance wave", () => {
  let state = resetEchostoryState();
  assert.equal(state.stars.length, 5);
  assert.equal(canAdvanceWave(state), false);

  state.stars.forEach((star) => {
    state = collectStar(state, star.id);
  });

  assert.equal(state.collectedStars.length, 5);
  assert.equal(canAdvanceWave(state), true);

  const advanced = advanceWave(state);
  assert.equal(advanced.waveIndex, 1);
  assert.equal(advanced.phase, "collect");
  assert.equal(advanced.stars.length, 5);
});
