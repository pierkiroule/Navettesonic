import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getBucketSampleFileByIndex,
  getBucketSampleUrlByIndex,
  resolveBucketSampleFile,
} from '../src/core/audioEngine.js';

test('resolveBucketSampleFile maps bucket ids to canonical mp3 files', async () => {
  assert.equal(await resolveBucketSampleFile('bulle_002'), 'Bulle_002.mp3');
  assert.equal(await resolveBucketSampleFile('supabase:Bulle_026.mp3'), 'Bulle_026.mp3');
  assert.equal(await resolveBucketSampleFile('missing'), 'Bulle_001.mp3');
});

test('getBucketSampleUrlByIndex builds bucket mp3 urls for stars', () => {
  assert.equal(getBucketSampleFileByIndex(7), 'Bulle_007.mp3');
  assert.match(getBucketSampleUrlByIndex(15), /Soonbucket\/bulles\/Bulle_015\.mp3$/);
});
