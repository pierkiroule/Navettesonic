import { HomePage } from '../features/home/HomePage';
import { HostArenaPage } from '../features/arena/pages/HostArenaPage';
import { VisitorArenaPage } from '../features/arena/pages/VisitorArenaPage';
import { normalizeRoomSlug } from '../features/arena/utils/roomLink';

export function AppRouter() {
  const params = new URLSearchParams(window.location.search);
  const roomCode = normalizeRoomSlug(params.get('room'));
  const hostMode = params.get('arena') === 'host';

  if (roomCode) return <VisitorArenaPage roomCode={roomCode} />;
  if (hostMode) return <HostArenaPage />;
  return <HomePage />;
}
