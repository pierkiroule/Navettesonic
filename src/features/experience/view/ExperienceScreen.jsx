import { SAMPLE_LIBRARY } from '../../../core/config/audioConfig';
import { EXPERIENCE_COPY } from '../model/experienceModel';

function ExperienceScreen({ experienceRef, state, onBubbleChange }) {
  return (
    <section ref={experienceRef} className="view experience-view">
      <div className="ui-caption">{EXPERIENCE_COPY.caption}</div>
      <div className="helper-tips">{EXPERIENCE_COPY.helperTips}</div>
      <div className="panel-card">
        <h2>{EXPERIENCE_COPY.panelTitle}</h2>
        <p>{EXPERIENCE_COPY.panelDescription}</p>
        <select value={state.selectedBubble ?? ''} onChange={(event) => onBubbleChange(event.target.value || null)}>
          <option value="">{EXPERIENCE_COPY.selectPlaceholder}</option>
          {state.BUBBLES.map((bubble) => (
            <option key={bubble.id} value={bubble.id}>
              {bubble.label}
            </option>
          ))}
        </select>
        <div className="helper-tips">Tags réseau: {state.RESOTAGS.join(' · ')}</div>
      </div>
      <div className="canvas-placeholder">
        Canvas Soon•° ({state.canvasSize.width}x{state.canvasSize.height}) — Tethered: {String(state.isTethered)} — Pause:{' '}
        {String(state.isInteractionPaused)}
      </div>
      <div className="panel-card">
        <h3>{EXPERIENCE_COPY.samplesTitle}</h3>
        <ul>
          {SAMPLE_LIBRARY.map((sample) => (
            <li key={sample.id}>{sample.name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default ExperienceScreen;
