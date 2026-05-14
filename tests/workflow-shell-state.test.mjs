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
  assert.deepEqual(parseWorkflowFromHash('#compo'), { root: 'compo', odysseoMode: null });
  assert.deepEqual(parseWorkflowFromHash('#navigo'), { root: 'navigo', odysseoMode: 'trace' });
  assert.deepEqual(parseWorkflowFromHash('#trace'), { root: 'navigo', odysseoMode: 'trace' });
  assert.deepEqual(parseWorkflowFromHash('#travel'), { root: 'navigo', odysseoMode: 'travel' });
});

test('serializeWorkflowHash preserves backward compatibility for navigo subroutes', () => {
  assert.equal(serializeWorkflowHash('compo'), '#compo');
  assert.equal(serializeWorkflowHash('navigo', 'trace'), '#trace');
  assert.equal(serializeWorkflowHash('navigo', 'travel'), '#travel');
});

test('persist/read workflow root', () => {
  const memory = new Map();
  const storage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };

  persistWorkflowRoot('navigo', storage);
  assert.equal(memory.get(WORKFLOW_ROOT_STORAGE_KEY), 'navigo');
  assert.equal(readPersistedWorkflowRoot(storage), 'navigo');
  assert.equal(normalizeWorkflowRoot('oops'), 'compo');
});
