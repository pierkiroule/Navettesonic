const characters = {
  initialized: false,
  lastTime: 0,
};

export function initCharacters() {
  if (characters.initialized) return;
  characters.initialized = true;
  characters.lastTime = performance.now();
}

export function updateCharacters() {
  initCharacters();
  characters.lastTime = performance.now();
}

export function drawCharacters() {
  return;
}

export function getCharacterWorldEffects() {
  return {
    tornado: { active: false, progress: 1, strength: 0, blur: 0, darkness: 0 },
    blur: 0,
    darkness: 0,
  };
}

export function resetCharacters() {
  characters.initialized = false;
  characters.lastTime = 0;
}
