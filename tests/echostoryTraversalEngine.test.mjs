import test from "node:test";
import assert from "node:assert/strict";
import { tickEchostoryTraversal } from "../src/core/echostory/echostoryTraversalEngine.js";

function makeState(pathLen = 30, index = 0) {
  const odysseoPath = Array.from({ length: pathLen }, (_, i) => ({ x: i * 4, y: i * 2 }));
  return {
    odysseoPath,
    odysseoDepthMarkers: [],
    fish: { x: 0, y: 0, targetX: 0, targetY: 0, depth: 2, angle: 0, vx: 0, vy: 0 },
    echostory: { echostoryPathIndex: index, escapeState: "idle" },
  };
}

test("tickEchostoryTraversal advances from previous echostory index", () => {
  const state = makeState(120, 40);
  const result = tickEchostoryTraversal(state, { desiredDurationSec: 180 });

  assert.ok(result);
  assert.ok(result.echostoryPathIndex > 40);
  assert.equal(result.finished, false);
});
