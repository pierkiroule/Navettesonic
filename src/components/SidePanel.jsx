import { useState } from "react";
import { SOON_MODES } from "../core/soonModes.js";
import BubbleEditor from "./BubbleEditor.jsx";
import ResonancePanel from "./ResonancePanel.jsx";

export default function SidePanel({
  mode,
  selectedBubble,
  selectedBeacon,
  circuitAutopilot,
  onUpdateBeacon,
  onStartCircuitAutopilot,
  onStopCircuitAutopilot,
  onUpdateBubble,
  onDeleteBubble,
  notes,
  onAddNote,
}) {
  const [open, setOpen] = useState(false);
  const currentMode = SOON_MODES.find((item) => item.id === mode);

  if (mode === "intro") return null;

  return (
    <>
      <button
        className={open ? "mode-pill active" : "mode-pill side-toggle"}
        onClick={() => setOpen((value) => !value)}
        aria-label="Ouvrir les réglages"
      >
        <span>{currentMode?.icon}</span>
      </button>

      {selectedBubble && !open && mode === "compo" && (
        <button className="bubble-pill" onClick={() => setOpen(true)}>
          🫧 {selectedBubble.label}
        </button>
      )}

      {selectedBeacon && !open && mode === "reso" && (
        <button className="bubble-pill" onClick={() => setOpen(true)}>
          ⟡ Balise P{selectedBeacon.depth} · V{selectedBeacon.speed}
        </button>
      )}

      {open && (
        <aside className="side-panel compact">
          <header className="panel-mini-header">
            <div>
              <p className="kicker">{currentMode?.label}</p>
              <h2>{currentMode?.text}</h2>
            </div>

            <button className="panel-close-btn" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          {mode === "compo" && selectedBubble && (
            <BubbleEditor
              bubble={selectedBubble}
              onUpdate={onUpdateBubble}
              onDelete={onDeleteBubble}
            />
          )}

          {mode === "compo" && !selectedBubble && (
            <section className="help-card compact-help">
              <p>
                Double-tape dans l’arène pour créer une bulle sonore.
                Sélectionne une bulle pour la régler. Le poisson-plume peut
                récolter les lucioles avec sa traîne.
              </p>
            </section>
          )}

          {mode === "reso" && (
            <>
              <section className="help-card compact-help">
                <p>
                  Trace une boucle de voyage. Déplace les balises, règle leur
                  profondeur et lance l’écoute automatique.
                </p>

                {selectedBeacon && (
                  <div className="beacon-editor">
                    <label>
                      Profondeur
                      <select
                        value={selectedBeacon.depth}
                        onChange={(event) =>
                          onUpdateBeacon({ depth: Number(event.target.value) })
                        }
                      >
                        <option value={1}>1 · surface</option>
                        <option value={2}>2 · milieu</option>
                        <option value={3}>3 · profondeur</option>
                      </select>
                    </label>

                    <label>
                      Vitesse de passage
                      <select
                        value={selectedBeacon.speed}
                        onChange={(event) =>
                          onUpdateBeacon({ speed: Number(event.target.value) })
                        }
                      >
                        <option value={1}>1 · lente</option>
                        <option value={2}>2 · fluide</option>
                        <option value={3}>3 · vive</option>
                      </select>
                    </label>
                  </div>
                )}

                <div className="panel-row">
                  {!circuitAutopilot && (
                    <button
                      className="secondary-btn play-btn"
                      onClick={onStartCircuitAutopilot}
                    >
                      ▶ Voyage
                    </button>
                  )}

                  {circuitAutopilot && (
                    <button
                      className="danger-btn play-btn"
                      onClick={onStopCircuitAutopilot}
                    >
                      ⏸ Pause
                    </button>
                  )}
                </div>
              </section>

              <section className="help-card compact-help">
                <p>
                  Écoute à l’aveugle. Laisse le poisson traverser l’arène,
                  puis écris ce qui résonne.
                </p>
              </section>

              <ResonancePanel notes={notes} onAdd={onAddNote} />
            </>
          )}
        </aside>
      )}
    </>
  );
}
