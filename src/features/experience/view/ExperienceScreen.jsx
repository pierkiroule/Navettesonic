import { SOONCUT_SAMPLE_IDS } from '../../../core/config/experienceConfig';
import { EXPERIENCE_COPY } from '../model/experienceModel';

const ARENA_TRIANGLE_COUNT = 10;
const ARENA_TRIANGLES = Array.from({ length: ARENA_TRIANGLE_COUNT }, (_, index) => ({
  id: `arena-triangle-${index + 1}`,
  sampleId: SOONCUT_SAMPLE_IDS[index % SOONCUT_SAMPLE_IDS.length],
}));

function ExperienceScreen({ experienceRef, canvasRef, state, onBubbleChange, onArenaTriangleTap }) {
  const triangleSequence = state.sceneSnapshot.activeTriangle?.sampleSequence ?? null;

  return (
    <section ref={experienceRef} className="view experience-view">
      <canvas ref={canvasRef} className="experience-canvas" aria-label="Océan Soon°" />

      <div className="experience-overlay">
        <div className="ui-caption">{EXPERIENCE_COPY.caption}</div>
        <div className="helper-tips">{EXPERIENCE_COPY.helperTips}</div>

        <div className="panel-card compact-panel">
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
          <div className="arena-status">
            Lucioles échappées: {state.sceneSnapshot.escapedCount} · Triangles: {state.sceneSnapshot.formedTriangleCount} · Actives:{' '}
            {state.sceneSnapshot.fireflyCount}
          </div>
          <div className="arena-status">Triangle actif: {triangleSequence ? `oui (${triangleSequence.join(' → ')})` : 'non'}</div>
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
    </section>
  );
}

export default ExperienceScreen;
