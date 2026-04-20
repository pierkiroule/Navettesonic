import { ExperienceStateProvider, useExperienceState } from './features/experience/state/experienceState.jsx';
import { useAppPresenter } from './app/presenter/useAppPresenter';
import AppView from './app/view/AppView';

function AppContent() {
  const { state, dispatch } = useExperienceState();
  const { onViewChange, onEnterExperience } = useAppPresenter({ dispatch });

  return <AppView currentView={state.currentView} onEnterExperience={onEnterExperience} onViewChange={onViewChange} />;
}

function App() {
  return (
    <ExperienceStateProvider>
      <AppContent />
    </ExperienceStateProvider>
  );
}

export default App;
