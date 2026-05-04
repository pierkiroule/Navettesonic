import { sampleLibrary } from "../data/defaultPack.js";

export default function BubbleEditor({ bubble, onUpdate, onDelete }) {
  if (!bubble) {
    return (
      <section className="bubble-editor empty">
        <h3>Aucune bulle sélectionnée</h3>
        <p>Touche une bulle pour la régler.</p>
      </section>
    );
  }

  return (
    <section className="bubble-editor">
      <h3>{bubble.label}</h3>

      <label>
        Nom
        <input
          value={bubble.label}
          onChange={(event) => onUpdate({ label: event.target.value })}
        />
      </label>

      <label>
        Son
        <select
          value={bubble.sampleId}
          onChange={(event) => onUpdate({ sampleId: event.target.value })}
        >
          {sampleLibrary.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Taille
        <input
          type="range"
          min="36"
          max="150"
          value={bubble.r}
          onChange={(event) => onUpdate({ r: Number(event.target.value) })}
        />
      </label>

      <label>
        Profondeur
        <input
          type="range"
          min="1"
          max="3"
          value={bubble.depth}
          onChange={(event) => onUpdate({ depth: Number(event.target.value) })}
        />
      </label>

      <label>
        Couleur
        <input
          type="range"
          min="0"
          max="360"
          value={bubble.hue}
          onChange={(event) => onUpdate({ hue: Number(event.target.value) })}
        />
      </label>

      <button className="danger-btn" onClick={onDelete}>
        Supprimer la bulle
      </button>
    </section>
  );
}
