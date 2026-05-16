import {
  createStarTornado,
  drawStarTornado,
  updateStarTornado,
  getStarTornadoWaveRadius,
} from "./starTornado.js";
import {
  createExternalSeedStock,
  drawLucioleSeeds,
  updateLucioleSeeds,
} from "../lucioles/lucioleSeeds.js";
import {
  getUncollectedFireflyCount,
  spawnFireflyFromSeed,
} from "../fireflyGame.js";
import {
  getTornadoEffectState,
  getWorldBlur,
  getWorldDarkness,
} from "./worldEffects.js";

const characters = {
  initialized: false,
  lastTime: 0,
  tornado: null,
  pinkFish: [],
  lucioleSeeds: [],
  externalSeedStock: null,
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

  characters.pinkFish = [];
  characters.lucioleSeeds = [];
  characters.externalSeedStock = createExternalSeedStock(120);
}

export function updateCharacters({ fish, arenaRadius = 1200 } = {}) {
  initCharacters(arenaRadius);

  const now = performance.now();
  const dt = Math.min(34, now - (characters.lastTime || now));
  characters.lastTime = now;

  updateStarTornado(characters.tornado, fish, dt, arenaRadius);

  updateLucioleSeeds(
    characters.lucioleSeeds,
    characters.externalSeedStock,
    dt,
    (seed) => {
      spawnFireflyFromSeed(seed.x, seed.y);
    }
  );

  const waveRadius = getStarTornadoWaveRadius(characters.tornado, now);
  if (waveRadius !== null) {
    characters.lucioleSeeds.length = 0;
  }

  const stock = characters.externalSeedStock;
  if (stock && stock.remaining <= 0 && getUncollectedFireflyCount() <= 2) {
    stock.remaining = 12;
  }

}

export function drawCharacters(ctx, time = performance.now()) {
  if (!characters.initialized) return;

  drawLucioleSeeds(ctx, characters.lucioleSeeds, time);
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
  characters.pinkFish = [];
  characters.lucioleSeeds = [];
  characters.externalSeedStock = null;
}
