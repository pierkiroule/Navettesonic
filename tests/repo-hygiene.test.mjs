import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const INVALID_FILENAME_PATTERNS = [
  /[\u0000-\u001f]/u,
  /^\s+|\s+$/u,
  /\x08/u,
];

test('repository root has no invalid scratch-like filenames', () => {
  const rootEntries = readdirSync(new URL('..', import.meta.url));
  const invalid = rootEntries.filter((name) =>
    INVALID_FILENAME_PATTERNS.some((pattern) => pattern.test(name)),
  );

  assert.deepEqual(
    invalid,
    [],
    `Unexpected invalid filenames in repository root: ${invalid.join(', ')}`,
  );
});

test('SoonCanvas has no centered music composition button', () => {
  const soonCanvas = readFileSync(new URL('../src/components/SoonCanvas.jsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

  assert.equal(soonCanvas.includes('🎵'), false);
  assert.equal(soonCanvas.includes('composition-generator-btn'), false);
  assert.equal(styles.includes('.composition-generator-btn'), false);
});
