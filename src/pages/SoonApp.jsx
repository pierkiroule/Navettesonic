import { useEffect, useMemo, useRef, useState } from "react";
import SidePanel from "../components/SidePanel.jsx";
import SoonCanvas from "../components/SoonCanvas.jsx";
import WorkflowShell from "../components/WorkflowShell.jsx";
import Profile from "./Profile.jsx";
import { useSoonStore } from "../store/useSoonStore.js";
import { renderImmersiveJourney } from "../core/immersiveExporter.js";
import {
  parseWorkflowFromHash,
  persistWorkflowRoot,
  readPersistedWorkflowRoot,
  serializeWorkflowHash,
} from "../core/workflowShellState.js";

const NOMBRILO_ONE_SHOT_URL = "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/nombrilo/nombrilo.mp3";

export default function SoonApp({ onBack }) {
  const [page, setPage] = useState("arena");
  const [interactionMode, setInteractionMode] = useState("swim");
  const [odysseoMode, setOdysseoMode] = useState("trace");
  const [viewZoom, setViewZoom] = useState(0.5);
  const [swimSpeed, setSwimSpeed] = useState(0.3);
  const [isTravelPlaying, setIsTravelPlaying] = useState(false);
  const [editorOpenKey, setEditorOpenKey] = useState(0);
  const [selectedDepth, setSelectedDepth] = useState(1);
  const [exportStatus, setExportStatus] = useState("");
  const [exportUrl, setExportUrl] = useState(null);
  const [bubblesEnabled, setBubblesEnabled] = useState(true);
  const [bubblesIntensity, setBubblesIntensity] = useState(1);
  const nombriloAudioRef = useRef(null);

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
  } = useSoonStore();

  const selectedBubble =
    bubbles.find((bubble) => bubble.id === selectedBubbleId) || null;

  const selectedBeacon =
    traceCircuit.find((beacon) => beacon.id === selectedBeaconId) || null;

  const isOdysseo = mode === "reso";
  const isEditMode = interactionMode === "edit";


  const flowStep = useMemo(() => {
    if (mode === "compo") {
      return {
        key: "compo",
        title: "Composer",
        tip: "Choisissez vos éléments et organisez votre scène.",
      };
    }

    return {
      key: "navigo",
      title: "Navigo",
      tip: "Trace, ancre et lance la lecture du parcours depuis un seul espace.",
    };
  }, [mode]);

  const [stepTipVisible, setStepTipVisible] = useState(false);

  useEffect(() => {
    const fromHash = parseWorkflowFromHash(window.location.hash);
    const persistedRoot = readPersistedWorkflowRoot();

    if (fromHash?.root === "navigo") {
      setMode("reso");
      setOdysseoMode(fromHash.odysseoMode || "trace");
      return;
    }

    if (persistedRoot === "navigo") {
      setMode("reso");
      setOdysseoMode("trace");
    }
  }, [setMode]);

  useEffect(() => {
    const root = mode === "compo" ? "compo" : "navigo";
    persistWorkflowRoot(root);
    window.history.replaceState(null, "", serializeWorkflowHash(root, odysseoMode));
  }, [mode, odysseoMode]);

  const setWorkflowRoot = (root) => {
    stopCircuitAutopilot();
    setInteractionMode("swim");
    setIsTravelPlaying(false);

    if (root === "navigo") {
      setMode("reso");
      setOdysseoMode((current) => current || "trace");
      return;
    }

    setMode("compo");
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

  const cycleBubbleDepth = (id) => {
    const bubble = bubbles.find((item) => item.id === id);
    if (!bubble) return;

    const nextDepth = (Math.round(bubble.depth || 1) % 3) + 1;

    selectBubble(id);
    updateBubble(id, { depth: nextDepth });
    setEditorOpenKey((value) => value + 1);
  };

  const handleRecenterFish = () => {
    stopCircuitAutopilot();

    if (!nombriloAudioRef.current) {
      nombriloAudioRef.current = new Audio(NOMBRILO_ONE_SHOT_URL);
      nombriloAudioRef.current.preload = "auto";
    }

    try {
      nombriloAudioRef.current.currentTime = 0;
      void nombriloAudioRef.current.play();
    } catch {
      // ignore audio gesture failures silently
    }

    toggleEyesClosed();
    recenterFish();
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
            activeRoot={mode === "compo" ? "compo" : "navigo"}
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
          if (isOdysseo) {
            if (isTravelPlaying) {
              tickOdysseoPath({ swimSpeed });
            }
            return;
          }

          if (isEditMode) return;

          tickFish({ swimSpeed, arenaRadius });
        }}
        onSetFishDepth={setFishDepth}
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
        onRecenterFish={handleRecenterFish}
        onCycleBubbleDepth={cycleBubbleDepth}
        bubblesEnabled={bubblesEnabled}
        bubblesIntensity={bubblesIntensity}
        onToggleBubbles={() => setBubblesEnabled((v) => !v)}
        onSetBubblesIntensity={setBubblesIntensity}
        onResetFishContext={() => { setBubblesEnabled(true); setBubblesIntensity(1); recenterFish(); }}
      />

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
                className={`bubble-btn mode-toggle ${isEditMode ? "active" : ""}`}
                onClick={toggleInteractionMode}
                title={isEditMode ? "Passer en mode nager" : "Passer en mode éditer"}
                aria-label={isEditMode ? "Mode éditer actif" : "Mode nager actif"}
              >
                {isEditMode ? "✏️" : "🐟"}
              </button>
              {!isEditMode && (
                <>
                  <button
                    type="button"
                    className={`bubble-btn tool-chip ${bubblesEnabled ? "active" : ""}`}
                    onClick={() => setBubblesEnabled((value) => !value)}
                    title="Activer / couper les bulles"
                  >
                    {bubblesEnabled ? "🫧 Bulles ON" : "🫧 Bulles OFF"}
                  </button>
                  <button
                    type="button"
                    className="bubble-btn tool-chip"
                    onClick={() => setBubblesIntensity((value) => Math.min(2, value + 0.25))}
                    title="Augmenter l’intensité des bulles"
                  >
                    🧪 Intensité {bubblesIntensity.toFixed(2)}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className={`global-sliders ${isOdysseo ? "odysseo-layout" : ""}`}>
          <div className="global-slider zoom-slider">
            <span>🔍</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={viewZoom}
              onChange={(event) => setViewZoom(Number(event.target.value))}
            />
            <span>{viewZoom.toFixed(1)}</span>
          </div>

          {isOdysseo && (
            <div className="global-slider odysseo-speed-slider speed-slider">
              <span>⚡</span>
              <input
                type="range"
                min="0.3"
                max="2"
                step="0.05"
                value={swimSpeed}
                onChange={(event) => setSwimSpeed(Number(event.target.value))}
              />
              <span>{swimSpeed <= 0 ? "Arrêt" : `${swimSpeed.toFixed(2)}×`}</span>
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
