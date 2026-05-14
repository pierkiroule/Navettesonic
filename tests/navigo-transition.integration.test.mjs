import test from 'node:test';
import assert from 'node:assert/strict';

function createNavigoSharedState() {
  return {
    tab: 'trace',
    path: [],
    execution: { isPlaying: false },
    metadata: { depthMarkers: [], exportStatus: '', exportUrl: null },
  };
}

function switchTab(state, tab) {
  state.tab = tab;
  state.execution.isPlaying = false;
}

test('transition Tracer -> Traverser conserve path, statut et métadonnées', () => {
  const state = createNavigoSharedState();

  state.path.push({ x: 1, y: 1 }, { x: 2, y: 2 });
  state.metadata.depthMarkers.push({ x: 2, y: 2, depth: 2 });
  state.metadata.exportStatus = 'ready';

  switchTab(state, 'travel');

  assert.equal(state.tab, 'travel');
  assert.equal(state.path.length, 2);
  assert.equal(state.metadata.depthMarkers.length, 1);
  assert.equal(state.metadata.exportStatus, 'ready');
  assert.equal(state.execution.isPlaying, false);
});
