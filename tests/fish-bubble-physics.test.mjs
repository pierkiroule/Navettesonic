import test from 'node:test';
import assert from 'node:assert/strict';
import { separateBubblesByDepth } from '../src/core/fishBubblePhysics.js';

test('separateBubblesByDepth separates overlapping bubbles using physics radius fallback', () => {
  const bubbles = [
    { id: 'a', x: 0, y: 0, depth: 1, r: 0, size: 40 },
    { id: 'b', x: 0, y: 0, depth: 1, r: 0, size: 40 },
  ];

  const next = separateBubblesByDepth(bubbles);
  const distance = Math.hypot(next[1].x - next[0].x, next[1].y - next[0].y);
  assert.ok(distance > 0, 'bubbles should no longer be perfectly overlapped');
});
