import test from 'node:test';
import assert from 'node:assert/strict';
import { useSoonPointer } from '../src/components/soon/useSoonPointer.js';

function createHarness() {
  const calls = { fishTarget: 0, setDepth: 0, openMenu: 0 };
  const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  };
  const stateRef = { current: { interactionMode: 'swim', mode: 'compo', fish: { depth: 1 }, viewZoom: 0, circuitAutopilot: false, bubbles: [] } };
  const api = useSoonPointer({
    canvasRef: { current: canvas },
    cameraRef: { current: { x: 0, y: 0 } },
    arenaRef: { current: { radius: 1200 } },
    pointerRef: { current: { activePointers: new Map() } },
    stateRef,
    onFishTarget: () => { calls.fishTarget += 1; },
    onSetFishDepth: () => { calls.setDepth += 1; },
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

test('double tap conserve le comportement historique de profondeur', () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event(1, 500, 500));
  api.handlePointerUp(event(1, 500, 500));
  api.handlePointerDown(event(2, 502, 501));
  assert.equal(calls.setDepth, 1);
});

test('long press ouvre le menu contextuel poisson', async () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event(1, 510, 505));
  await new Promise((r) => setTimeout(r, 520));
  assert.equal(calls.openMenu, 1);
});


test('double tap ne doit pas ouvrir le menu contextuel', async () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event(1, 500, 500));
  api.handlePointerUp(event(1, 500, 500));
  api.handlePointerDown(event(2, 501, 500));
  await new Promise((r) => setTimeout(r, 520));
  assert.equal(calls.setDepth, 1);
  assert.equal(calls.openMenu, 0);
});

test('long press ne doit pas déclencher de changement de profondeur', async () => {
  const { api, calls } = createHarness();
  api.handlePointerDown(event(1, 510, 505));
  await new Promise((r) => setTimeout(r, 520));
  api.handlePointerUp(event(1, 510, 505));
  assert.equal(calls.openMenu, 1);
  assert.equal(calls.setDepth, 0);
});
