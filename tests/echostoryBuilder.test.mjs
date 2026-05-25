import test from "node:test";
import assert from "node:assert/strict";
import { buildEchostoryText, buildPathStarsFromTimeline, estimatePathDuration, pickStarsForPath } from "../src/core/echostory/echostoryBuilder.js";

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

test("buildPathStarsFromTimeline reuses collected stars in order for navigi trace", () => {
  const collectedStars = [
    { id: "imm-1", text: "A", wave: "immersion", color: "#53b9ff", r: 19 },
    { id: "bas-1", text: "B", wave: "bascule", color: "#ff9f40", r: 20 },
    { id: "ouv-1", text: "C", wave: "ouverture", color: "#51d37c", r: 21 },
  ];

  const pathStars = buildPathStarsFromTimeline({
    collectedStars,
    lines: [{ text: "unused" }],
    path: [{ x: 0, y: 0 }, { x: 20, y: 20 }, { x: 40, y: 40 }],
  });

  assert.equal(pathStars.length, 3);
  assert.deepEqual(pathStars.map((star) => star.id), ["imm-1", "bas-1", "ouv-1"]);
  assert.deepEqual(pathStars.map((star) => star.text), ["A", "B", "C"]);
  assert.deepEqual(pathStars.map((star) => star.color), ["#53b9ff", "#ff9f40", "#51d37c"]);
});
