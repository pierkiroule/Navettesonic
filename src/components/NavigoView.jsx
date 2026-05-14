export default function NavigoView({
  activeTab,
  onChangeTab,
  isTravelPlaying,
  onToggleTravelPlaying,
  onExportImmersion,
  canPlay,
  canExport,
  exportStatus,
  exportUrl,
}) {
  const isTrace = activeTab === "trace";

  return (
    <div className="navigo-view" aria-label="Navigo">
      <div className="navigo-toggle" role="tablist" aria-label="Tracer ou Traverser">
        <button
          type="button"
          role="tab"
          aria-selected={isTrace}
          className={`bubble-btn mode-toggle ${isTrace ? "active" : ""}`}
          onClick={() => onChangeTab("trace")}
        >
          Tracer
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isTrace}
          className={`bubble-btn mode-toggle ${!isTrace ? "active" : ""}`}
          onClick={() => onChangeTab("travel")}
        >
          Traverser
        </button>
      </div>

      {!isTrace && (
        <div className="tool-row primary-tools">
          <button
            type="button"
            className={`bubble-btn mode-toggle ${isTravelPlaying ? "active" : ""}`}
            onClick={onToggleTravelPlaying}
            disabled={!canPlay}
            title={canPlay ? (isTravelPlaying ? "Mettre la traversée en pause" : "Lancer la traversée") : "Trace un parcours d’abord"}
          >
            {isTravelPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          <button
            type="button"
            className="bubble-btn mode-toggle"
            onClick={onExportImmersion}
            disabled={!canExport}
            title={canExport ? "Générer l’immersion sonore" : "Trace un parcours d’abord"}
          >
            🎧 Générer
          </button>
        </div>
      )}

      {exportStatus ? <div className="export-status">{exportStatus}</div> : null}
      {exportUrl ? (
        <a className="export-link" href={exportUrl} download="immersion.wav">
          Télécharger immersion
        </a>
      ) : null}
    </div>
  );
}
