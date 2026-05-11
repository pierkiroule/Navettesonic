import { useState } from "react";
import SidePanel from "../components/SidePanel.jsx";
import SoonCanvas from "../components/SoonCanvas.jsx";
import Profile from "./Profile.jsx";
import { useSoonStore } from "../store/useSoonStore.js";

export default function SoonApp({ onBack }) {
  const [page, setPage] = useState("arena");
  const [interactionMode, setInteractionMode] = useState("swim");
  const [viewZoom, setViewZoom] = useState(1);
  const [swimSpeed, setSwimSpeed] = useState(1);
  const [editorOpenKey, setEditorOpenKey] = useState(0);
  const [activeSlider, setActiveSlider] = useState(null);

  const {
    mode,
    bubbles,
    fish,
    selectedBubbleId,
    traceCircuit,
    selectedBeaconId,
    circuitAutopilot,
    eyesClosed,
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
    updateBubble,
    deleteBubble,
  } = useSoonStore();

  const selectedBubble =
    bubbles.find((bubble) => bubble.id === selectedBubbleId) || null;

  const selectedBeacon =
    traceCircuit.find((beacon) => beacon.id === selectedBeaconId) || null;

  const isEditMode = interactionMode === "edit";

  const toggleSlider = (key) => {
    setActiveSlider((current) => (current === key ? null : key));
  };

  const toggleInteractionMode = () => {
    setInteractionMode((current) => {
      const next = current === "edit" ? "swim" : "edit";

      if (next === "swim") {
        selectBubble(null);
      }

      setActiveSlider(null);
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
            onClick={() => setMode("compo")}
            className={mode === "compo" ? "active" : ""}
          >
            Compo
          </button>

          <button
            type="button"
            onClick={() => setMode("reso")}
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
        interactionMode={interactionMode}
        bubbles={bubbles}
        fish={fish}
        selectedBubbleId={selectedBubbleId}
        traceCircuit={traceCircuit}
        selectedBeaconId={selectedBeaconId}
        circuitAutopilot={circuitAutopilot}
        eyesClosed={eyesClosed}
        viewZoom={viewZoom}
        onFishTarget={setFishTarget}
        onTickFish={() => {
          if (isEditMode) return;
          tickFish({ swimSpeed });
        }}
        onSetFishDepth={setFishDepth}
        onSelectBubble={selectBubble}
        onSelectBeacon={selectBeacon}
        onMoveBeacon={moveBeacon}
        onMoveBubble={(id, pos) => updateBubble(id, pos)}
        onAddBubble={addBubble}
        onOpenBubbleEditor={openBubbleEditor}
        onCycleBubbleDepth={cycleBubbleDepth}
      />

      <div className="cockpit">
        <div className="cockpit-buttons">
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
                className={`bubble-btn zoom ${activeSlider === "zoom" ? "active" : ""}`}
                onClick={() => toggleSlider("zoom")}
                title="Zoom"
              >
                🔍
              </button>

              <button
                type="button"
                className={`bubble-btn speed ${activeSlider === "speed" ? "active" : ""}`}
                onClick={() => toggleSlider("speed")}
                title="Vitesse"
              >
                ⚡
              </button>
            </>
          )}
        </div>

        {!isEditMode && (
          <div className={`slider-panel ${activeSlider ? "open" : ""}`}>
            {activeSlider === "zoom" && (
              <div className="slider zoom">
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.1"
                  value={viewZoom}
                  onChange={(event) => setViewZoom(Number(event.target.value))}
                />
                <span>Zoom {viewZoom.toFixed(1)}×</span>
              </div>
            )}

            {activeSlider === "speed" && (
              <div className="slider speed">
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={swimSpeed}
                  onChange={(event) => setSwimSpeed(Number(event.target.value))}
                />
                <span>Vitesse {swimSpeed.toFixed(1)}×</span>
              </div>
            )}
          </div>
        )}
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
