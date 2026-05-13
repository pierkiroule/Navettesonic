import {
  createStarTornado,
  drawStarTornado,
  updateStarTornado,
  getStarTornadoWaveRadius,
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
  lastPinkSpawnAt: 0,
  tornado: null,
  pinkFish: [],
  lucioleSeeds: [],
  externalSeedStock: null,
  lastWaveBurstAt: 0,
  pendingSeedDeliveries: 0,
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
  characters.pendingSeedDeliveries = 0;
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
  if (
    waveRadius !== null &&
    characters.tornado.waveStartedAt !== characters.lastWaveBurstAt
  ) {
    characters.lastWaveBurstAt = characters.tornado.waveStartedAt;

    characters.lucioleSeeds.length = 0;

    characters.pinkFish.forEach((pink) => {
      const dx = pink.x - characters.tornado.x;
      const dy = pink.y - characters.tornado.y;
      const d = Math.hypot(dx, dy) || 1;
      const nx = dx / d;
      const ny = dy / d;

      pink.state = "exiting";
      pink.targetX = nx * (arenaRadius + 420);
      pink.targetY = ny * (arenaRadius + 420);
      pink.vx = nx * 2.4;
      pink.vy = ny * 2.4;
    });
  }

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
  const freeFireflies = getUncollectedFireflyCount();
  const shouldRestock = freeFireflies >= 1 && freeFireflies <= 2;

  if (!shouldRestock) {
    characters.pendingSeedDeliveries = 0;
  } else if (characters.pendingSeedDeliveries <= 0 && canSpawn) {
    const seedBatch = 1 + Math.floor(Math.random() * 3);
    characters.pendingSeedDeliveries = Math.min(seedBatch, stock.remaining);
  }

  if (
    canSpawn &&
    characters.pendingSeedDeliveries > 0 &&
    now - characters.lastPinkSpawnAt > 1900 &&
    characters.pinkFish.length < 16
  ) {
    characters.lastPinkSpawnAt = now;
    characters.pinkFish.push(spawnPinkWallFish(arenaRadius, stock));
    characters.pendingSeedDeliveries -= 1;
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

export function getCharacterSnapshot(time = performance.now()) {
  const tornado = characters.tornado;
  return {
    tornado: tornado
      ? {
          x: tornado.x,
          y: tornado.y,
          r: tornado.r,
          state: tornado.state,
          waveStartedAt: tornado.waveStartedAt || 0,
          waveRadius: getStarTornadoWaveRadius(tornado, time),
        }
      : null,
  };
}

export function resetCharacters() {
  characters.initialized = false;
  characters.tornado = null;
  characters.pinkFish = [];
  characters.lucioleSeeds = [];
  characters.externalSeedStock = null;
  characters.lastPinkSpawnAt = 0;
  characters.lastWaveBurstAt = 0;
  characters.pendingSeedDeliveries = 0;
}
