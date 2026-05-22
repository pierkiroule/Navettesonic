import {
  createStarTornado,
  drawStarTornado,
  updateStarTornado,
} from "./starTornado.js";
import {
  getTornadoEffectState,
  getWorldBlur,
  getWorldDarkness,
} from "./worldEffects.js";

const characters = {
  initialized: false,
  lastTime: 0,
  tornado: null,
};

export function initCharacters(arenaRadius = 1200) {
  if (characters.initialized) return;

  characters.initialized = true;
  characters.lastTime = performance.now();

  characters.tornado = createStarTornado({
    x: arenaRadius * 0.22,
    y: -arenaRadius * 0.16,
    r: 38,
  });

}

export function updateCharacters({ fish, arenaRadius = 1200 } = {}) {
  initCharacters(arenaRadius);

  const now = performance.now();
  const dt = Math.min(34, now - (characters.lastTime || now));
  characters.lastTime = now;

  updateStarTornado(characters.tornado, fish, dt, arenaRadius);

}

export function drawCharacters(ctx, time = performance.now()) {
  if (!characters.initialized) return;

  drawStarTornado(ctx, characters.tornado, time);
}

export function getCharacterWorldEffects(time = performance.now()) {
  const tornado = getTornadoEffectState(time);

  return {
    tornado,
    blur: getWorldBlur(time),
    darkness: getWorldDarkness(time),
  };
}

export function resetCharacters() {
  characters.initialized = false;
  characters.tornado = null;
}
