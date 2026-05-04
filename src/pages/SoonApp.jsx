import { useState } from "react";
import ModeDock from "../components/ModeDock.jsx";
import SidePanel from "../components/SidePanel.jsx";
import SoonCanvas from "../components/SoonCanvas.jsx";
import Profile from "./Profile.jsx";
import { useSoonStore } from "../store/useSoonStore.js";

export default function SoonApp({ onBack }) {
  const [page, setPage] = useState("arena");

  const {
    mode,
    bubbles,
    fish,
    selectedBubbleId,
    traceCircuit,
    selectedBeaconId,
    circuitAutopilot,
    path,
    resonanceNotes,
    eyesClosed,
    setMode,
    setFishTarget,
    tickFish,
    selectBubble,
    selectBeacon,
    moveBeacon,
    updateBeacon,
    startCircuitAutopilot,
    stopCircuitAutopilot,
    updateBubble,
    deleteBubble,
    addBubble,
    addPathPoint,
    clearPath,
    addResonanceNote,
  } = useSoonStore();

  const selectedBubble =
    bubbles.find((bubble) => bubble.id === selectedBubbleId) || null;

  const selectedBeacon =
    traceCircuit.find((beacon) => beacon.id === selectedBeaconId) || null;

  if (page === "profile") {
    return <Profile onBack={() => setPage("arena")} />;
  }

  return (
    <main className={eyesClosed ? "soon-app eyes-closed" : "soon-app"}>
      <header className="soon-topbar">
        <button className="ghost-btn" type="button" onClick={onBack}>
          ← Accueil
        </button>

        <div>
          <strong>Soon•°</strong>
          <span>
            {mode === "reso"
              ? circuitAutopilot
                ? `voyage résonant · P${fish.depth || 1}`
                : `résonance · P${fish.depth || 1}`
              : `composition · P${fish.depth || 1}`}
          </span>
        </div>

        <button
          className="ghost-btn"
          type="button"
          onClick={() => setPage("profile")}
        >
          Profil
        </button>
      </header>

      <SoonCanvas
        mode={mode}
        bubbles={bubbles}
        fish={fish}
        selectedBubbleId={selectedBubbleId}
        traceCircuit={traceCircuit}
        selectedBeaconId={selectedBeaconId}
        circuitAutopilot={circuitAutopilot}
        path={path}
        eyesClosed={eyesClosed}
        onFishTarget={setFishTarget}
        onTickFish={tickFish}
        onSelectBubble={selectBubble}
        onSelectBeacon={selectBeacon}
        onMoveBeacon={moveBeacon}
        onMoveBubble={updateBubble}
        onAddBubble={addBubble}
        onAddPathPoint={addPathPoint}
      />

      <ModeDock />

      <SidePanel
        mode={mode}
        selectedBubble={selectedBubble}
        selectedBeacon={selectedBeacon}
        circuitAutopilot={circuitAutopilot}
        onUpdateBeacon={(patch) => updateBeacon(selectedBeacon.id, patch)}
        onStartCircuitAutopilot={startCircuitAutopilot}
        onStopCircuitAutopilot={stopCircuitAutopilot}
        onUpdateBubble={(patch) => updateBubble(selectedBubble.id, patch)}
        onDeleteBubble={() => deleteBubble(selectedBubble.id)}
        notes={resonanceNotes}
        onAddNote={addResonanceNote}
        onClearPath={clearPath}
      />
    </main>
  );
}
