const STORAGE_KEY = "soon.clean.local.v1";

export function saveState(state) {
  const data = {
    mode: state.mode,
    bubbles: state.bubbles,
    fish: state.fish,
    path: state.path,
    currentArenaId: state.currentArenaId,
    labybulleSeed: state.labybulleSeed,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
