import { useEffect, useMemo, useState } from "react";
import { listSoundBubbles } from "../services/supabaseSoundService.js";

function randomCenterPlacement() {
  const angle = Math.random() * Math.PI * 2;
  const radius = 40 + Math.random() * 110;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function normalizeHue(value, fallback = 190) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(360, Math.round(n))) : fallback;
}

export default function BubbleBucketsMenu({ bubbles = [], open = false, onClose, onValidate }) {
  const [bucketItems, setBucketItems] = useState([]);
  const [draftById, setDraftById] = useState({});
  const [showMixer, setShowMixer] = useState(false);

  useEffect(() => {
    if (open) return;
    setDraftById({});
    setShowMixer(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    listSoundBubbles().then((items) => {
      if (cancelled) return;
      setBucketItems(items || []);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setDraftById((current) => {
      const next = { ...current };
      bucketItems.forEach((item) => {
        if (next[item.id]) return;
        const existing = bubbles.find((bubble) => bubble.sampleId === item.id);
        next[item.id] = {
          checked: Boolean(existing),
          label: existing?.label || item.name,
          r: Number(existing?.r) || 72,
          hue: normalizeHue(existing?.hue, 190),
          depth: Number(existing?.depth) || 2,
          resonance: Number(existing?.resonance) || 0.75,
        };
      });
      return next;
    });
  }, [open, bucketItems, bubbles]);

  const selectedCount = useMemo(
    () => Object.values(draftById).filter((item) => item?.checked).length,
    [draftById],
  );

  if (!open) return null;

  return (
    <div className="bubble-buckets-modal" role="dialog" aria-modal="true" aria-label="Éditeur de bulles sonores">
      <div className="bubble-buckets-sheet">
        <header className="bubble-buckets-header">
          <div>
            <p className="bubble-editor-kicker">Buckets sonores</p>
            <h3>Éditeur des bulles</h3>
            <small>{selectedCount} bulle(s) dans l’arène</small>
          </div>
          <div className="bubble-buckets-actions">
            <button type="button" className="bubble-btn mode-toggle" onClick={() => setShowMixer((value) => !value)} title="Ouvrir la table de mixage">
              🎚️ Mixage
            </button>
            <button type="button" className="panel-close-btn" onClick={onClose}>×</button>
          </div>
        </header>
        {showMixer ? (
          <section className="bubble-mixer-panel" aria-label="Table de mixage des bulles actives">
            {bucketItems
              .filter((item) => draftById[item.id]?.checked)
              .map((item) => {
                const draft = draftById[item.id] || {};
                const resonance = Math.max(0, Math.min(1, Number(draft.resonance) || 0));
                return (
                  <label key={`mix-${item.id}`} className="bubble-mixer-row">
                    <span>{draft.label || item.name}</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={resonance}
                      onChange={(event) => setDraftById((current) => ({
                        ...current,
                        [item.id]: { ...current[item.id], resonance: Number(event.target.value) },
                      }))}
                    />
                    <strong>{Math.round(resonance * 100)}%</strong>
                  </label>
                );
              })}
          </section>
        ) : null}

        <div className="bubble-buckets-list">
          {bucketItems.map((item) => {
            const draft = draftById[item.id] || {};
            return (
              <article key={item.id} className="bucket-item">
                <label className="bucket-item-top">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.checked)}
                    onChange={(event) => setDraftById((current) => ({
                      ...current,
                      [item.id]: { ...current[item.id], checked: event.target.checked },
                    }))}
                  />
                  <strong>{item.name}</strong>
                </label>
                <input
                  value={draft.label || ""}
                  placeholder="Nom de bulle"
                  onChange={(event) => setDraftById((current) => ({
                    ...current,
                    [item.id]: { ...current[item.id], label: event.target.value },
                  }))}
                />
                <label>Taille {Math.round(Number(draft.r) || 72)}px
                  <input type="range" min="36" max="150" value={Number(draft.r) || 72} onChange={(event) => setDraftById((current) => ({ ...current, [item.id]: { ...current[item.id], r: Number(event.target.value) } }))} />
                </label>
                <label>Couleur {Math.round(Number(draft.hue) || 190)}°
                  <input type="range" min="0" max="360" value={Number(draft.hue) || 190} onChange={(event) => setDraftById((current) => ({ ...current, [item.id]: { ...current[item.id], hue: Number(event.target.value) } }))} />
                </label>
                <label>Profondeur P{Math.max(1, Math.min(3, Math.round(Number(draft.depth) || 2)))}
                  <input type="range" min="1" max="3" step="1" value={Math.max(1, Math.min(3, Math.round(Number(draft.depth) || 2)))} onChange={(event) => setDraftById((current) => ({ ...current, [item.id]: { ...current[item.id], depth: Number(event.target.value) } }))} />
                </label>
                <label>Résonance {Math.round((Number(draft.resonance) || 0.75) * 100)}%
                  <input type="range" min="0" max="1" step="0.01" value={Number(draft.resonance) || 0.75} onChange={(event) => setDraftById((current) => ({ ...current, [item.id]: { ...current[item.id], resonance: Number(event.target.value) } }))} />
                </label>
              </article>
            );
          })}
        </div>

        <footer className="bubble-buckets-footer">
          <button
            type="button"
            className="bubble-btn mode-toggle"
            onClick={() => {
              const payload = bucketItems.map((item) => ({
                item,
                draft: draftById[item.id] || {},
                placement: randomCenterPlacement(),
              }));
              onValidate?.(payload);
              onClose?.();
            }}
          >
            ✅ Valider
          </button>
        </footer>
      </div>
    </div>
  );
}
