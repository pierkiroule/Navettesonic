import { useEffect, useRef } from 'react';
import { AudioEngine } from '../../../core/audio/audioEngine';
import { SceneEngine } from '../../../core/canvas/sceneEngine';
import { BUBBLES } from '../../../core/config/experienceConfig';
import { APP_VIEWS } from '../../../core/utils/views';
import { usePointerControls } from '../hooks/usePointerControls';
import { useResizeCanvas } from '../hooks/useResizeCanvas';
import { resolveSampleId, resolveSooncutSequence } from '../model/experienceModel';

export function useExperiencePresenter({ state, dispatch }) {
  const experienceRef = useRef(null);
  const audioEngineRef = useRef(null);
  const sceneEngineRef = useRef(null);

  usePointerControls(experienceRef);
  useResizeCanvas();

  useEffect(() => {
    const container = experienceRef.current;

    if (!container) {
      return undefined;
    }

    const audioEngine = new AudioEngine();
    const sceneEngine = new SceneEngine({
      bubbles: BUBBLES,
      onTriangleHit: (sequence) => {
        audioEngine.triggerSequence(resolveSooncutSequence(sequence));
      },
      onUpdate: (worldState) => {
        const arenaDiameter = window.innerWidth || 1;
        const xInViewport = worldState.fish.x + arenaDiameter / 2;
        audioEngine.setSpatialPosition(xInViewport, arenaDiameter);

        dispatch({
          type: 'SET_SCENE_SNAPSHOT',
          payload: {
            escapedCount: worldState.stats.escapedCount,
            formedTriangleCount: worldState.stats.formedTriangleCount,
            activeTriangle: worldState.activeTriangle,
            fireflyCount: worldState.fireflies.length,
          },
        });
      },
    });

    audioEngineRef.current = audioEngine;
    sceneEngineRef.current = sceneEngine;

    sceneEngine.init(container);
    sceneEngine.start();
    audioEngine.start();

    const onPointerMove = (event) => {
      const rect = container.getBoundingClientRect();
      const clientX = event.clientX ?? event.touches?.[0]?.clientX;
      const clientY = event.clientY ?? event.touches?.[0]?.clientY;

      if (typeof clientX !== 'number' || typeof clientY !== 'number') {
        return;
      }

      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      sceneEngine.setPointer({ x, y });
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('touchmove', onPointerMove, { passive: true });

    return () => {
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('touchmove', onPointerMove);

      sceneEngine.destroy();
      audioEngine.destroy();

      sceneEngineRef.current = null;
      audioEngineRef.current = null;
    };
  }, [dispatch]);

  useEffect(() => {
    const sceneEngine = sceneEngineRef.current;
    const audioEngine = audioEngineRef.current;

    if (!sceneEngine || !audioEngine) {
      return;
    }

    const isExperienceActive = state.currentView === APP_VIEWS.EXPERIENCE;
    const shouldPause = !isExperienceActive || state.isInteractionPaused;

    if (shouldPause) {
      sceneEngine.pause();
      audioEngine.pause();
      return;
    }

    sceneEngine.resume();
    audioEngine.resume();
  }, [state.currentView, state.isInteractionPaused]);

  useEffect(() => {
    const resolvedSampleId = resolveSampleId(state.selectedBubble);

    if (!resolvedSampleId || !audioEngineRef.current) {
      return;
    }

    audioEngineRef.current.triggerSample(resolvedSampleId);
  }, [state.selectedBubble]);

  const onBubbleChange = (bubbleId) => {
    dispatch({ type: 'SET_SELECTED_BUBBLE', payload: bubbleId });
  };

  const onArenaTriangleTap = (sampleId) => {
    if (!sampleId || !audioEngineRef.current) {
      return;
    }

    audioEngineRef.current.triggerSample(sampleId);
  };

  return {
    experienceRef,
    onBubbleChange,
    onArenaTriangleTap,
  };
}
