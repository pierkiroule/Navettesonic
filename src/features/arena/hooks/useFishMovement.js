import { useMemo, useState } from 'react';

export function useFishMovement() {
  const [fish, setFish] = useState({ x: 0, y: 0 });

  const moveFish = (x, y) => setFish({ x, y });

  const style = useMemo(() => ({ left: `calc(50% + ${fish.x}px)`, top: `calc(50% + ${fish.y}px)` }), [fish]);

  return { fish, moveFish, fishStyle: style };
}
