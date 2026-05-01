import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appJs = fs.readFileSync('src/features/legacy/runtime/legacyApp.js', 'utf8');

test('front principal n’utilise plus de tables soon_*', () => {
  assert.doesNotMatch(appJs, /from\('soon_/);
});

test('front principal n’utilise plus accept_arena_invite', () => {
  assert.doesNotMatch(appJs, /rpc\('accept_arena_invite'/);
});
