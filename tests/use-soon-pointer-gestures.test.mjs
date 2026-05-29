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

test('tap simple ne pilote plus Soon', () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event());
  assert.equal(calls.fishTarget, 0);
});

test('double tap ne pilote plus Soon ni son boost', () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event(1, 500, 500));
  api.handlePointerUp(event(1, 500, 500));
  api.handlePointerDown(event(2, 502, 501));
  assert.equal(calls.fishTarget, 0);
  assert.equal(calls.boostSpeed, 0);
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
  assert.equal(calls.boostSpeed, 0);
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


test('tap sur une étoile snappée la sélectionne directement sans piloter Soon', () => {
  const calls = { fishTarget: 0, options: [] };
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      echostory: {
        stars: [{ id: 'star-1', x: 1160, y: 0, r: 18, attachedToContour: true }],
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
    onFishTarget: (_x, _y, _r, options) => {
      calls.fishTarget += 1;
      calls.options.push(options);
    },
  });

  pointerApi.handlePointerDown(event(1, 879, 500));

  assert.equal(stateRef.current.echostory.stars[0].pendingBreathChoice, false);
  assert.equal(stateRef.current.echostory.stars[0].attachedToContour, false);
  assert.equal(calls.fishTarget, 0);
  assert.equal(calls.options.length, 0);
});


test('glisser une étoile déplace directement sa position sous le doigt', () => {
  const calls = { fishTarget: 0, last: null };
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      echostory: {
        stars: [{ id: 'star-drag', x: 0, y: 0, r: 18, attachedToContour: false }],
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
    onFishTarget: (x, y, _r, options) => {
      calls.fishTarget += 1;
      calls.last = { x, y, options };
    },
  });

  pointerApi.handlePointerDown(event(1, 500, 500));
  pointerApi.handlePointerMove(event(1, 540, 500));

  assert.ok(stateRef.current.echostory.stars[0].x > 110);
  assert.equal(stateRef.current.echostory.stars[0].attachedToContour, false);
  assert.equal(calls.fishTarget, 0);
  assert.equal(calls.last, null);
});


test('tap proche attrape une étoile grâce à une zone tactile agrandie', () => {
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      echostory: {
        stars: [{ id: 'large-touch-star', x: 0, y: 0, r: 18, attachedToContour: false }],
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
  });

  pointerApi.handlePointerDown(event(1, 530, 500));

  assert.equal(stateRef.current.echostory.stars[0].draggingByTouch, true);
});


test('glisser une étoile sans id continue avec la référence tactile', () => {
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      echostory: {
        stars: [{ x: 0, y: 0, r: 18, attachedToContour: false }],
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
  });

  pointerApi.handlePointerDown(event(1, 500, 500));
  pointerApi.handlePointerMove(event(1, 540, 500));

  assert.ok(stateRef.current.echostory.stars[0].x > 110);
  assert.equal(stateRef.current.echostory.stars[0].draggingByTouch, true);

  pointerApi.handlePointerUp(event(1, 540, 500));

  assert.equal(stateRef.current.echostory.stars[0].draggingByTouch, false);
});


test('glisser dans le vide en echostory ne déplace plus Soon', () => {
  const calls = { fishTarget: 0 };
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
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
