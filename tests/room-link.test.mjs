import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRoomSlug, extractRoomSlugFromUrl } from '../src/features/arena/utils/roomLink.js';

test('normalizeRoomSlug removes unsupported chars and uppercases', () => {
  assert.equal(normalizeRoomSlug(' room-ab c-10io '), 'RMABC');
});

test('extractRoomSlugFromUrl accepts room and arenaInvite query params', () => {
  const qpRoom = new URLSearchParams('?room=roomabc99');
  const qpInvite = new URLSearchParams('?arenaInvite=roomabc99');
  assert.equal(extractRoomSlugFromUrl(qpRoom), 'RMABC99');
  assert.equal(extractRoomSlugFromUrl(qpInvite), 'RMABC99');
});

test('extractRoomSlugFromUrl rejects short or missing values', () => {
  assert.equal(extractRoomSlugFromUrl(new URLSearchParams('?room=local')), '');
  assert.equal(extractRoomSlugFromUrl(null), '');
});
