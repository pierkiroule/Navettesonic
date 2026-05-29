import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEchostoryCompositionPlan, getEchostoryCompositionStyle } from '../src/core/echostory/echostoryCompositionGenerator.js';

test('buildEchostoryCompositionPlan composes sections from constellation links', () => {
  const plan = buildEchostoryCompositionPlan({
    styleId: 'onirique',
    echostory: {
      stars: [
        { id: 'star-1', text: 'respire', attachedToContour: false },
        { id: 'star-2', text: 'flotte', attachedToContour: false },
        { id: 'star-3', text: 'solo', attachedToContour: false },
        { id: 'star-4', text: 'ancien', expired: true, attachedToContour: false },
      ],
      constellationLinks: [
        { from: '__echostory_music_core__', to: 'star-1' },
        { from: 'star-1', to: 'star-2' },
      ],
    },
  });

  assert.equal(plan.style.id, 'onirique');
  assert.equal(plan.constellationCount, 1);
  assert.equal(plan.starCount, 3);
  assert.deepEqual(plan.sections[0].starIds, ['star-1', 'star-2']);
  assert.equal(plan.sections[1].type, 'solo');
});

test('getEchostoryCompositionStyle falls back to hypnotique', () => {
  assert.equal(getEchostoryCompositionStyle('missing').id, 'hypnotique');
});
