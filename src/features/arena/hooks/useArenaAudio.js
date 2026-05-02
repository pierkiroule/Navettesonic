import { useRef } from 'react';

export function useArenaAudio() {
  const contextRef = useRef(null);

  const ensureAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!contextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      contextRef.current = Ctx ? new Ctx() : null;
    }
    return contextRef.current;
  };

  const playBubbleTone = async (frequency = 220) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  };

  return { playBubbleTone };
}
