export function FishController({ bubble, onMove }) {
  const nudge = (axis, delta) => {
    onMove?.(bubble.id, { [axis]: Math.max(0, Math.min(100, bubble[axis] + delta)) });
  };

  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      <button type="button" onClick={() => nudge('x', -2)}>◀</button>
      <button type="button" onClick={() => nudge('y', -2)}>▲</button>
      <button type="button" onClick={() => nudge('y', 2)}>▼</button>
      <button type="button" onClick={() => nudge('x', 2)}>▶</button>
    </div>
  );
}
