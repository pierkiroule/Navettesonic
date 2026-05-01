import LegacyShell from '../features/legacy/components/LegacyShell';
import { useRoomSlugFromLocation } from '../features/arena/hooks/useRoomSlugFromLocation';

function App() {
  const roomSlug = useRoomSlugFromLocation();

  return <LegacyShell roomSlug={roomSlug} />;
}

export default App;
