import {
  createStarTornado,
  drawStarTornado,
  updateStarTornado,
} from "./starTornado.js";
import {
  drawPinkWallFish,
  spawnPinkWallFish,
  updatePinkWallFish,
} from "./pinkWallFish.js";
import {
  createExternalSeedStock,
  drawLucioleSeeds,
  updateLucioleSeeds,
} from "../lucioles/lucioleSeeds.js";
import {
  getTornadoEffectState,
  getWorldBlur,
  getWorldDarkness,
} from "./worldEffects.js";

const characters = {
  initialized: false,
  lastTime: 0,
  lastPinkSpawnAt: 0,
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
    r: 54,
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
    dt
  );

  updatePinkWallFish({
    fishes: characters.pinkFish,
    seeds: characters.lucioleSeeds,
    stock: characters.externalSeedStock,
    mainFish: fish,
    arenaRadius,
    dt,
  });

  const stock = characters.externalSeedStock;
  const canSpawn = stock && stock.remaining > 0;

  if (
    canSpawn &&
    now - characters.lastPinkSpawnAt > 1900 &&
    characters.pinkFish.length < 16
  ) {
    characters.lastPinkSpawnAt = now;
    characters.pinkFish.push(spawnPinkWallFish(arenaRadius, stock));
  }
}

export function drawCharacters(ctx, time = performance.now()) {
  if (!characters.initialized) return;

  drawLucioleSeeds(ctx, characters.lucioleSeeds, time);
  drawStarTornado(ctx, characters.tornado, time);
  drawPinkWallFish(ctx, characters.pinkFish, characters.externalSeedStock, time);
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
  characters.lastPinkSpawnAt = 0;
}
