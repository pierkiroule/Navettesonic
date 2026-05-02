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

test("verify script checks critical columns used by front", () => {
  for (const col of ["code", "owner_id", "created_by", "token"]) {
    assert.match(sql, new RegExp(col));
  }
});

test("verify script enforces active arena policy invariants", () => {
  for (const policy of [
    "arenas_public_read_published",
    "arena_bubbles_public_read_published",
    "arenas_owner_all",
    "arena_bubbles_owner_all",
  ]) {
    assert.match(sql, new RegExp(policy));
  }

  assert.match(sql, /forbidden_anon_write_policies/);
  for (const forbidden of [
    "arenas_anon_insert",
    "arenas_anon_update",
    "arenas_anon_delete",
    "arena_bubbles_anon_insert",
    "arena_bubbles_anon_update",
    "arena_bubbles_anon_delete",
  ]) {
    assert.match(sql, new RegExp(forbidden));
  }
});
