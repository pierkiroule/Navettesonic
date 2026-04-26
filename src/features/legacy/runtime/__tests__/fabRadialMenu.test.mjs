import test from 'node:test';
import assert from 'node:assert/strict';
import { initFabRadialMenu } from '../fabRadialMenu.js';

class MockClassList {
  constructor() { this.set = new Set(); }
  toggle(name, force) { if (force === undefined ? !this.set.has(name) : force) this.set.add(name); else this.set.delete(name); }
  add(name) { this.set.add(name); }
  remove(name) { this.set.delete(name); }
  contains(name) { return this.set.has(name); }
}
class MockElement {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.listeners = {};
    this.attrs = new Map();
    this.classList = new MockClassList();
    this.style = { setProperty() {} };
    this.textContent = '';
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  click() { (this.listeners.click || []).forEach((fn) => fn({})); }
  dispatch(type, event = {}) { (this.listeners[type] || []).forEach((fn) => fn(event)); }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  removeAttribute(name) { this.attrs.delete(name); }
  getBoundingClientRect() { return { left: 100, top: 100, width: 64, height: 64 }; }
}

function setupGlobals() {
  Object.defineProperty(globalThis, 'navigator', { value: { vibrate() {} }, configurable: true });
  global.localStorage = { store: new Map(), getItem(k){return this.store.get(k) ?? null;}, setItem(k,v){this.store.set(k,v);}, clear(){this.store.clear();} };
  global.history = { pushState() {} };
  global.window = {
    innerWidth: 390,
    innerHeight: 844,
    setTimeout,
    clearTimeout,
    addEventListener() {},
    removeEventListener() {},
  };
}

function makeMenu(onAction = async () => {}) {
  setupGlobals();
  const root = new MockElement();
  const fab = new MockElement();
  const backdrop = new MockElement();
  const action = new MockElement({ action: 'home' });
  const more = new MockElement({ action: 'more' });
  const sheet = new MockElement();
  const close = new MockElement();
  const moreAction = new MockElement({ action: 'record' });
  const status = new MockElement();

  const api = initFabRadialMenu({
    root,
    fabButton: fab,
    backdrop,
    actionButtons: [action],
    moreButton: more,
    moreSheet: sheet,
    moreCloseButton: close,
    moreActionButtons: [moreAction],
    statusNode: status,
    onAction,
  });

  return { api, fab, backdrop, action, status };
}

test('open/close on fab tap', () => {
  const { api, fab } = makeMenu();
  fab.click();
  assert.equal(api.isOpen(), true);
  fab.click();
  assert.equal(api.isOpen(), false);
});

test('close on outside tap', () => {
  const { api, fab, backdrop } = makeMenu();
  fab.click();
  backdrop.click();
  assert.equal(api.isOpen(), false);
});

test('action callback is called and status updates', async () => {
  let called = '';
  const { api, fab, action, status } = makeMenu(async (id) => { called = id; });
  fab.click();
  action.click();
  await Promise.resolve();
  assert.equal(called, 'home');
  assert.equal(api.isOpen(), false);
  assert.equal(status.textContent, 'Action appliquée');
});

test('accessibility defaults', () => {
  const { fab, status } = makeMenu();
  assert.equal(fab.getAttribute('aria-expanded'), 'false');
  assert.equal(status.textContent, 'Prêt');
});
