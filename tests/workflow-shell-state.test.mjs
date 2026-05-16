import { ODYSSEO_MODE_TRACE, ODYSSEO_MODE_TRAVEL, WORKFLOW_ROOT_COMPO, WORKFLOW_ROOT_NAVIGO } from "../src/core/uiState.js";
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeWorkflowRoot,
  parseWorkflowFromHash,
  serializeWorkflowHash,
  readPersistedWorkflowRoot,
  persistWorkflowRoot,
  WORKFLOW_ROOT_STORAGE_KEY,
} from '../src/core/workflowShellState.js';

test('parseWorkflowFromHash supports new and legacy routes', () => {
  assert.deepEqual(parseWorkflowFromHash('#compo'), { root: WORKFLOW_ROOT_COMPO, odysseoMode: null });
  assert.deepEqual(parseWorkflowFromHash('#navigo'), { root: WORKFLOW_ROOT_NAVIGO, odysseoMode: ODYSSEO_MODE_TRACE });
  assert.deepEqual(parseWorkflowFromHash('#trace'), { root: WORKFLOW_ROOT_NAVIGO, odysseoMode: ODYSSEO_MODE_TRACE });
  assert.deepEqual(parseWorkflowFromHash('#travel'), { root: WORKFLOW_ROOT_NAVIGO, odysseoMode: ODYSSEO_MODE_TRAVEL });
});

test('serializeWorkflowHash preserves backward compatibility for navigo subroutes', () => {
  assert.equal(serializeWorkflowHash(WORKFLOW_ROOT_COMPO), '#compo');
  assert.equal(serializeWorkflowHash(WORKFLOW_ROOT_NAVIGO, ODYSSEO_MODE_TRACE), '#trace');
  assert.equal(serializeWorkflowHash(WORKFLOW_ROOT_NAVIGO, ODYSSEO_MODE_TRAVEL), '#travel');
});

test('persist/read workflow root', () => {
  const memory = new Map();
  const storage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };

  persistWorkflowRoot(WORKFLOW_ROOT_NAVIGO, storage);
  assert.equal(memory.get(WORKFLOW_ROOT_STORAGE_KEY), WORKFLOW_ROOT_NAVIGO);
  assert.equal(readPersistedWorkflowRoot(storage), WORKFLOW_ROOT_NAVIGO);
  assert.equal(normalizeWorkflowRoot('oops'), WORKFLOW_ROOT_COMPO);
});
