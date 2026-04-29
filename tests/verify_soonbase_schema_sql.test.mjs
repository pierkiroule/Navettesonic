import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql = fs.readFileSync("supabase/scripts/verify_soonbase_schema.sql", "utf8");

test("verify script checks required tables", () => {
  for (const table of ["soon_arenas", "soon_arena_members", "soon_arena_bubbles", "soon_arena_invites"]) {
    assert.match(sql, new RegExp(table));
  }
});

test("verify script checks RPC accept_arena_invite", () => {
  assert.match(sql, /accept_arena_invite/);
});
