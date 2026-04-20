import {
  ARENA_RADIUS,
  ESCAPED_FIREFLY_SPEED_MAX,
  ESCAPED_FIREFLY_SPEED_MIN,
  FISH_MAX_SPEED,
  FIREFLY_COLLISION_COOLDOWN_MS,
  FRICTION,
  MOTHER_BUBBLE_RADIUS,
  TRIANGLE_FORMATION_CHANCE,
  TRIANGLE_HIT_COOLDOWN_MS,
  TRIANGLE_MAX_EDGE,
  TRIANGLE_MIN_EDGE,
} from '../config/sceneConfig';

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function isPointInsideTriangle(point, triangleVertices) {
  const [a, b, c] = triangleVertices;

  const area = (p1, p2, p3) =>
    Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);

  const totalArea = area(a, b, c);
  const area1 = area(point, b, c);
  const area2 = area(a, point, c);
  const area3 = area(a, b, point);

  return Math.abs(totalArea - (area1 + area2 + area3)) < 0.6;
}

export class SceneEngine {
  constructor({ onUpdate, bubbles = [], onTriangleHit } = {}) {
    this.animationFrameId = null;
    this.isRunning = false;
    this.onUpdate = onUpdate;
    this.onTriangleHit = onTriangleHit;
    this.bubbles = bubbles;

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
      fireflies: [],
      activeTriangle: null,
      stats: {
        escapedCount: 0,
        formedTriangleCount: 0,
      },
      lastBubbleHitAt: 0,
      lastTriangleHitAt: 0,
    };
  }

  init(container) {
    this.container = container;
    this.resetWorld();
  }

  resetWorld() {
    this.worldState.fish = { x: 0, y: 0, vx: 0, vy: 0 };
    this.worldState.pointer = { x: 0, y: 0 };
    this.worldState.fireflies = [];
    this.worldState.activeTriangle = null;
    this.worldState.stats = {
      escapedCount: 0,
      formedTriangleCount: 0,
    };
    this.worldState.lastBubbleHitAt = 0;
    this.worldState.lastTriangleHitAt = 0;
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

  spawnEscapedFirefly(bubble) {
    const jitter = {
      x: randomInRange(-12, 12),
      y: randomInRange(-12, 12),
    };

    const angle = Math.random() * Math.PI * 2;
    const speed = randomInRange(ESCAPED_FIREFLY_SPEED_MIN, ESCAPED_FIREFLY_SPEED_MAX);

    this.worldState.fireflies.push({
      id: `${bubble.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: bubble.x + jitter.x,
      y: bubble.y + jitter.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      sampleId: bubble.sampleId,
      motherBubbleId: bubble.id,
    });

    if (this.worldState.fireflies.length > 48) {
      this.worldState.fireflies.shift();
    }

    this.worldState.stats.escapedCount += 1;
  }

  maybeFormTriangle() {
    if (this.worldState.activeTriangle || this.worldState.fireflies.length < 3) {
      return;
    }

    if (Math.random() > TRIANGLE_FORMATION_CHANCE) {
      return;
    }

    const selected = [...this.worldState.fireflies]
      .sort(() => Math.random() - 0.5)
      .find((first, _, list) => {
        const second = list.find((node) => node.id !== first.id);
        const third = list.find((node) => node.id !== first.id && node.id !== second?.id);

        if (!second || !third) {
          return false;
        }

        const d1 = Math.hypot(first.x - second.x, first.y - second.y);
        const d2 = Math.hypot(second.x - third.x, second.y - third.y);
        const d3 = Math.hypot(third.x - first.x, third.y - first.y);
        return [d1, d2, d3].every((distance) => distance >= TRIANGLE_MIN_EDGE && distance <= TRIANGLE_MAX_EDGE);
      });

    if (!selected) {
      return;
    }

    const triangleFireflies = [selected];

    for (const candidate of this.worldState.fireflies) {
      if (triangleFireflies.length >= 3) {
        break;
      }
      if (!triangleFireflies.some((node) => node.id === candidate.id)) {
        triangleFireflies.push(candidate);
      }
    }

    if (triangleFireflies.length !== 3) {
      return;
    }

    this.worldState.activeTriangle = {
      id: `triangle-${Date.now()}`,
      fireflies: triangleFireflies.map((firefly) => ({
        id: firefly.id,
        x: firefly.x,
        y: firefly.y,
        sampleId: firefly.sampleId,
      })),
      sampleSequence: triangleFireflies.map((firefly) => firefly.sampleId),
    };
    this.worldState.stats.formedTriangleCount += 1;
  }

  resolveBubbleCollision(nowMs) {
    if (nowMs - this.worldState.lastBubbleHitAt < FIREFLY_COLLISION_COOLDOWN_MS) {
      return;
    }

    const fish = this.worldState.fish;
    const hitBubble = this.bubbles.find((bubble) => Math.hypot(fish.x - bubble.x, fish.y - bubble.y) <= MOTHER_BUBBLE_RADIUS);

    if (!hitBubble) {
      return;
    }

    this.worldState.lastBubbleHitAt = nowMs;
    this.spawnEscapedFirefly(hitBubble);
    this.maybeFormTriangle();
  }

  resolveTriangleCollision(nowMs) {
    if (!this.worldState.activeTriangle) {
      return;
    }

    if (nowMs - this.worldState.lastTriangleHitAt < TRIANGLE_HIT_COOLDOWN_MS) {
      return;
    }

    const fishPoint = { x: this.worldState.fish.x, y: this.worldState.fish.y };
    const triangleVertices = this.worldState.activeTriangle.fireflies;

    if (!isPointInsideTriangle(fishPoint, triangleVertices)) {
      return;
    }

    this.worldState.lastTriangleHitAt = nowMs;

    if (typeof this.onTriangleHit === 'function') {
      this.onTriangleHit(this.worldState.activeTriangle.sampleSequence);
    }

    this.worldState.activeTriangle = null;
  }

  updateFireflies() {
    this.worldState.fireflies.forEach((firefly) => {
      firefly.x += firefly.vx;
      firefly.y += firefly.vy;
      firefly.vx *= 0.994;
      firefly.vy *= 0.994;

      const distanceFromCenter = Math.hypot(firefly.x, firefly.y);
      if (distanceFromCenter > ARENA_RADIUS) {
        const clamp = ARENA_RADIUS / distanceFromCenter;
        firefly.x *= clamp;
        firefly.y *= clamp;
        firefly.vx *= -0.35;
        firefly.vy *= -0.35;
      }
    });
  }

  update() {
    const nowMs = Date.now();
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

    this.resolveBubbleCollision(nowMs);
    this.resolveTriangleCollision(nowMs);
    this.updateFireflies();
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
    this.onTriangleHit = null;
  }
}
