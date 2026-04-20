import { useEffect } from 'react';
import { useExperienceState } from '../state/experienceState';

export function usePointerControls(containerRef) {
  const { dispatch } = useExperienceState();

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return undefined;
    }

    const onMouseDown = () => dispatch({ type: 'SET_TETHERED', payload: true });
    const onMouseUp = () => dispatch({ type: 'SET_TETHERED', payload: false });
    const onTouchStart = () => dispatch({ type: 'SET_TETHERED', payload: true });
    const onTouchEnd = () => dispatch({ type: 'SET_TETHERED', payload: false });

    const onMouseMove = () => {
      dispatch({ type: 'SET_INTERACTION_PAUSED', payload: false });
    };

    const onTouchMove = () => {
      dispatch({ type: 'SET_INTERACTION_PAUSED', payload: false });
    };

    node.addEventListener('mousedown', onMouseDown);
    node.addEventListener('mouseup', onMouseUp);
    node.addEventListener('mouseleave', onMouseUp);
    node.addEventListener('mousemove', onMouseMove);
    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchend', onTouchEnd);
    node.addEventListener('touchcancel', onTouchEnd);
    node.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      node.removeEventListener('mousedown', onMouseDown);
      node.removeEventListener('mouseup', onMouseUp);
      node.removeEventListener('mouseleave', onMouseUp);
      node.removeEventListener('mousemove', onMouseMove);
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', onTouchEnd);
      node.removeEventListener('touchmove', onTouchMove);
    };
  }, [containerRef, dispatch]);
}
