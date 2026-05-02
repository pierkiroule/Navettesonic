import { ArenaEditorPage } from '../../features/arena/pages/ArenaEditorPage';
import { ArenaVisitorPage } from '../../features/arena/pages/ArenaVisitorPage';
import { useRoomParam } from '../../features/arena/hooks/useRoomParam';
import LegacyShell from '../../features/legacy/components/LegacyShell';

export function AppRouter() {
  const room = useRoomParam();

  if (room) {
    return <ArenaVisitorPage />;
  }

  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('arena') === 'editor') {
    return <ArenaEditorPage />;
  }

  return <LegacyShell />;
}
