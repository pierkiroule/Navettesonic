import { SAMPLE_LIBRARY } from '../../../core/config/audioConfig';
import { SOONCUT_SAMPLE_IDS } from '../../../core/config/experienceConfig';
import { EXPERIENCE_COPY } from '../model/experienceModel';

const ARENA_TRIANGLE_COUNT = 10;
const ARENA_TRIANGLES = Array.from({ length: ARENA_TRIANGLE_COUNT }, (_, index) => ({
  id: `arena-triangle-${index + 1}`,
  sampleId: SOONCUT_SAMPLE_IDS[index % SOONCUT_SAMPLE_IDS.length],
}));

function ExperienceScreen({ experienceRef, state, onBubbleChange, onArenaTriangleTap }) {
  const triangleSequence = state.sceneSnapshot.activeTriangle?.sampleSequence ?? null;

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
        <div className="helper-tips">
          Lucioles échappées: {state.sceneSnapshot.escapedCount} · Triangle(s): {state.sceneSnapshot.formedTriangleCount} ·
          Lucioles actives: {state.sceneSnapshot.fireflyCount}
        </div>
        <div className="helper-tips">
          Triangle actif:{' '}
          {triangleSequence ? `oui (${triangleSequence.join(' → ')})` : 'non (les lucioles dérivent encore...)'}
        </div>
      </div>
      <div className="canvas-placeholder">
        <div className="arena-status">
          Arène Soon•° ({state.canvasSize.width}x{state.canvasSize.height}) — Tethered: {String(state.isTethered)} — Pause:{' '}
          {String(state.isInteractionPaused)}
        </div>
        <div className="arena-triangle-grid">
          {ARENA_TRIANGLES.map((triangle, index) => (
            <button
              key={triangle.id}
              type="button"
              className="arena-triangle-btn"
              onClick={() => onArenaTriangleTap(triangle.sampleId)}
              aria-label={`Triangle rouge ${index + 1}, déclenche ${triangle.sampleId}`}
            >
              <span className="arena-triangle-shape" />
              <span className="arena-triangle-label">T{index + 1}</span>
            </button>
          ))}
        </div>
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
