import { ArenaPublishPanel } from '../components/ArenaPublishPanel';
import { FishController } from '../components/FishController';
import { useArenaEditor } from '../hooks/useArenaEditor';
import { arenaDomainService } from '../services/arenaDomainService';

export function ArenaEditorPage() {
  const { bubbles, addBubble, updateBubble, removeBubble } = useArenaEditor();
  const status = arenaDomainService.ARENA_STATUSES.DRAFT;
  const actorRole = arenaDomainService.ACTOR_ROLES.OWNER;

  return (
    <section>
      <h1>Arena Editor (hôte)</h1>
      <button type="button" onClick={() => addBubble()}>Ajouter une bulle</button>
      <ArenaPublishPanel roomCode="preview" status={status} actorRole={actorRole} />
      <ul>
        {bubbles.map((bubble) => (
          <li key={bubble.id}>
            <strong>{bubble.label}</strong> ({Math.round(bubble.x)}, {Math.round(bubble.y)})
            <FishController bubble={bubble} onMove={updateBubble} />
            <button type="button" onClick={() => removeBubble(bubble.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
