import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';

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
