import { usePublishedArena } from '../hooks/usePublishedArena';
import { useRoomParam } from '../hooks/useRoomParam';

export function ArenaVisitorPage() {
  const roomCode = useRoomParam();
  const { isLoading, arena, bubbles, error } = usePublishedArena(roomCode);

  if (!roomCode) return <p>Code room manquant.</p>;
  if (isLoading) return <p>Chargement de l’arène…</p>;
  if (error) return <p>Erreur: {error}</p>;

  return (
    <section>
      <h1>{arena?.title || 'Arena visiteur'}</h1>
      <p>Mode lecture seule</p>
      <ul>
        {bubbles.map((bubble) => (
          <li key={bubble.id}>{bubble.label} ({Math.round(bubble.x)}, {Math.round(bubble.y)})</li>
        ))}
      </ul>
    </section>
  );
}
