import { useHomePresenter } from './presenter/useHomePresenter';
import HomeScreen from './view/HomeScreen';

function HomeView({ onEnterExperience }) {
  const { content } = useHomePresenter({ onEnterExperience });

  return <HomeScreen content={content} onEnterExperience={onEnterExperience} />;
}

export default HomeView;
