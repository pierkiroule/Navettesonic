import { useExperienceState } from './state/experienceState.jsx';
import { useExperiencePresenter } from './presenter/useExperiencePresenter';
import ExperienceScreen from './view/ExperienceScreen';

function ExperienceView() {
  const { state, dispatch } = useExperienceState();
  const { experienceRef, canvasRef, onBubbleChange, onArenaTriangleTap } = useExperiencePresenter({ state, dispatch });

  return (
    <ExperienceScreen
      experienceRef={experienceRef}
      canvasRef={canvasRef}
      state={state}
      onBubbleChange={onBubbleChange}
      onArenaTriangleTap={onArenaTriangleTap}
    />
  );
}

export default ExperienceView;
