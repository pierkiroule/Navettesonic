import test from "node:test";
import assert from "node:assert/strict";

function createNavigoState() {
  return {
    odysseoMode: "trace",
    odysseoPath: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    isTravelPlaying: false,
    exportStatus: "",
    metadata: { depth: 2, markers: 3 },
  };
}

function switchNavigoMode(state, nextMode) {
  return {
    ...state,
    odysseoMode: nextMode,
  };
}

test("Tracer -> Traverser conserve le state partagé Navigo", () => {
  const initial = createNavigoState();

  const transitioned = switchNavigoMode(initial, "travel");

  assert.equal(transitioned.odysseoMode, "travel");
  assert.deepEqual(transitioned.odysseoPath, initial.odysseoPath);
  assert.equal(transitioned.isTravelPlaying, initial.isTravelPlaying);
  assert.equal(transitioned.exportStatus, initial.exportStatus);
  assert.deepEqual(transitioned.metadata, initial.metadata);
});
