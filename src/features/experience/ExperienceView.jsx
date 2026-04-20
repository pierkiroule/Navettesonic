import { useRef } from 'react';
import { SAMPLE_LIBRARY } from '../../core/audio/sampleLibrary';
import { usePointerControls } from './hooks/usePointerControls';
import { useResizeCanvas } from './hooks/useResizeCanvas';
import { useExperienceState } from './state/experienceState';

function ExperienceView() {
  const experienceRef = useRef(null);
  const { state, dispatch } = useExperienceState();

  usePointerControls(experienceRef);
  useResizeCanvas();

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
