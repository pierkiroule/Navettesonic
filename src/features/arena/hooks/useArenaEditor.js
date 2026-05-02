import { useCallback, useMemo, useState } from 'react';

const createBubble = (overrides = {}) => ({
  id: crypto.randomUUID(),
  label: 'Nouvelle bulle',
  x: 50,
  y: 50,
  size: 80,
  ...overrides,
});

export function useArenaEditor(initialBubbles = []) {
  const [bubbles, setBubbles] = useState(initialBubbles);

  const addBubble = useCallback((bubblePatch = {}) => {
    const bubble = createBubble(bubblePatch);
    setBubbles((prev) => [...prev, bubble]);
    return bubble;
  }, []);

  const updateBubble = useCallback((bubbleId, patch) => {
    setBubbles((prev) => prev.map((bubble) => (bubble.id === bubbleId ? { ...bubble, ...patch } : bubble)));
  }, []);

  const removeBubble = useCallback((bubbleId) => {
    setBubbles((prev) => prev.filter((bubble) => bubble.id !== bubbleId));
  }, []);

  const clearBubbles = useCallback(() => {
    setBubbles([]);
  }, []);

  return useMemo(() => ({ bubbles, addBubble, updateBubble, removeBubble, clearBubbles }), [bubbles, addBubble, updateBubble, removeBubble, clearBubbles]);
}
