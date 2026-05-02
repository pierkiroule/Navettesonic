import { ArenaPublishPanel } from '../components/ArenaPublishPanel';
import { FishController } from '../components/FishController';
import { useArenaEditor } from '../hooks/useArenaEditor';

export function ArenaEditorPage() {
  const { bubbles, addBubble, updateBubble, removeBubble } = useArenaEditor();

  return (
    <section>
      <h1>Arena Editor (hôte)</h1>
      <button type="button" onClick={() => addBubble()}>Ajouter une bulle</button>
      <ArenaPublishPanel roomCode="preview" />
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
