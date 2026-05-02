import { usePublishedArena } from '../hooks/usePublishedArena';
import { useRoomParam } from '../hooks/useRoomParam';
import { arenaDomainService } from '../services/arenaDomainService';

export function ArenaVisitorPage() {
  const roomCode = useRoomParam();
  const { isLoading, arena, bubbles, error } = usePublishedArena(roomCode);

  if (!roomCode) return <p>Code room manquant.</p>;
  if (isLoading) return <p>Chargement de l’arène…</p>;
  if (error) return <p>Erreur: {error}</p>;

  const policy = arenaDomainService.getScreenPolicy({
    status: arena?.status,
    actorRole: arenaDomainService.ACTOR_ROLES.VISITOR,
  });

  if (!policy.canRead) {
    return <p>Cette arène n’est pas disponible pour les visiteurs.</p>;
  }

  return (
    <section>
      <h1>{arena?.title || 'Arena visiteur'}</h1>
      <p>Mode lecture seule — toute action d’édition est bloquée pour les visiteurs.</p>
      <p>Actions autorisées : {policy.allowedActions.join(', ')}</p>
      <ul>
        {bubbles.map((bubble) => (
          <li key={bubble.id}>{bubble.label} ({Math.round(bubble.x)}, {Math.round(bubble.y)})</li>
        ))}
      </ul>
    </section>
  );
}
