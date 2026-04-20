import { useExperienceState } from './state/experienceState.jsx';
import { useExperiencePresenter } from './presenter/useExperiencePresenter';
import ExperienceScreen from './view/ExperienceScreen';

function ExperienceView() {
  const { state, dispatch } = useExperienceState();
  const { experienceRef, onBubbleChange } = useExperiencePresenter({ state, dispatch });

  return <ExperienceScreen experienceRef={experienceRef} state={state} onBubbleChange={onBubbleChange} />;
}

export default ExperienceView;
