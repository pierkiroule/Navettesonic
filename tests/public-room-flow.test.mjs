import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildRoomUrl, normalizeRoomSlug } from '../src/features/arena/utils/roomLink.js';

test('normalizeRoomSlug normalizes code', () => {
  assert.equal(normalizeRoomSlug(' ab-cd 12 '), 'ABCD2');
});

test('buildRoomUrl generates ?room=CODE', () => {
  assert.equal(buildRoomUrl({ origin: 'https://soon.test', roomSlug: 'ab cd' }), 'https://soon.test/?room=ABCD');
});

test('arenaService does not reference soon_* tables', () => {
  const content = fs.readFileSync('src/features/arena/services/arenaService.js', 'utf8');
  assert.equal(/soon_arenas|soon_arena_bubbles|soon_arena_invites|soon_arena_members|soon_arena_presence/.test(content), false);
});

test('VisitorArenaPage has no insert/update/delete write call', () => {
  const content = fs.readFileSync('src/features/arena/pages/VisitorArenaPage.jsx', 'utf8');
  assert.equal(/insert|update|delete/i.test(content), false);
});

test('HostArenaPage can create and publish arena', () => {
  const content = fs.readFileSync('src/features/arena/pages/HostArenaPage.jsx', 'utf8');
  assert.match(content, /createHostArena/);
  assert.match(content, /publishArena/);
});

test('AppRouter renders VisitorArenaPage when ?room exists', () => {
  const content = fs.readFileSync('src/app/AppRouter.jsx', 'utf8');
  assert.match(content, /if \(roomCode\) return <VisitorArenaPage/);
});
