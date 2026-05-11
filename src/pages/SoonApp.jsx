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
  const [depth, setDepth] = useState(1);
  const [editorOpenKey, setEditorOpenKey] = useState(0);

  // "zoom" | "speed" | "depth" | null
  const [activeSlider, setActiveSlider] = useState(null);

  const {
    mode,
    bubbles,
    fish,
    selectedBubbleId,
    traceCircuit,
    selectedBeaconId,
    circuitAutopilot,
    path,
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
    addPathPoint,
    updateBubble,
    deleteBubble,
  } = useSoonStore();

  const selectedBubble = bubbles.find((bubble) => bubble.id === selectedBubbleId) || null;
  const selectedBeacon = traceCircuit.find((beacon) => beacon.id === selectedBeaconId) || null;

  const toggle = (key) =>
    setActiveSlider((cur) => (cur === key ? null : key));

  if (page === "profile") {
    return <Profile onBack={() => setPage("arena")} />;
  }

  return (
    <main className="soon-app">

      {/* TOP NAV */}
      

<header className="top-nav">
  <div className="top-nav-inner">

    <button onClick={onBack}>
      Intro
    </button>

    <button onClick={() => setMode("compo")} className={mode==="compo"?"active":""}>
      Compo
    </button>

    <button onClick={() => setMode("reso")} className={mode==="reso"?"active":""}>
      Odysséo
    </button>

    <button onClick={() => setPage("profile")}>
      Perso
    </button>

  </div>
</header>



      {/* CANVAS */}
      <SoonCanvas
        mode={mode}
        interactionMode={interactionMode}
        bubbles={bubbles}
        fish={fish}
        selectedBubbleId={selectedBubbleId}
        traceCircuit={traceCircuit}
        selectedBeaconId={selectedBeaconId}
        circuitAutopilot={circuitAutopilot}
        path={path}
        eyesClosed={eyesClosed}
        viewZoom={viewZoom}
        depth={depth}
        onFishTarget={setFishTarget}
        onTickFish={() => {
          if (interactionMode === "edit") return;
          tickFish({ swimSpeed, depth });
        }}
        onSetFishDepth={setFishDepth}
        onSelectBubble={selectBubble}
        onSelectBeacon={selectBeacon}
        onMoveBeacon={moveBeacon}
        onMoveBubble={(id, pos) => updateBubble(id, pos)}
        onAddBubble={addBubble}
        onAddPathPoint={addPathPoint}
        onOpenBubbleEditor={(id) => {
          selectBubble(id);
          setEditorOpenKey((value) => value + 1);
        }}
        onCycleBubbleDepth={(id) => {
          const bubble = bubbles.find((item) => item.id === id);
          if (!bubble) return;
          setEditorOpenKey((value) => value + 1);
          selectBubble(id);
          updateBubble(id, { depth: (Math.round(bubble.depth || 1) % 3) + 1 });
        }}
      />

      <div className="mode-switch-bottom">
        <div className="mode-switch-pill" role="tablist" aria-label="Mode tactile">
          <button
            type="button"
            className={`mode-switch-button ${interactionMode === "swim" ? "active" : ""}`}
            onClick={() => setInteractionMode("swim")}
            aria-pressed={interactionMode === "swim"}
          >
            Nager
          </button>
          <button
            type="button"
            className={`mode-switch-button ${interactionMode === "edit" ? "active" : ""}`}
            onClick={() => setInteractionMode("edit")}
            aria-pressed={interactionMode === "edit"}
          >
            Éditer
          </button>
        </div>
      </div>

      {/* COCKPIT */}
      <div className="cockpit">

        {/* BOUTONS */}
        <div className="cockpit-buttons">
          <button
            className={`bubble-btn zoom ${activeSlider==="zoom"?"active":""}`}
            onClick={() => toggle("zoom")}
            title="Zoom"
          >🔍</button>

          <button
            className={`bubble-btn speed ${activeSlider==="speed"?"active":""}`}
            onClick={() => toggle("speed")}
            title="Vitesse"
          >⚡</button>

          <button
            className={`bubble-btn depth ${activeSlider==="depth"?"active":""}`}
            onClick={() => toggle("depth")}
            title="Profondeur"
          >🌊</button>
        </div>

        {/* SLIDERS */}
        <div className={`slider-panel ${activeSlider ? "open" : ""}`}>

          {activeSlider === "zoom" && (
            <div className="slider zoom">
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={viewZoom}
                onChange={(e) => setViewZoom(Number(e.target.value))}
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
                onChange={(e) => setSwimSpeed(Number(e.target.value))}
              />
              <span>Speed {swimSpeed.toFixed(1)}×</span>
            </div>
          )}

          {activeSlider === "depth" && (
            <div className="slider depth">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
              />
              <span>Depth {depth.toFixed(1)}</span>
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
