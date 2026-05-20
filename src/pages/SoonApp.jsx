import { useEffect, useMemo, useRef, useState } from "react";
import SidePanel from "../components/SidePanel.jsx";
import SoonCanvas from "../components/SoonCanvas.jsx";
import WorkflowShell from "../components/WorkflowShell.jsx";
import Profile from "./Profile.jsx";
import BubbleBucketsMenu from "../components/BubbleBucketsMenu.jsx";
import { useSoonStore } from "../store/useSoonStore.js";
import { renderImmersiveJourney } from "../core/immersiveExporter.js";
import {
  parseWorkflowFromHash,
  persistWorkflowRoot,
  readPersistedWorkflowRoot,
  serializeWorkflowHash,
} from "../core/workflowShellState.js";
import {
  ODYSSEO_MODE_TRACE,
  SOON_MODE_COMPO,
  SOON_MODE_RESO,
  WORKFLOW_ROOT_COMPO,
  WORKFLOW_ROOT_NAVIGO,
  modeToWorkflowRoot,
  normalizeOdysseoMode,
  workflowRootToMode,
} from "../core/uiState.js";


const SPEED_BY_LEVEL = {
  1: 0.6,
  2: 1.15,
  3: 1.7,
};

export default function SoonApp({ onBack }) {
  const WORKFLOW_ROOT_TUTO = "tuto";
  const [page, setPage] = useState("arena");
  const [activeRoot, setActiveRoot] = useState(WORKFLOW_ROOT_TUTO);
  const [interactionMode, setInteractionMode] = useState("swim");
  const [odysseoMode, setOdysseoMode] = useState(ODYSSEO_MODE_TRACE);
  const [viewZoom, setViewZoom] = useState(1);
  const [swimSpeed, setSwimSpeed] = useState(1.15);
  const [swimSpeedLevel, setSwimSpeedLevel] = useState(2);
  const [isTravelPlaying, setIsTravelPlaying] = useState(false);
  const [editorOpenKey, setEditorOpenKey] = useState(0);
  const [selectedDepth, setSelectedDepth] = useState(2);
  const [exportStatus, setExportStatus] = useState("");
  const [exportUrl, setExportUrl] = useState(null);
  const [bubblesEnabled, setBubblesEnabled] = useState(true);
  const [bubblesIntensity, setBubblesIntensity] = useState(1);
  const [bubbleBucketsOpen, setBubbleBucketsOpen] = useState(false);
  const speedBoostUntilRef = useRef(0);

  const {
    mode,
    bubbles,
    fish,
    selectedBubbleId,
    traceCircuit,
    selectedBeaconId,
    circuitAutopilot,
    eyesClosed,
    toggleEyesClosed,

    odysseoPath,
    odysseoDepthMarkers,
    odysseoTool,
    setOdysseoTool,
    addOdysseoPathPoint,
    addOdysseoDepthMarker,
    clearOdysseoPath,
    tickOdysseoPath,

    setMode,
    setFishTarget,
    recenterFish,
    tickFish,
    applyBlobAction,
    setFishDepth,
    selectBubble,
    selectBeacon,
    moveBeacon,
    updateBeacon,
    startCircuitAutopilot,
    stopCircuitAutopilot,
    autoGenerateTraceCircuit,
    addBubble,
    addPathPoint,
    updateBubble,
    deleteBubble,
    worldGraph,
    currentArenaId,
    mazeByArena,
    toggleMembraneSide,
    gamePaused,
    pendingBlobAction,
    arenaBlob,
  } = useSoonStore();

  const selectedBubble =
    bubbles.find((bubble) => bubble.id === selectedBubbleId) || null;

  const selectedBeacon =
    traceCircuit.find((beacon) => beacon.id === selectedBeaconId) || null;

  const isOdysseo = mode === SOON_MODE_RESO;
  const isEditMode = interactionMode === "edit";

  useEffect(() => {
    const depth = Math.max(1, Math.min(3, Math.round(fish?.depth || 2)));
    setSelectedDepth(depth);
  }, [fish?.depth]);

  useEffect(() => {
    const closestLevel = [1, 2, 3].reduce((best, level) => (
      Math.abs(SPEED_BY_LEVEL[level] - swimSpeed) < Math.abs(SPEED_BY_LEVEL[best] - swimSpeed)
        ? level
        : best
    ), 2);
    setSwimSpeedLevel(closestLevel);
  }, [swimSpeed]);


  const flowStep = useMemo(() => {
    if (mode === SOON_MODE_COMPO) {
      return {
        key: SOON_MODE_COMPO,
        title: "Composer",
        tip: "Choisissez vos éléments et organisez votre scène.",
      };
    }

    return {
      key: WORKFLOW_ROOT_NAVIGO,
      title: "Navigo",
      tip: "Trace, ancre et lance la lecture du parcours depuis un seul espace.",
    };
  }, [mode]);

  const [stepTipVisible, setStepTipVisible] = useState(false);

  useEffect(() => {
    const fromHash = parseWorkflowFromHash(window.location.hash);
    const persistedRoot = readPersistedWorkflowRoot();

    if (fromHash?.root === WORKFLOW_ROOT_NAVIGO) {
      setActiveRoot(WORKFLOW_ROOT_NAVIGO);
      setMode(SOON_MODE_RESO);
      setOdysseoMode(normalizeOdysseoMode(fromHash.odysseoMode));
      return;
    }

    if (persistedRoot === WORKFLOW_ROOT_NAVIGO) {
      setActiveRoot(WORKFLOW_ROOT_NAVIGO);
      setMode(SOON_MODE_RESO);
      setOdysseoMode(ODYSSEO_MODE_TRACE);
      return;
    }
    setActiveRoot(WORKFLOW_ROOT_COMPO);
  }, [setMode]);

  useEffect(() => {
    const root = modeToWorkflowRoot(mode);
    persistWorkflowRoot(root);
    window.history.replaceState(null, "", serializeWorkflowHash(root, odysseoMode));
  }, [mode, odysseoMode]);

  const setWorkflowRoot = (root) => {
    setActiveRoot(root);

    if (root === WORKFLOW_ROOT_TUTO) {
      return;
    }

    stopCircuitAutopilot();
    setInteractionMode("swim");
    setIsTravelPlaying(false);

    if (root === WORKFLOW_ROOT_NAVIGO) {
      setMode(SOON_MODE_RESO);
      setOdysseoMode((current) => normalizeOdysseoMode(current));
      return;
    }

    setMode(workflowRootToMode(root));
  };

  useEffect(() => {
    setStepTipVisible(true);
    const timeoutId = setTimeout(() => {
      setStepTipVisible(false);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [flowStep.key]);


  const toggleInteractionMode = () => {
    setInteractionMode((current) => {
      const next = current === "edit" ? "swim" : "edit";

      if (next === "swim") {
        selectBubble(null);
      }

      return next;
    });
  };

  const openBubbleEditor = (id) => {
    selectBubble(id);
    setEditorOpenKey((value) => value + 1);
  };

  const handleExportImmersion = async () => {
    try {
      setExportStatus("Calcul de l’immersion...");
      setExportUrl(null);

      const blob = await renderImmersiveJourney({
        path: odysseoPath,
        markers: odysseoDepthMarkers,
        bubbles,
        duration: 75,
      });

      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      setExportStatus("Immersion prête");
    } catch (error) {
      setExportStatus(error?.message || "Export impossible");
    }
  };

  const boostFishSpeed = () => {
    speedBoostUntilRef.current = Date.now() + 1200;
  };

  const cycleBubbleDepth = (id) => {
    const bubble = bubbles.find((item) => item.id === id);
    if (!bubble) return;

    const nextDepth = (Math.round(bubble.depth || 1) % 3) + 1;

    selectBubble(id);
    updateBubble(id, { depth: nextDepth });
    setEditorOpenKey((value) => value + 1);
  };

  const handleOpenBubbleBuckets = () => {
    stopCircuitAutopilot();
    setBubbleBucketsOpen(true);
  };

  const handleApplyBubbleBuckets = (payload = []) => {
    const activeBySample = new Map(bubbles.map((bubble) => [bubble.sampleId, bubble]));

    payload.forEach(({ item, draft, placement }) => {
      const existing = activeBySample.get(item.id);

      if (!draft?.checked) {
        if (existing) deleteBubble(existing.id);
        return;
      }

      if (existing) {
        updateBubble(existing.id, {
          label: draft.label || item.name,
          r: Number(draft.r) || existing.r || 72,
          hue: Number(draft.hue) || existing.hue || 190,
          depth: Number(draft.depth) || existing.depth || selectedDepth,
        });
        return;
      }

      addBubble(placement.x, placement.y);
      const nextBubble = (useSoonStore.getState().bubbles || []).slice(-1)[0];
      if (!nextBubble) return;
      updateBubble(nextBubble.id, {
        sampleId: item.id,
        label: draft.label || item.name,
        r: Number(draft.r) || 72,
        hue: Number(draft.hue) || 190,
        depth: Number(draft.depth) || selectedDepth,
      });
    });
  };


  if (page === "profile") {
    return <Profile onBack={() => setPage("arena")} />;
  }

  return (
    <main className={`soon-app ${isEditMode ? "edit-mode" : "swim-mode"}`}>
      <header className="top-nav">
        <button type="button" className="top-nav-icon top-nav-home" onClick={onBack} aria-label="Accueil">
          🏠
        </button>

        <div className={`flow-step-tip ${stepTipVisible ? "visible" : ""}`} aria-live="polite">
          <strong>{flowStep.title}</strong>
          <span>{flowStep.tip}</span>
        </div>

        <div className="top-nav-flow">
          <WorkflowShell
            activeRoot={activeRoot}
            onChangeRoot={setWorkflowRoot}
          />
        </div>

        <button
          type="button"
          className="top-nav-icon top-nav-profile"
          onClick={() => setPage("profile")}
          aria-label="Profil"
        >
          👤
        </button>
      </header>

      <SoonCanvas
        mode={mode}
        interactionMode={isOdysseo ? "circuit" : interactionMode}
        odysseoMode={odysseoMode}
        bubbles={bubbles}
        fish={fish}
        selectedBubbleId={selectedBubbleId}
        traceCircuit={traceCircuit}
        odysseoPath={odysseoPath}
        odysseoDepthMarkers={odysseoDepthMarkers}
        odysseoTool={odysseoTool}
        selectedBeaconId={selectedBeaconId}
        circuitAutopilot={circuitAutopilot}
        eyesClosed={eyesClosed}
        viewZoom={viewZoom}
        onFishTarget={(x, y, arenaRadius) => setFishTarget(x, y, arenaRadius)}
        onTickFish={({ arenaRadius } = {}) => {
          const boosted = Date.now() < speedBoostUntilRef.current;
          const effectiveSwimSpeed = boosted ? swimSpeed * 1.8 : swimSpeed;
          if (isOdysseo) {
            if (isTravelPlaying) {
              tickOdysseoPath({ swimSpeed: effectiveSwimSpeed });
            }
            return;
          }

          if (isEditMode) return;

          tickFish({ swimSpeed: effectiveSwimSpeed, arenaRadius });

        }}
        onBoostFishSpeed={boostFishSpeed}
        onSelectBubble={selectBubble}
        onSelectBeacon={selectBeacon}
        onMoveBeacon={moveBeacon}
        onMoveBubble={(id, pos) => updateBubble(id, pos)}
        onAddBubble={addBubble}
        onAddPathPoint={addPathPoint}
        onAddOdysseoPathPoint={addOdysseoPathPoint}
        onAddOdysseoDepthMarker={(x, y) => {
          addOdysseoDepthMarker(x, y, selectedDepth);
        }}
        onOpenBubbleEditor={openBubbleEditor}
        onRecenterFish={handleOpenBubbleBuckets}
        onCycleBubbleDepth={cycleBubbleDepth}
        bubblesEnabled={bubblesEnabled}
        bubblesIntensity={bubblesIntensity}
        worldGraph={worldGraph}
        currentArenaId={currentArenaId}
        mazeByArena={mazeByArena}
        gamePaused={gamePaused}
        pendingBlobAction={pendingBlobAction}
        arenaBlob={arenaBlob}
        onToggleBubbles={() => setBubblesEnabled((v) => !v)}
        onSetBubblesIntensity={setBubblesIntensity}
        onResetFishContext={() => { setBubblesEnabled(true); setBubblesIntensity(1); recenterFish(); }}
        onToggleMembraneSide={toggleMembraneSide}
        onBlobAction={applyBlobAction}
      />


      {activeRoot === WORKFLOW_ROOT_TUTO && (
        <section className="tutorial-panel" aria-label="Tutoriel Soon">
          <h3>Tuto Soon•° — concept, principe et fonctionnement</h3>
          <p>
            Soon est un atelier d’exploration sonore en 2 modes : <strong>Compo</strong> pour créer la matière
            et <strong>Navigo</strong> pour écrire puis jouer un parcours d’écoute.
          </p>
          <div className="tutorial-grid">
            <article>
              <h4>Principe global</h4>
              <ul>
                <li><strong>Tap :</strong> le poisson-plume nage vers la zone visée.</li>
                <li><strong>Double-tap :</strong> active un boost court de vitesse.</li>
                <li><strong>Appui long :</strong> ouvre le menu radial contextuel.</li>
                <li><strong>Recentrer :</strong> remet le poisson au centre et relance ton orientation.</li>
              </ul>
            </article>
            <article>
              <h4>Mode Compo — construire la scène</h4>
              <ul>
                <li><strong>Mode Nager :</strong> tu explores, écoutes et positionnes ton attention.</li>
                <li><strong>Mode Éditer :</strong> double-tap vide pour créer une bulle, tap bulle pour la modifier.</li>
                <li><strong>Menu bulle :</strong> ajuste position, profondeur, contenu et présence dans l’espace.</li>
                <li><strong>Objectif :</strong> fabriquer une cartographie sonore vivante et expressive.</li>
              </ul>
            </article>
            <article>
              <h4>Mode Navigo — tracer puis jouer</h4>
              <ul>
                <li><strong>Outil Dessin ✏️ :</strong> trace le trajet d’écoute.</li>
                <li><strong>Outil Ancre ⚓ :</strong> place des jalons de profondeur (1, 2, 3).</li>
                <li><strong>Play / Pause :</strong> lance ou arrête la traversée du parcours.</li>
                <li><strong>Effacer 🧽 :</strong> nettoie le tracé pour recommencer un nouveau voyage.</li>
              </ul>
            </article>
          </div>
        </section>
      )}

      <div className={`cockpit ${isOdysseo ? "odysseo-cockpit" : ""}`}>
        <div className="cockpit-buttons">
          {isOdysseo ? (
            <div className="odysseo-tools">
              <div className="tool-row primary-tools">
                <button
                  type="button"
                  className={`bubble-btn mode-toggle ${isTravelPlaying ? "active" : ""}`}
                  onClick={() => setIsTravelPlaying((current) => !current)}
                  disabled={!odysseoPath || odysseoPath.length < 2}
                  title={
                    odysseoPath && odysseoPath.length >= 2
                      ? isTravelPlaying
                        ? "Mettre la traversée en pause"
                        : "Lancer la traversée"
                      : "Trace un parcours d’abord"
                  }
                >
                  {isTravelPlaying ? "⏸ Pause" : "▶ Play"}
                </button>

                <button
                  type="button"
                  className="bubble-btn mode-toggle"
                  onClick={handleExportImmersion}
                  disabled={!odysseoPath || odysseoPath.length < 8}
                  title={
                    odysseoPath && odysseoPath.length >= 8
                      ? "Générer l’immersion sonore"
                      : "Trace un parcours d’abord"
                  }
                >
                  🎧 Générer
                </button>
              </div>

              <div className="tool-row trace-tools">
                <button
                  type="button"
                  className={`bubble-btn tool-chip ${odysseoTool === "draw" ? "active" : ""}`}
                  onClick={() => setOdysseoTool("draw")}
                  title="Dessiner le trajet"
                >
                  ✏️ Dessin
                </button>

                <button
                  type="button"
                  className={`bubble-btn tool-chip ${odysseoTool === "depth" ? "active" : ""}`}
                  onClick={() => setOdysseoTool("depth")}
                  title="Poser une ancre d’ambiance"
                >
                  ⚓ Ancre
                </button>

                <button
                  type="button"
                  className="bubble-btn tool-chip danger"
                  onClick={clearOdysseoPath}
                  title="Effacer le tracé"
                >
                  🧽 Effacer
                </button>
              </div>

              {odysseoTool === "depth" && (
                <div className="tool-row depth-tools">
                  {[1, 2, 3].map((depth) => (
                    <button
                      key={depth}
                      type="button"
                      className={`bubble-btn depth-choice depth-choice-${depth} ${
                        selectedDepth === depth ? "active" : ""
                      }`}
                      onClick={() => setSelectedDepth(depth)}
                      title={`Profondeur ${depth}`}
                    >
                      P{depth}
                    </button>
                  ))}
                </div>
              )}
            </div>
                    ) : (
            <div className="tool-row fish-tools">
              <button
                type="button"
                className={`bubble-btn mode-toggle ${eyesClosed ? "active" : ""}`}
                onClick={toggleEyesClosed}
                title={eyesClosed ? "Désactiver le mode aveugle" : "Activer le mode aveugle"}
                aria-label={eyesClosed ? "Mode aveugle actif" : "Mode aveugle inactif"}
              >
                👂
              </button>

              <div className="fish-sliders fish-sliders-layout">
                <label className="fish-slider-column" htmlFor="depth-slider-vertical">
                  <span className="slider-label">🌊 Profondeur</span>
                  <input
                    id="depth-slider-vertical"
                    className="slim-vertical-range depth"
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={selectedDepth}
                    onChange={(event) => { const depth = Number(event.target.value); setSelectedDepth(depth); setFishDepth(depth); }}
                  />
                  <span className="slider-value">{selectedDepth}</span>
                </label>

                <label className="fish-slider-row horizontal" htmlFor="zoom-slider-horizontal">
                  <span className="slider-label slider-label-top">🔍 Zoom</span>
                  <div className="fish-slider-horizontal-track">
                    <input
                      id="zoom-slider-horizontal"
                      className="slim-horizontal-range"
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={viewZoom}
                      onChange={(event) => setViewZoom(Number(event.target.value))}
                    />
                    <span className="slider-value">{viewZoom.toFixed(1)}</span>
                  </div>
                </label>

                <label className="fish-slider-column" htmlFor="speed-slider-vertical">
                  <span className="slider-label">⚡ Vitesse</span>
                  <input
                    id="speed-slider-vertical"
                    className="slim-vertical-range speed"
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={swimSpeedLevel}
                    onChange={(event) => { const level = Number(event.target.value); setSwimSpeedLevel(level); setSwimSpeed(SPEED_BY_LEVEL[level]); }}
                  />
                  <span className="slider-value">{swimSpeedLevel}</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {isOdysseo && (exportStatus || exportUrl) && (
        <div className="export-status">
          <span>{exportStatus}</span>
          {exportUrl && (
            <a href={exportUrl} download="soon-immersion.wav">
              Télécharger WAV
            </a>
          )}
        </div>
      )}

      <BubbleBucketsMenu
        open={bubbleBucketsOpen}
        bubbles={bubbles}
        onClose={() => setBubbleBucketsOpen(false)}
        onValidate={handleApplyBubbleBuckets}
      />

      <SidePanel
        mode={mode}
        selectedBubble={selectedBubble}
        selectedBeacon={selectedBeacon}
        circuitAutopilot={circuitAutopilot}
        onUpdateBeacon={(patch) => {
          if (!selectedBeaconId) return;
          updateBeacon(selectedBeaconId, patch);
        }}
        onStartCircuitAutopilot={startCircuitAutopilot}
        onStopCircuitAutopilot={stopCircuitAutopilot}
        onAutoGenerateTraceCircuit={autoGenerateTraceCircuit}
        onUpdateBubble={(id, patch) => updateBubble(id, patch)}
        onDeleteBubble={deleteBubble}
        forceOpenKey={editorOpenKey}
      />
    </main>
  );
}
