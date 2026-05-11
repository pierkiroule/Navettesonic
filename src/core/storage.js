const STORAGE_KEY = "soon.clean.local.v1";

function compactFishForSave(fish = {}) {
  return {
    x: fish.x || 0,
    y: fish.y || 0,
    vx: fish.vx || 0,
    vy: fish.vy || 0,
    targetX: fish.targetX || 0,
    targetY: fish.targetY || 0,
    angle: Number.isFinite(fish.angle) ? fish.angle : -Math.PI / 2,
    swimPhase: fish.swimPhase || 0,
    maxTrail: fish.maxTrail || 90,
    maxSpeed: fish.maxSpeed || 3.1,
    depth: fish.depth || 1,
    mouthPull: fish.mouthPull || 0,
    turnAmount: fish.turnAmount || 0,
  };
}

export function saveState(state) {
  const data = {
    mode: state.mode,
    bubbles: state.bubbles,
    fish: compactFishForSave(state.fish),
    path: state.path,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / privacy mode write errors.
  }
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
