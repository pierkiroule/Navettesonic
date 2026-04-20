import HomeView from '../../features/home/HomeView';
import ExperienceView from '../../features/experience/ExperienceView';
import ProfileView from '../../features/profile/ProfileView';
import BottomNav from '../../components/navigation/BottomNav';
import { APP_VIEWS } from '../../core/utils/views';

const viewById = {
  [APP_VIEWS.HOME]: HomeView,
  [APP_VIEWS.EXPERIENCE]: ExperienceView,
  [APP_VIEWS.PROFILE]: ProfileView,
};

function AppView({ currentView, onEnterExperience, onViewChange }) {
  const ActiveView = viewById[currentView] ?? ExperienceView;

  return (
    <>
      <ActiveView onEnterExperience={onEnterExperience} />
      <BottomNav activeView={currentView} onChange={onViewChange} />
    </>
  );
}

export default AppView;
