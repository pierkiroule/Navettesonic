import { ARENA_RADIUS, FISH_MAX_SPEED, FRICTION } from '../config/sceneConfig';

export class SceneEngine {
  constructor({ onUpdate } = {}) {
    this.animationFrameId = null;
    this.isRunning = false;
    this.onUpdate = onUpdate;
    this.worldState = {
      fish: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      },
      pointer: {
        x: 0,
        y: 0,
      },
    };
  }

  init(container) {
    this.container = container;
    this.resetWorld();
  }

  resetWorld() {
    this.worldState.fish = { x: 0, y: 0, vx: 0, vy: 0 };
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.loop();
  }

  pause() {
    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume() {
    this.start();
  }

  setPointer(pointer) {
    this.worldState.pointer = pointer;
  }

  update() {
    const { fish, pointer } = this.worldState;
    const dx = pointer.x - fish.x;
    const dy = pointer.y - fish.y;

    fish.vx += dx * 0.002;
    fish.vy += dy * 0.002;

    fish.vx = Math.max(-FISH_MAX_SPEED, Math.min(FISH_MAX_SPEED, fish.vx));
    fish.vy = Math.max(-FISH_MAX_SPEED, Math.min(FISH_MAX_SPEED, fish.vy));

    fish.vx *= FRICTION;
    fish.vy *= FRICTION;

    fish.x += fish.vx;
    fish.y += fish.vy;

    const distance = Math.hypot(fish.x, fish.y);
    if (distance > ARENA_RADIUS) {
      const clamp = ARENA_RADIUS / distance;
      fish.x *= clamp;
      fish.y *= clamp;
      fish.vx *= 0.7;
      fish.vy *= 0.7;
    }
  }

  draw() {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.worldState);
    }
  }

  loop = () => {
    if (!this.isRunning) {
      return;
    }

    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  destroy() {
    this.pause();
    this.container = null;
    this.onUpdate = null;
  }
}
