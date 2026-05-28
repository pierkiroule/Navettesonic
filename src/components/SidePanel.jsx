import { SOON_MODE_COMPO, SOON_MODE_INTRO, SOON_MODE_RESO } from "../core/uiState.js";
import { useEffect, useState } from "react";
import { SOON_MODES } from "../core/soonModes.js";
import BubbleEditor from "./BubbleEditor.jsx";

export default function SidePanel({
  mode,
  selectedBubble,
  selectedBeacon,
  circuitAutopilot,
  onUpdateBeacon,
  onStartCircuitAutopilot,
  onStopCircuitAutopilot,
  onAutoGenerateTraceCircuit,
  onUpdateBubble,
  onDeleteBubble,
  forceOpenKey = 0,
}) {
  const [open, setOpen] = useState(false);
  const currentMode = SOON_MODES.find((item) => item.id === mode);

  useEffect(() => {
    if (!forceOpenKey) return;
    setOpen(true);
  }, [forceOpenKey]);

  if (mode === SOON_MODE_INTRO) return null;

  return (
    <>
      <button
        className={open ? "mode-pill active" : "mode-pill side-toggle"}
        onClick={() => setOpen((value) => !value)}
        aria-label="Ouvrir les réglages"
      >
        <span>{currentMode?.icon}</span>
      </button>

      {selectedBubble && !open && mode === SOON_MODE_COMPO && (
        <button className="bubble-pill" onClick={() => setOpen(true)}>
          🫧 {selectedBubble.label}
        </button>
      )}

      {false && selectedBeacon && !open && mode === SOON_MODE_RESO && (
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

          {mode === SOON_MODE_COMPO && selectedBubble && (
            <BubbleEditor
              bubble={selectedBubble}
              onUpdate={(patch) => onUpdateBubble(selectedBubble.id, patch)}
              onDelete={() => onDeleteBubble(selectedBubble.id)}
            />
          )}

          {mode === SOON_MODE_COMPO && !selectedBubble && (
            <section className="help-card compact-help">
              <p>
                L’arène ne garde plus que les étoiles sonores à cueillir.
                Trace ensuite un parcours pour les relier en chronologie.
              </p>
              <ul>
                <li>Le poisson-plume peut pousser légèrement les poissons-roses.</li>
                <li>
                  Les poissons-roses sont attirés par les graines et peuvent les
                  pousser légèrement vers le centre.
                </li>
              </ul>
            </section>
          )}

          {false && mode === SOON_MODE_RESO && (
            <>
              <section className="help-card compact-help">
                <p>
                  Trace un circuit de résonance. Déplace les balises, règle leur
                  ancrages de profondeur puis lance le voyage.
                </p>

                {selectedBeacon && (
                  <div className="beacon-editor">
                    <label>
                      Ancrages
                      <select
                        value={selectedBeacon.depth}
                        onChange={(event) =>
                          onUpdateBeacon({ depth: Number(event.target.value) })
                        }
                      >
                        <option value={1}>1 · surface</option>
                        <option value={2}>2 · milieu</option>
                        <option value={3}>3 · profond</option>
                      </select>
                    </label>

                    <label>
                      Vitesse
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
                  <button
                    className="secondary-btn play-btn"
                    type="button"
                    onClick={onAutoGenerateTraceCircuit}
                  >
                    ✦ Auto
                  </button>
                  {!circuitAutopilot && (
                    <button
                      className="secondary-btn play-btn"
                      onClick={onStartCircuitAutopilot}
                    >
                      ▶ Lancer
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
                  
                  
                </p>
              </section>
            </>
          )}
        </aside>
      )}
    </>
  );
}
