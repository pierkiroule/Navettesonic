import test from 'node:test';
import assert from 'node:assert/strict';
import { useSoonPointer } from '../src/components/soon/useSoonPointer.js';

function createHarness() {
  const calls = { fishTarget: 0, boostSpeed: 0, openMenu: 0, resonantTap: 0, lastResonance: null };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
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
    onResonantTap: (x, y) => { calls.resonantTap += 1; calls.lastResonance = { x, y }; },
  });
  return { api, calls };
}

function event(pointerId = 1, x = 500, y = 500) {
  return { pointerId, clientX: x, clientY: y };
}


test('tap simple ne pilote plus Soon et crée une résonance', () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event());
  assert.equal(calls.fishTarget, 0);
  assert.equal(calls.resonantTap, 1);
  assert.ok(Math.abs(calls.lastResonance.x) < 0.0001);
  assert.ok(Math.abs(calls.lastResonance.y) < 0.0001);
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


test('poser le doigt sur une étoile snappée la décroche immédiatement sans Soon', () => {
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
  assert.equal(stateRef.current.echostory.stars[0].draggingByTouch, true);
  assert.equal(calls.fishTarget, 0);
  assert.equal(calls.options.length, 0);
});


test('poser puis glisser déplace une étoile sans inertie tactile', () => {
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
  assert.equal(stateRef.current.echostory.stars[0].vx, 0);
  assert.equal(stateRef.current.echostory.stars[0].vy, 0);
  assert.equal(calls.fishTarget, 0);
  assert.equal(calls.last, null);
});


test('tap proche attrape immédiatement une étoile grâce à une zone tactile agrandie', () => {
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


test('zone tactile reste large en pixels sur un écran mobile', () => {
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      arenaRadius: 1200,
      circuitAutopilot: false,
      bubbles: [],
      echostory: {
        stars: [{ id: 'mobile-star', x: 0, y: 0, r: 34, attachedToContour: false }],
      },
    },
  };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 700 }),
  };
  const pointerApi = useSoonPointer({
    canvasRef: { current: canvas },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
  });

  pointerApi.handlePointerDown(event(1, 250, 350));

  assert.equal(stateRef.current.echostory.stars[0].draggingByTouch, true);
});

test('drag tactile publie la position des étoiles dans le state applicatif', () => {
  const patches = [];
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      echostory: {
        stars: [{ id: 'synced-star', x: 0, y: 0, r: 34, attachedToContour: true }],
      },
    },
  };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
  };
  const pointerApi = useSoonPointer({
    canvasRef: { current: canvas },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
    onMoveEchostoryStar: (id, patch) => patches.push({ id, patch }),
  });

  pointerApi.handlePointerDown(event(1, 500, 500));
  pointerApi.handlePointerMove(event(1, 540, 500));
  pointerApi.handlePointerUp(event(1, 540, 500));

  assert.equal(patches[0].id, 'synced-star');
  assert.equal(patches[0].patch.attachedToContour, false);
  assert.equal(patches[0].patch.draggingByTouch, true);
  assert.equal(patches.at(-1).patch.draggingByTouch, false);
  assert.ok(patches.some(({ patch }) => patch.x > 110));
});

test('une étoile reste prioritaire au doigt même en mode édition', () => {
  const stateRef = {
    current: {
      interactionMode: 'edit',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      echostory: {
        stars: [{ id: 'edit-star', x: 0, y: 0, r: 18, attachedToContour: false }],
      },
    },
  };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
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
});

test('un PointerEvent tactile seul suffit à déplacer une étoile', () => {
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      echostory: {
        stars: [{ id: 'pointer-touch-star', x: 0, y: 0, r: 18, attachedToContour: false }],
      },
    },
  };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
  };
  const pointerApi = useSoonPointer({
    canvasRef: { current: canvas },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
  });
  const touchPointer = (pointerId, x, y) => ({
    ...event(pointerId, x, y),
    pointerType: 'touch',
    preventDefault: () => {},
  });

  pointerApi.handlePointerDown(touchPointer(7, 500, 500));
  pointerApi.handlePointerMove(touchPointer(7, 540, 500));

  assert.ok(stateRef.current.echostory.stars[0].x > 110);
  assert.equal(stateRef.current.echostory.stars[0].draggingByTouch, true);

  pointerApi.handlePointerUp(touchPointer(7, 540, 500));

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

test('drag d’étoile fonctionne aussi en mode reso', () => {
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'reso',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      contourReaderHitZones: [{ x: 0, y: 0, r: 500 }],
      echostory: {
        stars: [{ id: 'reso-star', x: 0, y: 0, r: 34, attachedToContour: false }],
      },
    },
  };
  const pointerApi = useSoonPointer({
    canvasRef: { current: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) } },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
    onToggleContourPlayback: () => assert.fail('star drag must be prioritized before contour controls'),
  });

  pointerApi.handlePointerDown(event(1, 500, 500));
  pointerApi.handlePointerMove(event(1, 540, 500));

  assert.equal(stateRef.current.echostory.stars[0].draggingByTouch, true);
  assert.ok(stateRef.current.echostory.stars[0].x > 110);
});

test('tap hors étoile ne stoppe pas la propagation pour l’UI', () => {
  const calls = { preventDefault: 0, stopPropagation: 0 };
  const stateRef = {
    current: {
      interactionMode: 'swim',
      mode: 'echostory',
      fish: { depth: 1 },
      viewZoom: 0,
      circuitAutopilot: false,
      bubbles: [],
      echostory: { stars: [{ id: 'far-star', x: 400, y: 400, r: 34, attachedToContour: false }] },
    },
  };
  const pointerApi = useSoonPointer({
    canvasRef: { current: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) } },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
  });

  pointerApi.handlePointerDown({
    pointerId: 1,
    clientX: 500,
    clientY: 500,
    preventDefault: () => { calls.preventDefault += 1; },
    stopPropagation: () => { calls.stopPropagation += 1; },
  });

  assert.equal(stateRef.current.echostory.stars[0].draggingByTouch, undefined);
  assert.equal(calls.preventDefault, 1);
  assert.equal(calls.stopPropagation, 0);
});
