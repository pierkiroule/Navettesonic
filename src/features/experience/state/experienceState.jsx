import { createContext, useContext, useMemo, useReducer } from 'react';
import { APP_VIEWS } from '../../../core/utils/views';
import { BUBBLES, RESOTAGS } from '../../../core/config/experienceConfig';

const ExperienceStateContext = createContext(null);

function getInitialCanvasSize() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

const initialState = {
  currentView: APP_VIEWS.EXPERIENCE,
  isTethered: false,
  isInteractionPaused: false,
  selectedBubble: null,
  BUBBLES,
  RESOTAGS,
  canvasSize: getInitialCanvasSize(),
};

function experienceReducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_TETHERED':
      return { ...state, isTethered: action.payload };
    case 'SET_INTERACTION_PAUSED':
      return { ...state, isInteractionPaused: action.payload };
    case 'SET_SELECTED_BUBBLE':
      return { ...state, selectedBubble: action.payload };
    case 'SET_CANVAS_SIZE':
      return { ...state, canvasSize: action.payload };
    default:
      return state;
  }
}

export function ExperienceStateProvider({ children }) {
  const [state, dispatch] = useReducer(experienceReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <ExperienceStateContext.Provider value={value}>{children}</ExperienceStateContext.Provider>;
}

export function useExperienceState() {
  const context = useContext(ExperienceStateContext);

  if (!context) {
    throw new Error('useExperienceState must be used inside ExperienceStateProvider');
  }

  return context;
}
