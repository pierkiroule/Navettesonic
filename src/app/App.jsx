import ExperienceFlowPanel from '../features/arena/components/ExperienceFlowPanel';
import { useRoomSlugFromLocation } from '../features/arena/hooks/useRoomSlugFromLocation';
import LegacyShell from '../features/legacy/components/LegacyShell';

function App() {
  const roomSlug = useRoomSlugFromLocation();

  return (
    <>
      <ExperienceFlowPanel roomSlug={roomSlug} />
      <LegacyShell roomSlug={roomSlug} />
    </>
  );
}

export default App;
