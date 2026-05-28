import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleContourStarSelection } from '../src/core/echostory/contourStarLinks.js';
import { drawEchostoryContourLinks } from '../src/core/echostory/echostoryRender.js';

function makeState() {
  return {
    stars: [
      { id: 'star-1', attachedToContour: true, x: 0, y: -100, r: 18 },
      { id: 'star-2', attachedToContour: true, x: 100, y: 0, r: 18 },
      { id: 'star-3', attachedToContour: false, x: 0, y: 0, r: 18 },
    ],
  };
}

test('toggleContourStarSelection sélectionne les étoiles snappées et tisse les liens dans l’ordre', () => {
  let echostory = makeState();

  echostory = toggleContourStarSelection(echostory, 'star-1');
  assert.deepEqual(echostory.selectedContourStarIds, ['star-1']);
  assert.deepEqual(echostory.contourStarLinks, []);
  assert.equal(echostory.stars[0].selectedOnContour, true);

  echostory = toggleContourStarSelection(echostory, 'star-2');
  assert.deepEqual(echostory.selectedContourStarIds, ['star-1', 'star-2']);
  assert.deepEqual(echostory.contourStarLinks, [
    { id: 'contour-star-link-star-1-star-2', from: 'star-1', to: 'star-2' },
  ]);
  assert.equal(echostory.stars[1].selectedOnContour, true);
});

test('toggleContourStarSelection ignore les étoiles non snappées et retire leurs liens à la désélection', () => {
  let echostory = makeState();

  const before = echostory;
  echostory = toggleContourStarSelection(echostory, 'star-3');
  assert.equal(echostory, before);
  assert.equal(echostory.selectedContourStarIds, undefined);

  echostory = toggleContourStarSelection(echostory, 'star-1');
  echostory = toggleContourStarSelection(echostory, 'star-2');
  echostory = toggleContourStarSelection(echostory, 'star-1');

  assert.deepEqual(echostory.selectedContourStarIds, ['star-2']);
  assert.deepEqual(echostory.contourStarLinks, []);
  assert.equal(echostory.stars[0].selectedOnContour, false);
  assert.equal(echostory.stars[1].selectedOnContour, true);
});


test('drawEchostoryContourLinks trace des cordes qui traversent l’arène', () => {
  const calls = [];
  const ctx = {
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    beginPath: () => calls.push(['beginPath']),
    moveTo: (x, y) => calls.push(['moveTo', Math.round(x), Math.round(y)]),
    lineTo: (x, y) => calls.push(['lineTo', Math.round(x), Math.round(y)]),
    stroke: () => calls.push(['stroke']),
    arc: (...args) => calls.push(['arc', ...args]),
    createLinearGradient: () => ({ addColorStop: () => {} }),
  };

  drawEchostoryContourLinks(ctx, {
    stars: [
      { id: 'star-1', attachedToContour: true, x: -100, y: 0, color: '#53b9ff' },
      { id: 'star-2', attachedToContour: true, x: 100, y: 0, color: '#ff9f40' },
    ],
    contourStarLinks: [{ id: 'link-1', from: 'star-1', to: 'star-2' }],
  }, 1200);

  assert.ok(calls.some((call) => call[0] === 'moveTo' && call[1] === -100 && call[2] === 0));
  assert.ok(calls.some((call) => call[0] === 'lineTo' && call[1] === 100 && call[2] === 0));
  assert.equal(calls.some((call) => call[0] === 'arc'), false);
});
