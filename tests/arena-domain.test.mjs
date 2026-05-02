import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaDomainService } from '../src/features/arena/services/arenaDomainService.js';

test('formalized status transitions are strictly draft -> published -> archived', () => {
  assert.deepEqual(arenaDomainService.TRANSITIONS.draft, ['published']);
  assert.deepEqual(arenaDomainService.TRANSITIONS.published, ['archived']);
  assert.deepEqual(arenaDomainService.TRANSITIONS.archived, []);
});

test('only owner can trigger transitions', () => {
  assert.equal(arenaDomainService.canTransition({ fromStatus: 'draft', toStatus: 'published', actorRole: 'owner' }), true);
  assert.equal(arenaDomainService.canTransition({ fromStatus: 'published', toStatus: 'archived', actorRole: 'owner' }), true);
  assert.equal(arenaDomainService.canTransition({ fromStatus: 'draft', toStatus: 'published', actorRole: 'editor' }), false);
  assert.equal(arenaDomainService.canTransition({ fromStatus: 'published', toStatus: 'archived', actorRole: 'visitor' }), false);
});

test('visitor is blocked from any action except read-only on published arenas', () => {
  const publishedPolicy = arenaDomainService.getScreenPolicy({ status: 'published', actorRole: 'visitor' });
  assert.equal(publishedPolicy.canRead, true);
  assert.equal(publishedPolicy.canWrite, false);
  assert.equal(publishedPolicy.canTransition, false);

  const draftPolicy = arenaDomainService.getScreenPolicy({ status: 'draft', actorRole: 'visitor' });
  assert.equal(draftPolicy.canRead, false);
  assert.equal(draftPolicy.canWrite, false);
});
