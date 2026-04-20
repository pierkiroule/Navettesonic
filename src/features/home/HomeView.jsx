import { useHomePresenter } from './presenter/useHomePresenter';
import HomeScreen from './view/HomeScreen';

function HomeView({ onEnterExperience }) {
  const { content, onToggleSound } = useHomePresenter({ onEnterExperience });

  return <HomeScreen content={content} onEnterExperience={onEnterExperience} onToggleSound={onToggleSound} />;
}

export default HomeView;
