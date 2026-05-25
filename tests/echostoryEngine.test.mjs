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
  const colors = new Set(stars.map((star) => star.color));
  assert.deepEqual(colors, new Set(["#53b9ff", "#ff9f40", "#51d37c"]));
  stars.forEach((star) => {
    assert.equal(star.collected, false);
    assert.equal(typeof star.x, "number");
    assert.equal(typeof star.y, "number");
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
