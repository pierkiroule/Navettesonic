import test from 'node:test';
import assert from 'node:assert/strict';
import { makeEchostoryStarBreathe, pushNearbyEchostoryStars } from '../src/components/soon/useSoonCanvasLoop.js';
import { ECHOSTORY_CORE_SYMBOL, ECHOSTORY_MUSIC_CORE_ID, makeLinkId, normalizeEchostoryNetwork, toggleEchostoryLink } from '../src/core/echostory/echostoryConstellation.js';
import { drawEchostoryConstellationLinks } from '../src/core/echostory/echostoryRender.js';

function stateWithStars(stars) {
  return {
    mode: 'echostory',
    arenaRadius: 1200,
    fish: { x: 0, y: -1168, vx: 0, vy: 0, depth: 1, arenaLevel: 0 },
    echostory: { stars, links: [], constellationLinks: [] },
  };
}

test('Soon masqué ne pousse plus les étoiles du contour', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 0, y: -1168, r: 18, attachedToContour: true, contourAngle: -Math.PI / 2, previewPlayed: true },
  ]);

  pushNearbyEchostoryStars(state, 2000);

  assert.equal(state.echostory.stars[0].attachedToContour, true);
  assert.equal(state.echostory.stars[0].pendingBreathChoice, undefined);
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


test('Une étoile en drag tactile ne se resnappe pas au contour pendant le déplacement', () => {
  const state = stateWithStars([
    { id: 'star-dragging', x: 1160, y: 0, r: 18, attachedToContour: false, previewPlayed: true, draggingByTouch: true },
  ]);

  pushNearbyEchostoryStars(state, 2400);

  assert.equal(state.echostory.stars[0].attachedToContour, false);
  assert.equal(state.echostory.stars[0].x, 1160);
  assert.equal(state.echostory.stars[0].draggingByTouch, true);
});

test('Two unlinked interior stars do not create a constellation by themselves', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 300, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
    { id: 'star-2', x: 354, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
  ]);

  pushNearbyEchostoryStars(state, 2400);

  assert.equal(state.echostory.constellationLinks.length, 0);
});

test('Le contact toggle avec le core crée un lien non orienté dans echostory.links', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 48, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
  ]);

  state.echostory = toggleEchostoryLink(state.echostory, 'star-1', ECHOSTORY_MUSIC_CORE_ID, { restLength: 148, now: 2400 });

  assert.deepEqual(state.echostory.links.map((link) => link.id), [makeLinkId('star-1', ECHOSTORY_MUSIC_CORE_ID)]);
  assert.equal(state.echostory.links[0].kind, 'music-core');
  assert.equal(state.echostory.stars[0].connectedToCore, true);
  assert.deepEqual(state.echostory.coreConnectedStarIds, ['star-1']);
  assert.equal(state.echostory.constellationLinks, state.echostory.links);
});

test('Un second contact avec la même paire supprime le lien et déclenche une dissolution', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 48, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
  ]);

  state.echostory = toggleEchostoryLink(state.echostory, ECHOSTORY_MUSIC_CORE_ID, 'star-1', { restLength: 148, now: 2400 });
  state.echostory = toggleEchostoryLink(state.echostory, 'star-1', ECHOSTORY_MUSIC_CORE_ID, { restLength: 148, now: 2500 });

  assert.equal(state.echostory.links.length, 0);
  assert.equal(state.echostory.stars[0].connectedToCore, false);
  assert.equal(state.echostory.linkEffects.at(-1).type, 'remove');
});

test('Les connexions directes et indirectes au core sont recalculées après toggle', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 80, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
    { id: 'star-2', x: 214, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
    { id: 'star-3', x: 420, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
  ]);

  state.echostory = toggleEchostoryLink(state.echostory, ECHOSTORY_MUSIC_CORE_ID, 'star-1', { restLength: 148, now: 2400 });
  state.echostory = toggleEchostoryLink(state.echostory, 'star-1', 'star-2', { restLength: 132, now: 2450 });
  pushNearbyEchostoryStars(state, 2500);

  assert.deepEqual(new Set(state.echostory.coreConnectedStarIds), new Set(['star-1', 'star-2']));
  assert.equal(state.echostory.stars.find((star) => star.id === 'star-1').connectedToCore, true);
  assert.equal(state.echostory.stars.find((star) => star.id === 'star-2').connectedToCore, true);
  assert.equal(state.echostory.stars.find((star) => star.id === 'star-3').connectedToCore, false);
  assert.ok(state.echostory.links.every((link) => link.id === makeLinkId(link.from, link.to)));
});

test('La règle de tissage refuse un lien entre deux étoiles sans chemin vers le noyau', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 180, y: 0, r: 18, attachedToContour: false },
    { id: 'star-2', x: 300, y: 0, r: 18, attachedToContour: false },
  ]);

  state.echostory = toggleEchostoryLink(state.echostory, 'star-1', 'star-2', { restLength: 132, now: 2400 });

  assert.equal(state.echostory.links.length, 0);
  assert.deepEqual(state.echostory.coreConnectedStarIds, []);
});

test('La règle de tissage autorise une nouvelle étoile via une étoile déjà reliée au noyau', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 80, y: 0, r: 18, attachedToContour: false },
    { id: 'star-2', x: 214, y: 0, r: 18, attachedToContour: false },
  ]);

  state.echostory = toggleEchostoryLink(state.echostory, ECHOSTORY_MUSIC_CORE_ID, 'star-1', { restLength: 148, now: 2400 });
  state.echostory = toggleEchostoryLink(state.echostory, 'star-1', 'star-2', { restLength: 132, now: 2450 });

  assert.equal(state.echostory.links.length, 2);
  assert.deepEqual(new Set(state.echostory.coreConnectedStarIds), new Set(['star-1', 'star-2']));
  assert.equal(state.echostory.stars.find((star) => star.id === 'star-2').connectedToCore, true);
});

test('La normalisation purge les branches isolées du noyau central', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 80, y: 0, r: 18, attachedToContour: false },
    { id: 'star-2', x: 214, y: 0, r: 18, attachedToContour: false },
    { id: 'star-3', x: 420, y: 0, r: 18, attachedToContour: false },
    { id: 'star-4', x: 540, y: 0, r: 18, attachedToContour: false },
  ]);
  state.echostory.links = [
    { id: makeLinkId(ECHOSTORY_MUSIC_CORE_ID, 'star-1'), from: ECHOSTORY_MUSIC_CORE_ID, to: 'star-1' },
    { id: makeLinkId('star-1', 'star-2'), from: 'star-1', to: 'star-2' },
    { id: makeLinkId('star-3', 'star-4'), from: 'star-3', to: 'star-4' },
  ];

  state.echostory = normalizeEchostoryNetwork(state.echostory);

  assert.deepEqual(state.echostory.links.map((link) => link.id), [
    makeLinkId(ECHOSTORY_MUSIC_CORE_ID, 'star-1'),
    makeLinkId('star-1', 'star-2'),
  ]);
  assert.deepEqual(new Set(state.echostory.coreConnectedStarIds), new Set(['star-1', 'star-2']));
});

test('Le rendu matérialise le noyau central 🫧 entouré d’un cercle', () => {
  const calls = [];
  const ctx = {
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    beginPath: () => calls.push(['beginPath']),
    arc: (...args) => calls.push(['arc', ...args]),
    stroke: () => calls.push(['stroke']),
    fill: () => calls.push(['fill']),
    fillText: (...args) => calls.push(['fillText', ...args]),
  };

  drawEchostoryConstellationLinks(ctx, { stars: [], links: [] }, 1200);

  assert.ok(calls.some((call) => call[0] === 'arc' && call[1] === 0 && call[2] === 0));
  assert.ok(calls.some((call) => call[0] === 'fillText' && call[1] === ECHOSTORY_CORE_SYMBOL));
});

test('Soon can stretch a connected star link until it ruptures', () => {
  const state = stateWithStars([
    { id: 'star-1', x: 182, y: 0, r: 18, attachedToContour: false, previewPlayed: true, lastPushedBySoonAt: 3000 },
    { id: 'star-2', x: 20, y: 0, r: 18, attachedToContour: false, previewPlayed: true },
  ]);
  state.fish = { x: 500, y: 0, vx: 0, vy: 0, depth: 1, arenaLevel: 0 };
  state.echostory.links = [
    { id: makeLinkId(ECHOSTORY_MUSIC_CORE_ID, 'star-2'), from: ECHOSTORY_MUSIC_CORE_ID, to: 'star-2', restLength: 148, kind: 'music-core' },
    { id: makeLinkId('star-1', 'star-2'), from: 'star-1', to: 'star-2', restLength: 132, kind: 'branch' },
  ];
  state.echostory.constellationLinks = state.echostory.links;

  pushNearbyEchostoryStars(state, 3100);

  assert.ok(state.echostory.links.some((link) => [link.from, link.to].includes(ECHOSTORY_MUSIC_CORE_ID)));
  assert.ok(!state.echostory.links.some((link) => [link.from, link.to].includes('star-1') && [link.from, link.to].includes('star-2')));
});
