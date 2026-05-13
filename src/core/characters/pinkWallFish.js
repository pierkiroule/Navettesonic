import {
  createLucioleSeed,
  takeSeedFromExternalStock,
} from "../lucioles/lucioleSeeds.js";

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function spawnPinkWallFish(arenaRadius = 1200, stock = null) {
  const angle = rand(0, Math.PI * 2);
  const startR = arenaRadius + rand(180, 520);
  const targetAngle = angle + rand(-1.2, 1.2);
  const targetR = rand(arenaRadius * 0.18, arenaRadius * 0.78);

  const carryingSeed = takeSeedFromExternalStock(stock);

  return {
    id: makeId("pink-wall-fish"),
    x: Math.cos(angle) * startR,
    y: Math.sin(angle) * startR,

    targetX: Math.cos(targetAngle) * targetR,
    targetY: Math.sin(targetAngle) * targetR,

    vx: 0,
    vy: 0,

    size: rand(0.78, 1.08),
    phase: rand(0, Math.PI * 2),

    state: "entering", // entering | depositing | following | exiting
    carryingSeed,
    deposited: false,

    depositStartedAt: 0,
    followStartedAt: 0,
    followDuration: 5000,
    willFollow: Math.random() < 0.32,

    life: 0,
  };
}

function chooseExitTarget(fish, arenaRadius) {
  const angle = Math.atan2(fish.y, fish.x) + rand(-0.65, 0.65);

  fish.targetX = Math.cos(angle) * (arenaRadius + rand(260, 520));
  fish.targetY = Math.sin(angle) * (arenaRadius + rand(260, 520));
}

function steerToTarget(fish, tx, ty, dt, force = 0.024) {
  const dx = tx - fish.x;
  const dy = ty - fish.y;
  const d = Math.hypot(dx, dy) || 1;

  fish.vx += (dx / d) * force * dt;
  fish.vy += (dy / d) * force * dt;

  return d;
}

function steerNearPoissonPlume(fish, mainFish, dt) {
  if (!mainFish) return;

  const angle = (mainFish.angle || -Math.PI / 2) + Math.PI;
  const orbit = fish.phase;

  const targetX =
    (mainFish.x || 0) +
    Math.cos(angle + orbit * 0.22) * 42 +
    Math.sin(performance.now() * 0.003 + fish.phase) * 22;

  const targetY =
    (mainFish.y || 0) +
    Math.sin(angle + orbit * 0.22) * 42 +
    Math.cos(performance.now() * 0.002 + fish.phase) * 22;

  steerToTarget(fish, targetX, targetY, dt, 0.018);
}

export function updatePinkWallFish({
  fishes,
  seeds,
  stock,
  mainFish,
  arenaRadius = 1200,
  dt = 16,
}) {
  const now = performance.now();

  for (let i = fishes.length - 1; i >= 0; i -= 1) {
    const fish = fishes[i];

    fish.life += dt;

    if (fish.state === "entering") {
      const d = steerToTarget(fish, fish.targetX, fish.targetY, dt, 0.018);

      if (d < 46 && !fish.deposited) {
        fish.state = "depositing";
        fish.depositStartedAt = now;
        fish.vx *= 0.35;
        fish.vy *= 0.35;
      }
    }

    if (fish.state === "depositing") {
      fish.vx *= 0.9;
      fish.vy *= 0.9;

      if (now - fish.depositStartedAt > 520) {
        fish.deposited = true;

        if (fish.carryingSeed) {
          seeds.push(createLucioleSeed(fish.x, fish.y, fish.id));
          stock.delivered += 1;
        }

        fish.carryingSeed = false;

        if (fish.willFollow && mainFish) {
          fish.state = "following";
          fish.followStartedAt = now;
        } else {
          fish.state = "exiting";
          chooseExitTarget(fish, arenaRadius);
        }
      }
    }

    if (fish.state === "following") {
      steerNearPoissonPlume(fish, mainFish, dt);

      if (now - fish.followStartedAt > fish.followDuration) {
        fish.state = "exiting";
        chooseExitTarget(fish, arenaRadius);
      }
    }

    if (fish.state === "exiting") {
      const d = steerToTarget(fish, fish.targetX, fish.targetY, dt, 0.018);

      if (d < 90 || fish.life > 32000) {
        fishes.splice(i, 1);
        continue;
      }
    }

    fish.vx *= 0.94;
    fish.vy *= 0.94;

    const speed = Math.hypot(fish.vx, fish.vy) || 1;
    const maxSpeed = fish.state === "following" ? 1.6 : 1.15;

    if (speed > maxSpeed) {
      fish.vx = (fish.vx / speed) * maxSpeed;
      fish.vy = (fish.vy / speed) * maxSpeed;
    }

    fish.x += fish.vx;
    fish.y += fish.vy;
  }
}

function drawCarriedSeed(ctx, fish, time) {
  if (!fish.carryingSeed) return;

  const pulse = Math.sin(time * 0.009 + fish.phase) * 0.5 + 0.5;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  ctx.strokeStyle = `rgba(255, 220, 170, ${0.22 + pulse * 0.14})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, -3);
  ctx.quadraticCurveTo(-2, -10, -7, -7);
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 245, 170, ${0.82 + pulse * 0.12})`;
  ctx.beginPath();
  ctx.arc(-7, -7, 2.7 + pulse * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 245, 170, ${0.25 + pulse * 0.12})`;
  ctx.beginPath();
  ctx.arc(-7, -7, 7 + pulse * 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawTinyFish(ctx, fish, time) {
  const angle = Math.atan2(fish.vy, fish.vx || 0.001);
  const speed = Math.hypot(fish.vx, fish.vy);
  const s = fish.size || 0.5;
  const wiggle = Math.sin(time * 0.008 + fish.phase) * (0.25 + speed * 0.02);

  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.rotate(angle);
  ctx.scale(s, s);

  const alpha = fish.state === "following" ? 0.94 : 0.76;

  const body = ctx.createLinearGradient(-18, 0, 18, 0);
  body.addColorStop(0, `rgba(251, 207, 232, ${0.2 * alpha})`);
  body.addColorStop(0.45, `rgba(244, 114, 182, ${0.86 * alpha})`);
  body.addColorStop(1, `rgba(255, 228, 230, ${0.74 * alpha})`);

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.quadraticCurveTo(-7, -6.8, 7, -5.4);
  ctx.quadraticCurveTo(16, -1.8, 13.5, 1.2);
  ctx.quadraticCurveTo(8.2, 6.8, -6, 5.8);
  ctx.quadraticCurveTo(-14, 4.2, -15, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(13.2, -1.2);
  ctx.lineTo(18.8, 0);
  ctx.lineTo(13.2, 1.2);
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 241, 245, ${0.86 * alpha})`;
  ctx.fill();

  ctx.save();
  ctx.translate(-14.4, 0);
  ctx.rotate(wiggle * 1.2);
  ctx.beginPath();
  ctx.moveTo(-1, 0);
  ctx.quadraticCurveTo(-9, -8, -15.5, -4.4);
  ctx.quadraticCurveTo(-11.5, 0, -15.5, 4.4);
  ctx.quadraticCurveTo(-9, 8, -1, 0);
  ctx.closePath();
  ctx.fillStyle = `rgba(251, 113, 133, ${0.42 * alpha})`;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = `rgba(255, 228, 230, ${0.35 * alpha})`;
  ctx.beginPath();
  ctx.ellipse(2.5, -2.6, 5.8, 1.3, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(20, 10, 20, ${0.55 * alpha})`;
  ctx.beginPath();
  ctx.arc(10.2, -1.4, 1.2, 0, Math.PI * 2);
  ctx.fill();

  drawCarriedSeed(ctx, fish, time);

  if (fish.state === "depositing") {
    const pulse = Math.sin(time * 0.016) * 0.5 + 0.5;
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(255, 245, 180, ${0.28 + pulse * 0.18})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 24 + pulse * 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (fish.state === "following") {
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(244, 114, 182, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawPinkWallFish(ctx, fishes, stock, time = performance.now()) {
  ctx.save();

  fishes.forEach((fish) => drawTinyFish(ctx, fish, time));

  ctx.restore();
}
