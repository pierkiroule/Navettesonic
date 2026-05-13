import { useEffect, useMemo, useState } from "react";
import SidePanel from "../components/SidePanel.jsx";
import SoonCanvas from "../components/SoonCanvas.jsx";
import Profile from "./Profile.jsx";
import { useSoonStore } from "../store/useSoonStore.js";
import { renderImmersiveJourney } from "../core/immersiveExporter.js";

export default function SoonApp({ onBack }) {
  const [page, setPage] = useState("arena");
  const [interactionMode, setInteractionMode] = useState("swim");
  const [odysseoMode, setOdysseoMode] = useState("trace");
  const [viewZoom, setViewZoom] = useState(0);
  const [swimSpeed, setSwimSpeed] = useState(0.3);
  const [isTravelPlaying, setIsTravelPlaying] = useState(false);
  const [editorOpenKey, setEditorOpenKey] = useState(0);
  const [selectedDepth, setSelectedDepth] = useState(1);
  const [exportStatus, setExportStatus] = useState("");
  const [exportUrl, setExportUrl] = useState(null);

  const {
    mode,
    bubbles,
    fish,
    selectedBubbleId,
    traceCircuit,
    selectedBeaconId,
    circuitAutopilot,
    eyesClosed,

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
  const isOdysseoTrace = isOdysseo && odysseoMode === "trace";
  const isOdysseoTravel = isOdysseo && odysseoMode === "travel";
  const isEditMode = interactionMode === "edit";


  const flowStep = useMemo(() => {
    if (mode === "compo") {
      return {
        key: "compo",
        title: "Composer",
        tip: "Choisissez vos éléments et organisez votre scène.",
      };
    }

    if (isOdysseoTrace) {
      return {
        key: "trace",
        title: "Tracer",
        tip: "Dessinez votre trajectoire avec la plume.",
      };
    }

    return {
      key: "travel",
      title: "Traverser",
      tip: "Lancez le parcours et ajustez avec la boussole.",
    };
  }, [mode, isOdysseoTrace]);

  const [stepTipVisible, setStepTipVisible] = useState(false);

  useEffect(() => {
    setStepTipVisible(true);
    const timeoutId = setTimeout(() => {
      setStepTipVisible(false);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [flowStep.key]);

  useEffect(() => {
    setMode("compo");
    stopCircuitAutopilot();
    setOdysseoMode("trace");
    setInteractionMode("swim");
  }, []);

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

        <div className="top-nav-flow" role="group" aria-label="Flow principal">

          <button
            type="button"
            onClick={() => {
              setMode("compo");
              stopCircuitAutopilot();
              setInteractionMode("swim");
            }}
            className={mode === "compo" ? "active" : ""}

            aria-label="Composer"
            title="Composer"
          >
            🎨
          </button>

          <button
            type="button"
            onClick={() => {
              if (mode !== "reso") setMode("reso");
              stopCircuitAutopilot();
              setOdysseoMode("trace");
              setInteractionMode("swim");
              setIsTravelPlaying(false);
            }}
            className={isOdysseoTrace ? "active" : ""}

            aria-label="Tracer"
            title="Tracer"
          >
            🪶
          </button>

          <button
            type="button"
            onClick={() => {
              if (mode !== "reso") setMode("reso");
              stopCircuitAutopilot();
              setOdysseoMode("travel");
              setInteractionMode("swim");
              setIsTravelPlaying(false);
            }}
            className={isOdysseoTravel ? "active" : ""}

            aria-label="Traverser"
            title="Traverser"
          >
            🧭
          </button>

          <span
            className={`flow-progress ${
              mode === "compo" ? "step-1" : isOdysseoTrace ? "step-2" : "step-3"
            }`}
            aria-hidden="true"
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
        interactionMode={isOdysseoTrace ? "circuit" : interactionMode}
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
        onFishTarget={setFishTarget}
        onTickFish={() => {
          if (isOdysseoTravel) {
            if (isTravelPlaying) {
              tickOdysseoPath({ swimSpeed });
            }
            return;
          }

          if (isEditMode || isOdysseoTrace) return;

          tickFish({ swimSpeed });
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
        onCycleBubbleDepth={cycleBubbleDepth}
      />

      <div className={`cockpit ${isOdysseo ? "odysseo-cockpit" : ""}`}>
        <div className="cockpit-buttons">
          {isOdysseo ? (
            <div className="odysseo-tools">
              {isOdysseoTravel && (
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
              )}

              {isOdysseoTrace && (
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
              )}

              {isOdysseoTrace && odysseoTool === "depth" && (
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
            <button
              type="button"
              className={`bubble-btn mode-toggle ${isEditMode ? "active" : ""}`}
              onClick={toggleInteractionMode}
              title={isEditMode ? "Passer en mode nager" : "Passer en mode éditer"}
              aria-label={isEditMode ? "Mode éditer actif" : "Mode nager actif"}
            >
              {isEditMode ? "✏️" : "🐟"}
            </button>
          )}
        </div>

        <div className="global-sliders">
          <div className="global-slider">
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

          {isOdysseoTravel && (
            <div className="global-slider odysseo-speed-slider">
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
