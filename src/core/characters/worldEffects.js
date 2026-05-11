const worldEffects = {
  blurUntil: 0,
  blurStartedAt: 0,
  duration: 5000,
};

export function triggerDarkWaveEffect(duration = 5000) {
  const now = performance.now();

  worldEffects.duration = duration;
  worldEffects.blurStartedAt = now;
  worldEffects.blurUntil = now + duration;
}

export function getTornadoEffectState(time = performance.now()) {
  const active = time < worldEffects.blurUntil;

  if (!active) {
    return {
      active: false,
      progress: 1,
      strength: 0,
      blur: 0,
      darkness: 0,
    };
  }

  const elapsed = time - worldEffects.blurStartedAt;
  const progress = Math.min(1, elapsed / worldEffects.duration);

  const fadeIn = Math.min(1, progress / 0.22);
  const fadeOut = Math.min(1, (1 - progress) / 0.35);
  const strength = Math.max(0, Math.min(1, fadeIn * fadeOut));

  return {
    active: true,
    progress,
    strength,
    blur: 28 * strength,
    darkness: 0,
  };
}

export function getWorldBlur(time = performance.now()) {
  return getTornadoEffectState(time).blur;
}

export function getWorldDarkness() {
  return 0;
}
