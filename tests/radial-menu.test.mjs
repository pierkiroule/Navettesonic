import test from 'node:test';
import assert from 'node:assert/strict';
import { clampItems, getNextIndex, RADIAL_MENU_MAX_ITEMS } from '../src/components/radialMenuUtils.js';

test('limite le menu radial à 6 items max', () => {
  const items = Array.from({ length: 8 }, (_, i) => ({ id: i }));
  const clamped = clampItems(items);
  assert.equal(clamped.length, RADIAL_MENU_MAX_ITEMS);
});

test('navigation clavier boucle à droite et à gauche', () => {
  assert.equal(getNextIndex(0, 4, 'ArrowRight'), 1);
  assert.equal(getNextIndex(3, 4, 'ArrowRight'), 0);
  assert.equal(getNextIndex(0, 4, 'ArrowLeft'), 3);
});

test('navigation tactile simulée: index inchangé sans direction', () => {
  assert.equal(getNextIndex(2, 4, 'TouchStart'), 2);
});
