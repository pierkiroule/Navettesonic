import { useArenaAudio } from '../hooks/useArenaAudio';
import { useFishMovement } from '../hooks/useFishMovement';
import { BubbleLayer } from './BubbleLayer';
import { FishPlume } from './FishPlume';

export function ArenaScene({ bubbles, readonly = false }) {
  const { fish, moveFish } = useFishMovement();
  const { playBubbleTone } = useArenaAudio();

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    moveFish(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
  };

  return (
    <section className="soon-card arena-scene" onPointerMove={handleMove}>
      <FishPlume fish={fish} />
      <BubbleLayer bubbles={bubbles} onInteract={(bubble) => !readonly && playBubbleTone(200 + (bubble.x % 180))} />
    </section>
  );
}
