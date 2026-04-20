import { useEffect, useMemo, useRef, useState } from 'react';
import { HOME_CONTENT } from '../model/homeModel';

export function useHomePresenter({ onEnterExperience }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      if (gainRef.current) {
        gainRef.current.disconnect();
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const ensureAudioReady = async () => {
    if (audioContextRef.current && oscillatorRef.current && gainRef.current) {
      return;
    }

    const ContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new ContextClass();
    const gain = audioContext.createGain();
    const oscillator = audioContext.createOscillator();

    oscillator.type = 'sine';
    oscillator.frequency.value = 196;
    gain.gain.value = 0;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();

    audioContextRef.current = audioContext;
    oscillatorRef.current = oscillator;
    gainRef.current = gain;
  };

  const onToggleSound = async () => {
    await ensureAudioReady();

    if (!audioContextRef.current || !gainRef.current) {
      return;
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const now = audioContextRef.current.currentTime;
    const nextEnabled = !isSoundEnabled;
    gainRef.current.gain.cancelScheduledValues(now);

    if (nextEnabled) {
      gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
      gainRef.current.gain.linearRampToValueAtTime(0.03, now + 0.12);
    } else {
      gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
      gainRef.current.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    }

    setIsSoundEnabled(nextEnabled);
  };

  const content = useMemo(
    () => ({
      ...HOME_CONTENT,
      audioButtonLabel: isSoundEnabled ? HOME_CONTENT.audioButtonLabelOn : HOME_CONTENT.audioButtonLabelOff,
      soundStatus: isSoundEnabled ? 'Ambiance active' : 'Ambiance coupée',
    }),
    [isSoundEnabled],
  );

  return {
    content,
    onEnterExperience,
    onToggleSound,
  };
}
