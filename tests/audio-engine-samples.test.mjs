import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSooncutSampleFileByColor,
  getSooncutSampleUrlByColor,
  resolveBucketSampleFile,
} from '../src/core/audioEngine.js';

test('resolveBucketSampleFile maps bubble bucket ids to canonical mp3 files', async () => {
  assert.equal(await resolveBucketSampleFile('bulle_002'), 'Bulle_002.mp3');
  assert.equal(await resolveBucketSampleFile('supabase:Bulle_026.mp3'), 'Bulle_026.mp3');
  assert.equal(await resolveBucketSampleFile('missing'), 'Bulle_001.mp3');
});

test('getSooncutSampleFileByColor distributes star colors on sooncut extrait ranges', () => {
  assert.equal(getSooncutSampleFileByColor(0, 0), 'extrait_001.mp3');
  assert.equal(getSooncutSampleFileByColor(0, 14), 'extrait_015.mp3');
  assert.equal(getSooncutSampleFileByColor(1, 0), 'extrait_016.mp3');
  assert.equal(getSooncutSampleFileByColor(1, 19), 'extrait_035.mp3');
  assert.equal(getSooncutSampleFileByColor(2, 0), 'extrait_036.mp3');
  assert.equal(getSooncutSampleFileByColor(2, 20), 'extrait_056.mp3');
});

test('getSooncutSampleUrlByColor builds sooncut extrait mp3 urls for stars', () => {
  assert.match(
    getSooncutSampleUrlByColor(0, 0),
    /Soonbucket\/sooncut\/extrait_001\.mp3$/,
  );
  assert.match(
    getSooncutSampleUrlByColor(2, 20),
    /Soonbucket\/sooncut\/extrait_056\.mp3$/,
  );
});
