import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInviteCode, generateInviteCode } from '../src/features/arena/utils/inviteCode.js';
import { dbBubbleToRuntimeBubble, runtimeBubbleToDbInsert, runtimeBubbleToDbPatch } from '../src/features/arena/utils/arenaMappers.js';
import { joinArenaByCode } from '../src/features/arena/services/arenaService.js';

test('normalizeInviteCode', () => {
  assert.equal(normalizeInviteCode(' ab c-12o '), 'ABC2');
});

test('generateInviteCode', () => {
  const code = generateInviteCode();
  assert.equal(code.length, 6);
  assert.match(code, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
});

test('db/runtime bubble mappings', () => {
  const db = { id: '1', sample_id: 's', label: 'L', x: 1, y: 2, radius: 3, hue: 4, layer: 'front', halo_style: 'aurora', version: 2 };
  const runtime = dbBubbleToRuntimeBubble(db);
  assert.equal(runtime.r, 3);
  const insert = runtimeBubbleToDbInsert({ arenaId: 'a', userId: 'u', bubble: runtime });
  assert.equal(insert.arena_id, 'a');
  const patch = runtimeBubbleToDbPatch({ ...runtime, version: 2 }, { x: 9 });
  assert.equal(patch.x, 9);
  assert.equal(patch.version, 3);
});

test('joinArenaByCode empty code', async () => {
  const res = await joinArenaByCode({ supabase: {}, userId: 'u', inviteCode: '   ' });
  assert.equal(res.error.message, 'Code d’invitation requis');
});
