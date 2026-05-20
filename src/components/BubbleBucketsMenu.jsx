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
    const next = {};
    bucketItems.forEach((item) => {
      const existing = bubbles.find((bubble) => bubble.sampleId === item.id);
      next[item.id] = {
        checked: Boolean(existing),
        label: existing?.label || item.name,
        r: Number(existing?.r) || 72,
        hue: normalizeHue(existing?.hue, 190),
        depth: Number(existing?.depth) || 2,
      };
    });
    setDraftById(next);
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
          <button type="button" className="panel-close-btn" onClick={onClose}>×</button>
        </header>

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
