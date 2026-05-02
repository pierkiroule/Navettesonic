import { BubbleView } from './BubbleView';

export function BubbleLayer({ bubbles, onInteract }) {
  return (
    <div>
      {bubbles.map((bubble) => (
        <BubbleView key={bubble.id} bubble={bubble} onInteract={onInteract} />
      ))}
    </div>
  );
}
