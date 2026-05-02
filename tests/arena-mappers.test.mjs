import test from 'node:test';
import assert from 'node:assert/strict';
import { dbBubbleToRuntimeBubble, runtimeBubbleToDbInsert, runtimeBubbleToDbPatch } from '../src/features/arena/utils/arenaMappers.js';

test('dbBubbleToRuntimeBubble maps db row to runtime shape', () => {
  const row = { id: 'b1', sample_id: 'rain', label: 'Pluie', x: 10, y: 20, radius: 80, hue: 190, layer: 'back', halo_style: 'mist', version: 4 };
  const result = dbBubbleToRuntimeBubble(row);
  assert.deepEqual(result, { id: 'b1', _sampleId: 'rain', label: 'Pluie', x: 10, y: 20, r: 80, hue: 190, layer: 'back', haloStyle: 'mist', version: 4 });
});

test('runtimeBubbleToDbInsert applies sane defaults', () => {
  const result = runtimeBubbleToDbInsert({ arenaId: 'a1', userId: 'u1', bubble: { id: 'b1', _sampleId: 'wind' } });
  assert.equal(result.arena_id, 'a1');
  assert.equal(result.created_by, 'u1');
  assert.equal(result.radius, 72);
  assert.equal(result.hue, 195);
  assert.equal(result.layer, 'front');
  assert.equal(result.halo_style, 'aurora');
  assert.equal(result.version, 1);
});

test('runtimeBubbleToDbPatch merges patch and increments version', () => {
  const base = { _sampleId: 'birds', label: 'Oiseaux', x: 1, y: 2, r: 30, hue: 12, layer: 'front', haloStyle: 'aurora', version: 5 };
  const result = runtimeBubbleToDbPatch(base, { x: 99, r: 44 });
  assert.equal(result.x, 99);
  assert.equal(result.radius, 44);
  assert.equal(result.version, 6);
});
