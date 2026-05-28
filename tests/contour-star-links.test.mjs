import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleContourStarSelection } from '../src/core/echostory/contourStarLinks.js';

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
