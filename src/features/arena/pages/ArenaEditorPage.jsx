import { ArenaPublishPanel } from '../components/ArenaPublishPanel';
import { FishController } from '../components/FishController';
import { useArenaEditor } from '../hooks/useArenaEditor';
import { arenaDomainService } from '../services/arenaDomainService';
import { shellStyles } from '../ui/shellMockups';

export function ArenaEditorPage() {
  const { bubbles, addBubble, updateBubble, removeBubble } = useArenaEditor();
  const status = arenaDomainService.ARENA_STATUSES.DRAFT;
  const actorRole = arenaDomainService.ACTOR_ROLES.OWNER;

  return (
    <section style={shellStyles.layout}>
      <header style={shellStyles.header}>
        <strong>Shell hôte</strong>
        <button type="button" onClick={() => addBubble()}>Ajouter une bulle</button>
      </header>

      <div style={shellStyles.bodyHost}>
        <article style={shellStyles.canvas}>
          <h1 style={{ marginTop: 0 }}>Canvas édition</h1>
          <p>Zone immersive de création avec interactions riches.</p>
          <ul>
            {bubbles.map((bubble) => (
              <li key={bubble.id}>
                <strong>{bubble.label}</strong> ({Math.round(bubble.x)}, {Math.round(bubble.y)})
                <FishController bubble={bubble} onMove={updateBubble} />
                <button type="button" onClick={() => removeBubble(bubble.id)}>Supprimer</button>
              </li>
            ))}
          </ul>
        </article>

        <aside style={shellStyles.panel}>
          <h2 style={{ marginTop: 0 }}>Panel de contrôle</h2>
          <p>Paramètres, publication et outils de modération hôte.</p>
          <ArenaPublishPanel roomCode="preview" status={status} actorRole={actorRole} />
        </aside>
      </div>

      <footer style={shellStyles.feedback}>
        Feedback : mode édition actif — toutes les commandes hôte sont disponibles.
      </footer>
    </section>
  );
}
