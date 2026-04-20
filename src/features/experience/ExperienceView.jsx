import { useEffect, useRef } from 'react';
import { SAMPLE_LIBRARY } from '../../core/config/audioConfig';
import { AudioEngine } from '../../core/audio/audioEngine';
import { SceneEngine } from '../../core/canvas/sceneEngine';
import { APP_VIEWS } from '../../core/utils/views';
import { usePointerControls } from './hooks/usePointerControls';
import { useResizeCanvas } from './hooks/useResizeCanvas';
import { useExperienceState } from './state/experienceState.jsx';

function ExperienceView() {
  const experienceRef = useRef(null);
  const audioEngineRef = useRef(null);
  const sceneEngineRef = useRef(null);

  const { state, dispatch } = useExperienceState();

  usePointerControls(experienceRef);
  useResizeCanvas();

  useEffect(() => {
    const container = experienceRef.current;

    if (!container) {
      return undefined;
    }

    const audioEngine = new AudioEngine();
    const sceneEngine = new SceneEngine({
      onUpdate: (worldState) => {
        const arenaDiameter = window.innerWidth || 1;
        const xInViewport = worldState.fish.x + arenaDiameter / 2;
        audioEngine.setSpatialPosition(xInViewport, arenaDiameter);
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
  }, []);

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
    if (!state.selectedBubble || !audioEngineRef.current) {
      return;
    }

    const sample = SAMPLE_LIBRARY.find((entry) => entry.id === state.selectedBubble.replace('bubble-', ''));
    if (sample) {
      audioEngineRef.current.triggerSample(sample.id);
      return;
    }

    const fallbackSample = SAMPLE_LIBRARY[Math.floor(Math.random() * SAMPLE_LIBRARY.length)];
    audioEngineRef.current.triggerSample(fallbackSample.id);
  }, [state.selectedBubble]);

  return (
    <section ref={experienceRef} className="view experience-view">
      <div className="ui-caption">Double tap sur le poisson pour ouvrir la collection sonore</div>
      <div className="helper-tips">Garde le doigt (ou clic) appuyé dans l'océan : le poisson-plume suit ton mouvement.</div>
      <div className="panel-card">
        <h2>Collection Soon•° (demo)</h2>
        <p>Choisissez un sample, placez-le autour du poisson, puis validez pour déposer une bulle sonore.</p>
        <select
          value={state.selectedBubble ?? ''}
          onChange={(event) => dispatch({ type: 'SET_SELECTED_BUBBLE', payload: event.target.value || null })}
        >
          <option value="">Sélectionnez une bulle</option>
          {state.BUBBLES.map((bubble) => (
            <option key={bubble.id} value={bubble.id}>
              {bubble.label}
            </option>
          ))}
        </select>
        <div className="helper-tips">Tags réseau: {state.RESOTAGS.join(' · ')}</div>
      </div>
      <div className="canvas-placeholder">
        Canvas Soon•° ({state.canvasSize.width}x{state.canvasSize.height}) — Tethered: {String(state.isTethered)} — Pause:
        {' '}
        {String(state.isInteractionPaused)}
      </div>
      <div className="panel-card">
        <h3>Samples disponibles</h3>
        <ul>
          {SAMPLE_LIBRARY.map((sample) => (
            <li key={sample.id}>{sample.name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default ExperienceView;
