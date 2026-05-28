import test from 'node:test';
import assert from 'node:assert/strict';
import { useSoonPointer } from '../src/components/soon/useSoonPointer.js';

function createHarness() {
  const calls = { fishTarget: 0, boostSpeed: 0, openMenu: 0 };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  };
  const stateRef = { current: { interactionMode: 'swim', mode: 'echostory', fish: { depth: 1 }, viewZoom: 0, circuitAutopilot: false, bubbles: [] } };
  const api = useSoonPointer({
    canvasRef: { current: canvas },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
    onFishTarget: () => { calls.fishTarget += 1; },
    onBoostFishSpeed: () => { calls.boostSpeed += 1; },
    onOpenFishContextMenu: () => { calls.openMenu += 1; },
  });
  return { api, calls };
}

function event(pointerId = 1, x = 500, y = 500) {
  return { pointerId, clientX: x, clientY: y };
}

test('tap simple déclenche la nage', () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event());
  assert.equal(calls.fishTarget, 1);
});

test('double tap active le boost de vitesse', () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event(1, 500, 500));
  api.handlePointerUp(event(1, 500, 500));
  api.handlePointerDown(event(2, 502, 501));
  assert.equal(calls.boostSpeed, 1);
});

test('long press en nage ne doit pas ouvrir le menu contextuel', async () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event(1, 510, 505));
  await new Promise((r) => setTimeout(r, 520));
  assert.equal(calls.openMenu, 0);
});


test('double tap ne doit pas ouvrir le menu contextuel', async () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event(1, 500, 500));
  api.handlePointerUp(event(1, 500, 500));
  api.handlePointerDown(event(2, 501, 500));
  await new Promise((r) => setTimeout(r, 520));
  assert.equal(calls.boostSpeed, 1);
  assert.equal(calls.openMenu, 0);
});

test('long press en nage ne déclenche ni menu ni boost vitesse', async () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event(1, 510, 505));
  await new Promise((r) => setTimeout(r, 520));
  api.handlePointerUp(event(1, 510, 505));
  assert.equal(calls.openMenu, 0);
  assert.equal(calls.boostSpeed, 0);
});


test('tap sur une étoile snappée sélectionne le tissage sans déclencher la nage', () => {
  const { calls } = createHarness();
  let selectedStarId = null;
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      soonTouchMode: 'weave',
      echostory: {
        stars: [{ id: 'star-1', x: 0, y: 0, r: 18, attachedToContour: true }],
      },
    },
  };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  };
  const pointerApi = useSoonPointer({
    canvasRef: { current: canvas },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
    onFishTarget: () => { calls.fishTarget += 1; },
    onSelectContourStar: (id) => { selectedStarId = id; },
  });

  pointerApi.handlePointerDown(event(1, 500, 500));

  assert.equal(selectedStarId, 'star-1');
  assert.equal(calls.fishTarget, 0);
});


test('mode poisson garde le pilotage tactile même sur une étoile snappée', () => {
  let selectedStarId = null;
  const calls = { fishTarget: 0 };
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      soonTouchMode: 'fish',
      echostory: {
        stars: [{ id: 'star-1', x: 0, y: 0, r: 18, attachedToContour: true }],
      },
    },
  };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  };
  const pointerApi = useSoonPointer({
    canvasRef: { current: canvas },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
    onFishTarget: () => { calls.fishTarget += 1; },
    onSelectContourStar: (id) => { selectedStarId = id; },
  });

  pointerApi.handlePointerDown(event(1, 500, 500));

  assert.equal(selectedStarId, null);
  assert.equal(calls.fishTarget, 1);
});

test('mode tisser laisse Soon immobile quand le doigt glisse hors étoile', () => {
  const calls = { fishTarget: 0 };
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      soonTouchMode: 'weave',
      echostory: { stars: [] },
    },
  };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  };
  const pointerApi = useSoonPointer({
    canvasRef: { current: canvas },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
    onFishTarget: () => { calls.fishTarget += 1; },
  });

  pointerApi.handlePointerDown(event(1, 500, 500));
  pointerApi.handlePointerMove(event(1, 520, 520));

  assert.equal(calls.fishTarget, 0);
});
