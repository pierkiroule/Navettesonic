import { ArenaEditorPage } from '../../features/arena/pages/ArenaEditorPage';
import { ArenaVisitorPage } from '../../features/arena/pages/ArenaVisitorPage';
import { useRoomParam } from '../../features/arena/hooks/useRoomParam';
import LegacyShell from '../../features/legacy/components/LegacyShell';

export function AppRouter() {
  const room = useRoomParam();
  const isEditorMode =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('arena') === 'editor';

  // Priorité explicite au parcours visiteur lorsqu'un room slug valide est présent.
  // Cela évite les ambiguïtés tout en gardant un routage déterministe.
  if (room) {
    return <ArenaVisitorPage />;
  }

  if (isEditorMode) {
    return <ArenaEditorPage />;
  }

  return <LegacyShell />;
}
