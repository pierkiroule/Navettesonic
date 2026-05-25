import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStarMp3Trace } from '../src/core/odysseoStarMp3Trace.js';

test('buildStarMp3Trace orders stars by wave and creates mp3 suggestions', () => {
  const trace = buildStarMp3Trace({
    collectedStars: [
      { id: 'z', wave: 'ouverture', text: 'Ouverture finale' },
      { id: 'a', wave: 'immersion', text: 'Écume douce' },
      { id: 'm', wave: 'bascule', text: 'Pont de lune' },
    ],
    path: [{ x: 0, y: 0 }, { x: 5, y: 8 }],
  });

  assert.equal(trace.length, 3);
  assert.equal(trace[0].wave, 'immersion');
  assert.equal(trace[1].wave, 'bascule');
  assert.equal(trace[2].wave, 'ouverture');
  assert.match(trace[0].suggestedFile, /^01_ecume-douce\.mp3$/);
  assert.equal(trace[2].traceProgress, 1);
});
