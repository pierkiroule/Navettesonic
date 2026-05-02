import { useState } from 'react';

export function useArenaBubbles(initialBubbles = []) {
  const [bubbles, setBubbles] = useState(initialBubbles);

  const createBubble = (bubble) => setBubbles((prev) => [...prev, bubble]);
  const updateBubble = (id, patch) => setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeBubble = (id) => setBubbles((prev) => prev.filter((b) => b.id !== id));

  return { bubbles, createBubble, updateBubble, removeBubble, setBubbles };
}
