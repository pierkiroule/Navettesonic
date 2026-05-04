import { useState } from "react";

export default function ResonancePanel({ notes, onAdd }) {
  const [text, setText] = useState("");

  function submit() {
    onAdd(text);
    setText("");
  }

  return (
    <section className="resonance-panel">
      <h3>Résonner</h3>

      <p>
        Dépose un mot, une sensation, une image intérieure.
      </p>

      <textarea
        value={text}
        rows={4}
        placeholder="Ce qui reste de la traversée..."
        onChange={(event) => setText(event.target.value)}
      />

      <button className="secondary-btn" onClick={submit}>
        Déposer l’écho
      </button>

      <div className="notes-list">
        {notes.map((note) => (
          <article key={note.id} className="note-card">
            {note.text}
          </article>
        ))}
      </div>
    </section>
  );
}
