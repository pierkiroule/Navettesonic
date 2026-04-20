import { useMemo } from 'react';
import HomeView from './features/home/HomeView';
import ExperienceView from './features/experience/ExperienceView';
import ProfileView from './features/profile/ProfileView';
import BottomNav from './components/navigation/BottomNav';
import { APP_VIEWS } from './core/utils/views';
import { ExperienceStateProvider, useExperienceState } from './features/experience/state/experienceState';

function AppContent() {
  const { state, dispatch } = useExperienceState();

  const viewById = useMemo(
    () => ({
      [APP_VIEWS.HOME]: (
        <HomeView onEnterExperience={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: APP_VIEWS.EXPERIENCE })} />
      ),
      [APP_VIEWS.EXPERIENCE]: <ExperienceView />,
      [APP_VIEWS.PROFILE]: <ProfileView />,
    }),
    [dispatch],
  );

  return (
    <>
      {viewById[state.currentView]}
      <BottomNav
        activeView={state.currentView}
        onChange={(view) => dispatch({ type: 'SET_CURRENT_VIEW', payload: view })}
      />
    </>
  );
}

function App() {
  return (
    <ExperienceStateProvider>
      <AppContent />
    </ExperienceStateProvider>
  );
}

export default App;
