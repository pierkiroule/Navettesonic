import { useEffect } from 'react';
import { useExperienceState } from '../state/experienceState.jsx';

export function useResizeCanvas() {
  const { dispatch } = useExperienceState();

  useEffect(() => {
    const syncCanvasSize = () => {
      dispatch({
        type: 'SET_CANVAS_SIZE',
        payload: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      });
    };

    window.addEventListener('resize', syncCanvasSize);
    syncCanvasSize();

    return () => {
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [dispatch]);
}
