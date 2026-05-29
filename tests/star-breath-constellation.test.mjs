import test from 'node:test';
import assert from 'node:assert/strict';
import { makeEchostoryStarBreathe, pushNearbyEchostoryStars } from '../src/components/soon/useSoonCanvasLoop.js';

function stateWithStars(stars) {
  return {
    mode: 'echostory',
    arenaRadius: 1200,
    fish: { x: 0, y: -1168, vx: 0, vy: 0, depth: 1, arenaLevel: 0 },
    echostory: { stars, constellationLinks: [] },
  };
}

test('Soon touching a contour star opens breath choice without detaching it', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 0, y: -1168, r: 18, attachedToContour: true, contourAngle: -Math.PI / 2, previewPlayed: true },
  ]);

  pushNearbyEchostoryStars(state, 2000);

  assert.equal(state.echostory.stars[0].attachedToContour, true);
  assert.equal(state.echostory.stars[0].pendingBreathChoice, true);
});

test('Inspirer décroche une étoile du contour vers intérieur', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 0, y: -1168, r: 18, attachedToContour: true, contourAngle: -Math.PI / 2 },
  ]);

  const changed = makeEchostoryStarBreathe(state, 'star-1', 'inspire');

  assert.equal(changed, true);
  assert.equal(state.echostory.stars[0].attachedToContour, false);
  assert.ok(Math.hypot(state.echostory.stars[0].x, state.echostory.stars[0].y) < 1168);
  assert.ok(state.echostory.stars[0].vy > 0);
});

test('Expirer projette une étoile vers extérieur puis la masque', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 0, y: -1168, r: 18, attachedToContour: true, contourAngle: -Math.PI / 2 },
  ]);

  makeEchostoryStarBreathe(state, 'star-1', 'expire');
  assert.equal(state.echostory.stars[0].expiring, true);
  assert.ok(state.echostory.stars[0].vy < 0);

  state.echostory.stars[0].y = -1400;
  pushNearbyEchostoryStars(state, 2200);

  assert.equal(state.echostory.stars[0].expired, true);
});

test('Two unlinked interior stars do not create a constellation by themselves', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 300, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
    { id: 'star-2', x: 354, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
  ]);

  pushNearbyEchostoryStars(state, 2400);

  assert.equal(state.echostory.constellationLinks.length, 0);
});

test('Music core seeds the constellation and propagates links through connected stars', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 48, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
    { id: 'star-2', x: 104, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
    { id: 'star-3', x: 360, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
  ]);

  pushNearbyEchostoryStars(state, 2400);

  assert.ok(state.echostory.constellationLinks.some((link) => link.from === '__echostory_music_core__' || link.to === '__echostory_music_core__'));
  assert.ok(state.echostory.constellationLinks.some((link) => [link.from, link.to].includes('star-1') && [link.from, link.to].includes('star-2')));
  assert.ok(!state.echostory.constellationLinks.some((link) => [link.from, link.to].includes('star-3')));

  state.echostory.stars[0].x = 1160;
  state.echostory.stars[0].y = 0;
  pushNearbyEchostoryStars(state, 2600);

  assert.equal(state.echostory.constellationLinks.length, 0);
  assert.equal(state.echostory.stars[0].attachedToContour, true);
  assert.equal(state.echostory.stars[1].attachedToContour, true);
});
