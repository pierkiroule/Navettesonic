
import { useEffect, useMemo, useState } from "react";
import { getRuntimeSupabaseSamples, setRuntimeSupabaseSamples } from "../data/runtimeSoundLibrary.js";
import { listSoundBubbles } from "../services/supabaseSoundService.js";

export default function BubbleEditor({ bubble, onUpdate, onDelete }) {
  const [bucketSamples, setBucketSamples] = useState(() => getRuntimeSupabaseSamples());

  useEffect(() => {
    let mounted = true;
    void listSoundBubbles().then((items) => {
      if (!mounted) return;
      setRuntimeSupabaseSamples(items || []);
      setBucketSamples(getRuntimeSupabaseSamples());
    });
    return () => {
      mounted = false;
    };
  }, []);

  const dynamicSamples = useMemo(
    () =>
      bucketSamples.map((item) => ({
        id: `supabase:${item.file}`,
        name: item.name,
      })),
    [bucketSamples]
  );

  const sampleOptions = dynamicSamples;

  if (!bubble) {
    return (
      <section className="bubble-editor empty">
        <h3>Mode édition</h3>
        <p>Touche une bulle pour afficher ses propriétés.</p>
      </section>
    );
  }

  const radius = Number(bubble.r) || 70;
  const hue = Number(bubble.hue) || 190;

  return (
    <section className="bubble-editor">
      <header className="bubble-editor-header">
        <div>
          <p className="bubble-editor-kicker">Bulle sonore</p>
          <h3>{bubble.label || "Bulle sans nom"}</h3>
        </div>

        <div
          className="bubble-editor-preview"
          style={{
            background: `hsla(${hue}, 90%, 66%, 0.8)`,
            boxShadow: `0 0 22px hsla(${hue}, 90%, 66%, 0.45)`,
          }}
        />
      </header>

      <label>
        <span>Nom</span>
        <input
          value={bubble.label || ""}
          placeholder="Nom de la bulle"
          onChange={(event) => onUpdate({ label: event.target.value })}
        />
      </label>

      <label>
        <span>Son</span>
        <select
          value={bubble.sampleId || sampleOptions[0]?.id || ""}
          onChange={(event) => onUpdate({ sampleId: event.target.value })}
        >
          {sampleOptions.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.name}
            </option>
          ))}
        </select>
      </label>

      <div className="bubble-field">
        <div className="bubble-field-row">
          <span>Taille</span>
          <strong>{radius}px</strong>
        </div>
        <input
          type="range"
          min="36"
          max="150"
          value={radius}
          onChange={(event) => onUpdate({ r: Number(event.target.value) })}
        />
      </div>

      <div className="bubble-field">
        <div className="bubble-field-row">
          <span>Plan</span>
          <strong>Unique</strong>
        </div>
      </div>

      <div className="bubble-field">
        <div className="bubble-field-row">
          <span>Couleur</span>
          <strong>{hue}°</strong>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          onChange={(event) => onUpdate({ hue: Number(event.target.value) })}
        />
      </div>

      <button className="danger-btn" type="button" onClick={onDelete}>
        Supprimer la bulle
      </button>
    </section>
  );
}
