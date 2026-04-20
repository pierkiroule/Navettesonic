import { APP_VIEWS } from '../../core/utils/views';

export function useAppPresenter({ dispatch }) {
  return {
    onViewChange: (view) => dispatch({ type: 'SET_CURRENT_VIEW', payload: view }),
    onEnterExperience: () => dispatch({ type: 'SET_CURRENT_VIEW', payload: APP_VIEWS.EXPERIENCE }),
  };
}
