import { useEffect, useMemo, useRef, useState } from "react";
import SidePanel from "../components/SidePanel.jsx";
import SoonCanvas from "../components/SoonCanvas.jsx";
import EchostoryOverlay from "../components/EchostoryOverlay.jsx";
import WorkflowShell from "../components/WorkflowShell.jsx";
import Profile from "./Profile.jsx";
import BubbleBucketsMenu from "../components/BubbleBucketsMenu.jsx";
import { useSoonStore } from "../store/useSoonStore.js";
import { renderImmersiveJourney } from "../core/immersiveExporter.js";
import { buildEchostoryText, buildStoryTimeline, buildPathStarsFromTimeline } from "../core/echostory/echostoryBuilder.js";
import { tickEchostoryTraversal } from "../core/echostory/echostoryTraversalEngine.js";
import { buildStarMp3Trace } from "../core/odysseoStarMp3Trace.js";
import { ECHOSTORY_SKELETONS } from "../data/echostorySkeletons.js";
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
  SOON_MODE_ECHOSTORY,
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
  const [page, setPage] = useState("arena");
  const [activeRoot, setActiveRoot] = useState(WORKFLOW_ROOT_COMPO);
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
  const [fishCockpitFolded, setFishCockpitFolded] = useState(false);
  const [echostoryDraft, setEchostoryDraft] = useState(null);
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
    odysseoPathIndex,
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
    echostory,
    collectEchostoryStar,
    resetEchostory,
    advanceEchostoryWave,
    triggerEscapeCinematic,
    setEscapeState,
    startEchostoryTraversal,
    stopEchostoryTraversal,
    resetEchostoryTraversal,
    finishEchostoryTraversal,
    setEchostoryActiveLine,
  } = useSoonStore();

  const selectedBubble =
    bubbles.find((bubble) => bubble.id === selectedBubbleId) || null;

  const selectedBeacon =
    traceCircuit.find((beacon) => beacon.id === selectedBeaconId) || null;

  const isOdysseo = mode === SOON_MODE_RESO;
  const isEditMode = interactionMode === "edit";

  const isEchostory = mode === SOON_MODE_ECHOSTORY;
  const waveIndex = Math.max(0, Math.min(2, Number.isFinite(echostory?.waveIndex) ? echostory.waveIndex : 0));
  const waveNames = ["Immersion", "Bascule", "Ouverture"];
  const waveCopy = [
    "Entrez par les sensations.",
    "Laissez l’étrange apparaître.",
    "Approchez du rêve.",
  ];
  const stars = echostory?.stars || [];
  const collectedInWave = stars.filter((star) => star?.collected).length;
  const isStoryReady = echostory?.phase === "story";
  const canGoNextWave = !isStoryReady && collectedInWave >= 5;

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
        title: "Compo•°",
        tip: "Cueillez des étoiles de rêverie en trois vagues.",
      };
    }

    return {
      key: WORKFLOW_ROOT_NAVIGO,
      title: "Navigo",
      tip: "Tracez un parcours avec vos étoiles sonores récoltées.",
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


  const handleGenerateStarMp3Trace = () => {
    const mp3Trace = buildStarMp3Trace({
      collectedStars: echostory?.collectedStars || [],
      path: odysseoPath || [],
    });

    if (!mp3Trace.length) {
      setExportStatus("Cueillez d’abord des étoiles pour composer un tracé MP3.");
      return;
    }

    const title = "Navigo · Tracé composé d’étoiles MP3";
    const plainText = mp3Trace
      .map((item) => `${String(item.cue).padStart(2, "0")}. [${item.wave}] ${item.title} → ${item.suggestedFile}`)
      .join("\n");

    setEchostoryDraft({ titleSuggestion: title, plainText });
    setExportStatus(`Tracé MP3 prêt (${mp3Trace.length} étoiles).`);
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


  useEffect(() => {
    const nearEnd = (odysseoPathIndex || 0) >= Math.max(0, (odysseoPath?.length || 0) - 2);
    if (!isTravelPlaying || mode !== SOON_MODE_ECHOSTORY || !nearEnd) return;
    if ((echostory?.escapeState || "idle") !== "idle") return;
    triggerEscapeCinematic();
  }, [
    isTravelPlaying,
    mode,
    odysseoPath,
    odysseoPathIndex,
    echostory?.escapeState,
    triggerEscapeCinematic,
  ]);

  useEffect(() => {
    if (echostory?.escapeState !== "approach") return;
    const toOpening = setTimeout(() => setEscapeState("opening"), 2000);
    const toReleased = setTimeout(() => setEscapeState("released"), 4000);
    return () => {
      clearTimeout(toOpening);
      clearTimeout(toReleased);
    };
  }, [echostory?.escapeState, setEscapeState]);

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
          resonance: Number.isFinite(Number(draft.resonance)) ? Number(draft.resonance) : (existing.resonance ?? 0.75),
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
        resonance: Number.isFinite(Number(draft.resonance)) ? Number(draft.resonance) : 0.75,
      });
    });
  };




  useEffect(() => {
    if (!isOdysseo || (odysseoPath?.length || 0) < 2 || echostory?.traversalActive) return;

    const previewLines = buildEchostoryText({
      collectedStars: echostory?.collectedStars || [],
      path: odysseoPath || [],
      skeleton: ECHOSTORY_SKELETONS[0],
      silenceStyle: "dots",
    }).lines.map((line, index) => ({ id: line.id || `preview-${index + 1}`, text: line.text }));

    const stars = buildPathStarsFromTimeline({ lines: previewLines, path: odysseoPath || [] });
    useSoonStore.setState((state) => ({
      echostory: { ...state.echostory, stars },
    }));
  }, [isOdysseo, odysseoPath, echostory?.collectedStars, echostory?.traversalActive]);

  const handleComposeAndLaunchTraversal = () => {
    const currentLines = echostory?.storyTimeline?.length
      ? echostory.storyTimeline.map((line) => ({ id: line.id, text: line.text }))
      : buildEchostoryText({
          collectedStars: echostory?.collectedStars || [],
          path: odysseoPath || [],
          skeleton: ECHOSTORY_SKELETONS[0],
          silenceStyle: "dots",
        }).lines.map((line, index) => ({ ...line, id: `line-${index + 1}` }));

    const storyTimeline = buildStoryTimeline({ lines: currentLines, path: odysseoPath || [] });
    const stars = buildPathStarsFromTimeline({ lines: currentLines, path: odysseoPath || [] });
    useSoonStore.setState((state) => ({
      echostory: { ...state.echostory, storyTimeline, stars, timelineCursor: 0, activeLine: null },
    }));
    setEchostoryDraft({ titleSuggestion: "ÉchoStory tracée", plainText: currentLines.map((l) => l.text).join("\n") });
    startEchostoryTraversal();
    setIsTravelPlaying(true);
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
              if (echostory?.traversalActive) {
                const result = tickEchostoryTraversal(useSoonStore.getState(), { desiredDurationSec: 180 });
                if (!result) return;
                const fullState = useSoonStore.getState();
                const timeline = fullState?.echostory?.storyTimeline || [];
                const activeLine = timeline.reduce((best, item) => (
                  item.index <= result.echostoryPathIndex ? item : best
                ), null);
                useSoonStore.setState((state) => ({
                  fish: result.fish,
                  echostory: {
                    ...state.echostory,
                    traversalActive: result.traversalActive,
                    traversalFinished: result.traversalFinished,
                    echostoryPathIndex: result.echostoryPathIndex,
                    timelineCursor: activeLine?.index ?? state.echostory.timelineCursor ?? 0,
                    activeLine: activeLine?.text || null,
                    escapeState: result.escapeState,
                  },
                }));
                if (result.finished) {
                  finishEchostoryTraversal();
                  setIsTravelPlaying(false);
                }
                return;
              }
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
        onToggleEyesClosed={toggleEyesClosed}
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
        onSetFishDepth={setFishDepth}
        echostory={echostory}
        onCollectEchostoryStar={collectEchostoryStar}
      />





      {isEchostory && (
        <section className="echostory-hud" aria-live="polite">
          <span className="echostory-chip">Vague {waveIndex + 1} — {waveNames[waveIndex]}</span>
          <span className="echostory-chip">{collectedInWave} / 5 étoiles cueillies</span>
          <span className="echostory-chip">{waveCopy[waveIndex]}</span>
          {canGoNextWave && (
            <button type="button" className="echostory-next" onClick={advanceEchostoryWave}>
              Vague suivante
            </button>
          )}
          {isStoryReady && <span className="echostory-chip">Votre matière de rêverie est prête. Passez dans Navigo.</span>}
        </section>
      )}

      {isOdysseo && (
        <section className="echostory-hud" aria-live="polite">
          <span className="echostory-chip">Navigo: tracez un parcours qui rejoue vos étoiles sonores.</span>
          <span className="echostory-chip">Étoiles récoltées: {(echostory?.collectedStars || []).length} / 15</span>
        </section>
      )}

      <div className={`cockpit ${isOdysseo ? "odysseo-cockpit" : ""}`}>
        <div className="cockpit-buttons">
          {isOdysseo ? (
            <div className="odysseo-tools">
              <div className="tool-row primary-tools">
                <button
                  type="button"
                  className={`bubble-btn mode-toggle ${echostory?.traversalActive ? "active" : ""}`}
                  onClick={() => {
                    if (echostory?.traversalActive) {
                      stopEchostoryTraversal();
                      setEchostoryActiveLine(null);
                      setIsTravelPlaying(false);
                      return;
                    }
                    handleComposeAndLaunchTraversal();
                  }}
                  disabled={!odysseoPath || odysseoPath.length < 8}
                  title="Lancer la traversée"
                >
                  {echostory?.traversalActive ? "Mettre en pause" : "✨ Lire le tracé"}
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
                  🎧 Rendu immersion
                </button>

                <button
                  type="button"
                  className="bubble-btn mode-toggle"
                  onClick={handleGenerateStarMp3Trace}
                  title="Composer un tracé d’étoiles MP3"
                >
                  ⭐ Composer le tracé étoiles
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

              <div className="tool-row fish-tools">
                <div className={`fish-sliders fish-sliders-layout ${fishCockpitFolded ? "folded" : ""}`}>
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
                    <button
                      type="button"
                      className="bubble-btn mode-toggle"
                      onClick={handleOpenBubbleBuckets}
                      title="🫧 Déclenchement tactile"
                      aria-label="Ouvrir l’éditeur des bulles sonores"
                    >
                      🫧
                    </button>
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

                  <button
                    type="button"
                    className="bubble-btn fish-cockpit-fold-toggle"
                    onClick={() => setFishCockpitFolded((value) => !value)}
                    aria-label={fishCockpitFolded ? "Déplier le mini cockpit" : "Replier le mini cockpit"}
                    title={fishCockpitFolded ? "Déplier" : "Replier"}
                  >
                    {fishCockpitFolded ? "▾" : "▴"}
                  </button>
                </div>
              </div>
            </div>
                    ) : (
          <div className="tool-row fish-tools">
              <div className={`fish-sliders fish-sliders-layout ${fishCockpitFolded ? "folded" : ""}`}>
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
                  <button
                    type="button"
                    className="bubble-btn mode-toggle"
                    onClick={handleOpenBubbleBuckets}
                    title="🫧 Déclenchement tactile"
                    aria-label="Ouvrir l’éditeur des bulles sonores"
                  >
                    🫧
                  </button>
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

                <button
                  type="button"
                  className="bubble-btn fish-cockpit-fold-toggle"
                  onClick={() => setFishCockpitFolded((value) => !value)}
                  aria-label={fishCockpitFolded ? "Déplier le mini cockpit" : "Replier le mini cockpit"}
                  title={fishCockpitFolded ? "Déplier" : "Replier"}
                >
                  {fishCockpitFolded ? "▾" : "▴"}
                </button>
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


      {isOdysseo && echostoryDraft && (
        <section className="export-status" style={{ maxWidth: 560, whiteSpace: "pre-wrap" }}>
          <strong>{echostoryDraft.titleSuggestion}</strong>
          <div style={{ marginTop: 8 }}>{echostoryDraft.plainText}</div>
        </section>
      )}


      {mode === SOON_MODE_ECHOSTORY && (echostory?.escapeState === "approach" || echostory?.escapeState === "opening") && (
        <section
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            background: "rgba(3,10,22,0.22)",
            color: "#eef6ff",
            textAlign: "center",
            padding: 24,
            fontSize: "clamp(18px, 5vw, 30px)",
            textShadow: "0 2px 14px rgba(0,0,0,0.5)",
          }}
        >
          <strong>
            {echostory?.escapeState === "approach" ? "Soon trouve une ouverture…" : "Le bocal s’ouvre…"}
          </strong>
        </section>
      )}
      <EchostoryOverlay line={echostory?.activeLine} visible={Boolean(echostory?.traversalActive && echostory?.activeLine)} />

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
