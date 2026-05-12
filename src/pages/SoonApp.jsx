import { useEffect, useState } from "react";
import SidePanel from "../components/SidePanel.jsx";
import SoonCanvas from "../components/SoonCanvas.jsx";
import Profile from "./Profile.jsx";
import { useSoonStore } from "../store/useSoonStore.js";

export default function SoonApp({ onBack }) {
  const [page, setPage] = useState("arena");
  const [interactionMode, setInteractionMode] = useState("swim");
  const [odysseoMode, setOdysseoMode] = useState("trace");
  const [viewZoom, setViewZoom] = useState(0);
  const [swimSpeed, setSwimSpeed] = useState(0.3);
  const [editorOpenKey, setEditorOpenKey] = useState(0);
  const [selectedDepth, setSelectedDepth] = useState(1);

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
        <div className="top-nav-inner">
          <button type="button" onClick={onBack}>
            Intro
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("compo");
              stopCircuitAutopilot();
              setInteractionMode("swim");
            }}
            className={mode === "compo" ? "active" : ""}
          >
            Compo
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("reso");
              stopCircuitAutopilot();
              setOdysseoMode("trace");
              setInteractionMode("swim");
            }}
            className={mode === "reso" ? "active" : ""}
          >
            Odysséo
          </button>

          <button type="button" onClick={() => setPage("profile")}>
            Perso
          </button>
        </div>
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
            tickOdysseoPath({ swimSpeed });
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
            <>
              <button
                type="button"
                className={`bubble-btn mode-toggle ${isOdysseoTrace ? "active" : ""}`}
                onClick={() => {
                  setOdysseoMode("trace");
                  stopCircuitAutopilot();
                }}
                title="Tracer le parcours"
              >
                ✏️ Tracer
              </button>

              <button
                type="button"
                className={`bubble-btn mode-toggle ${isOdysseoTravel ? "active" : ""}`}
                onClick={() => {
                  setOdysseoMode("travel");
                  stopCircuitAutopilot();
                }}
                title="Traverser le parcours"
              >
                ▶ Traverser
              </button>

              {isOdysseoTrace && (
                <>
                  <button
                    type="button"
                    className={`bubble-btn ${odysseoTool === "draw" ? "active" : ""}`}
                    onClick={() => setOdysseoTool("draw")}
                    title="Tracer"
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    className={`bubble-btn ${odysseoTool === "depth" ? "active" : ""}`}
                    onClick={() => setOdysseoTool("depth")}
                    title="Ancrer profondeur"
                  >
                    ⚓
                  </button>

                  {odysseoTool === "depth" && [1, 2, 3].map((depth) => (
                    <button
                      key={depth}
                      type="button"
                      className={`bubble-btn depth-choice ${selectedDepth === depth ? "active" : ""}`}
                      onClick={() => setSelectedDepth(depth)}
                      title={`Profondeur ${depth}`}
                    >
                      {depth}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="bubble-btn danger"
                    onClick={clearOdysseoPath}
                    title="Effacer"
                  >
                    🧽
                  </button>
                </>
              )}
            </>
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
