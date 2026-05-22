import test from "node:test";
import assert from "node:assert/strict";
import { buildEchostoryText, estimatePathDuration, pickStarsForPath } from "../src/core/echostory/echostoryBuilder.js";

test("estimatePathDuration clamps and scales", () => {
  assert.equal(estimatePathDuration([], 2), 0);
  assert.ok(estimatePathDuration(new Array(30).fill({}), 2) > 0);
  assert.equal(estimatePathDuration(new Array(9999).fill({}), 2), 180);
});

test("pickStarsForPath keeps wave order", () => {
  const stars = [
    { wave: "ouverture", text: "o1" },
    { wave: "immersion", text: "i1" },
    { wave: "bascule", text: "b1" },
    { wave: "immersion", text: "i2" },
  ];
  const picked = pickStarsForPath(stars, new Array(30).fill({}), 180);
  assert.equal(picked[0].wave, "immersion");
});

test("buildEchostoryText returns shaped output", () => {
  const out = buildEchostoryText({
    collectedStars: [
      { wave: "immersion", text: "A" },
      { wave: "bascule", text: "B" },
      { wave: "ouverture", text: "C" },
    ],
    path: new Array(10).fill({}),
    skeleton: { cues: ["Et bientôt…"] },
  });
  assert.equal(typeof out.titleSuggestion, "string");
  assert.ok(Array.isArray(out.lines));
  assert.ok(out.plainText.includes("Et bientôt…"));
});
