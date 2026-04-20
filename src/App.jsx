import { useMemo, useState } from 'react';
import HomeView from './features/home/HomeView';
import ExperienceView from './features/experience/ExperienceView';
import ProfileView from './features/profile/ProfileView';
import BottomNav from './components/navigation/BottomNav';
import { APP_VIEWS } from './core/utils/views';

function App() {
  const [activeView, setActiveView] = useState(APP_VIEWS.EXPERIENCE);

  const viewById = useMemo(
    () => ({
      [APP_VIEWS.HOME]: <HomeView onEnterExperience={() => setActiveView(APP_VIEWS.EXPERIENCE)} />,
      [APP_VIEWS.EXPERIENCE]: <ExperienceView />,
      [APP_VIEWS.PROFILE]: <ProfileView />,
    }),
    [],
  );

  return (
    <>
      {viewById[activeView]}
      <BottomNav activeView={activeView} onChange={setActiveView} />
    </>
  );
}

export default App;
