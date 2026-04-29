import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appJs = fs.readFileSync('src/features/legacy/runtime/legacyApp.js', 'utf8');
const verifySql = fs.readFileSync('supabase/scripts/verify_soonbase_schema.sql', 'utf8');

const tableRegex = /from\('([^']+)'\)/g;
const frontTables = new Set();
for (const m of appJs.matchAll(tableRegex)) {
  if (m[1].startsWith('soon_')) frontTables.add(m[1]);
}

const sqlTableValues = [...verifySql.matchAll(/\('([^']+)'::text\)|\('([^']+)'\)/g)]
  .map((m) => m[1] || m[2])
  .filter(Boolean);

const requiredSqlTables = new Set(
  sqlTableValues.filter((t) => t.startsWith('soon_') && !t.includes(','))
);

test('front soon_* tables are covered by verify_soonbase_schema.sql', () => {
  const missing = [...frontTables].filter((t) => !requiredSqlTables.has(t));
  assert.deepEqual(missing, [], `Missing in verify SQL: ${missing.join(', ')}`);
});

test('front uses accept_arena_invite RPC and verify SQL checks it', () => {
  assert.match(appJs, /rpc\('accept_arena_invite'/);
  assert.match(verifySql, /accept_arena_invite/);
});
