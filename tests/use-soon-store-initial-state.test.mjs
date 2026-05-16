import test from 'node:test';
import assert from 'node:assert/strict';

test('useSoonStore hydrates fishTrail from persisted state', async () => {
  const persistedFishTrail = [
    { x: 10, y: 20 },
    { x: 12, y: 24 },
  ];

  global.localStorage = {
    _data: {
      'soon.clean.local.v1': JSON.stringify({
        fishTrail: persistedFishTrail,
      }),
    },
    getItem(key) {
      return this._data[key] ?? null;
    },
    setItem(key, value) {
      this._data[key] = String(value);
    },
    removeItem(key) {
      delete this._data[key];
    },
  };

  const modulePath = new URL(`../src/store/useSoonStore.js?test=${Date.now()}`, import.meta.url).href;
  const { useSoonStore } = await import(modulePath);
  const state = useSoonStore.getState();

  assert.deepEqual(state.fishTrail, persistedFishTrail);
});
