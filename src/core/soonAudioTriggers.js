import {
  playBubbleSound,
  stopBubbleSound,
  updateAmbientMix,
} from "./audioEngine.js";
import { getBubbleAudioRadius, sameDepth } from "./geometry.js";

export function updateBubbleAudioTriggers(current, activeBubbleAudioRef) {
  const fish = current.fish;
  const bubbles = current.bubbles || [];

  if (!fish || !bubbles.length) return;

  const activeNow = new Set();

  bubbles.forEach((bubble) => {
    if (!sameDepth(fish, bubble)) return;

    const dx = (bubble.x || 0) - (fish.x || 0);
    const dy = (bubble.y || 0) - (fish.y || 0);
    const d = Math.hypot(dx, dy);

    const triggerRadius = getBubbleAudioRadius(bubble);
    const isNear = d <= triggerRadius;

    if (!isNear) return;

    activeNow.add(bubble.id);

    if (!activeBubbleAudioRef.current.has(bubble.id)) {
      playBubbleSound(bubble);
    }
  });

  activeBubbleAudioRef.current.forEach((bubbleId) => {
    if (!activeNow.has(bubbleId)) {
      stopBubbleSound(bubbleId);
    }
  });

  activeBubbleAudioRef.current = activeNow;

  updateAmbientMix({
    near: activeNow.size > 0,
  });
}
