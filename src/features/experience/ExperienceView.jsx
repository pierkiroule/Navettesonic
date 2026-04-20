import { SAMPLE_LIBRARY } from '../../core/audio/sampleLibrary';

function ExperienceView() {
  return (
    <section className="view experience-view">
      <div className="ui-caption">Double tap sur le poisson pour ouvrir la collection sonore</div>
      <div className="helper-tips">Garde le doigt (ou clic) appuyé dans l'océan : le poisson-plume suit ton mouvement.</div>
      <div className="panel-card">
        <h2>Collection Soon•° (demo)</h2>
        <p>Choisissez un sample, placez-le autour du poisson, puis validez pour déposer une bulle sonore.</p>
        <select>
          {SAMPLE_LIBRARY.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.name}
            </option>
          ))}
        </select>
      </div>
      <div className="canvas-placeholder">Canvas Soon•° (migré vers React, logique à brancher dans src/core/canvas)</div>
    </section>
  );
}

export default ExperienceView;
