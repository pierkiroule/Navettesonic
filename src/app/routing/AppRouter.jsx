import { ArenaEditorPage } from '../../features/arena/pages/ArenaEditorPage';
import { ArenaVisitorPage } from '../../features/arena/pages/ArenaVisitorPage';
import { useRoomParam } from '../../features/arena/hooks/useRoomParam';
import LegacyShell from '../../features/legacy/components/LegacyShell';

export function AppRouter() {
  const room = useRoomParam();
  const isEditorMode =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('arena') === 'editor';

  if (room && isEditorMode) {
    return (
      <section>
        <h1>Paramètres d’entrée en conflit</h1>
        <p>
          Le lien contient à la fois un accès visiteur (<code>room</code>) et un accès éditeur (
          <code>arena=editor</code>).
        </p>
        <p>Supprimez l’un des paramètres pour ouvrir un seul parcours à la fois.</p>
      </section>
    );
  }

  if (room) {
    return <ArenaVisitorPage />;
  }

  if (isEditorMode) {
    return <ArenaEditorPage />;
  }

  return <LegacyShell />;
}
