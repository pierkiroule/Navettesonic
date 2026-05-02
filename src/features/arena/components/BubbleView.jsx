export function BubbleView({ bubble, onInteract }) {
  return (
    <button
      type="button"
      onClick={() => onInteract?.(bubble)}
      className="bubble-view"
      style={{ position: 'absolute', left: `calc(50% + ${bubble.x}px)`, top: `calc(50% + ${bubble.y}px)` }}
    >
      {bubble.label}
    </button>
  );
}
