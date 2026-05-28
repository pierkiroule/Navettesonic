import { useEffect, useMemo, useRef, useState } from "react";
import SidePanel from "../components/SidePanel.jsx";
import SoonCanvas from "../components/SoonCanvas.jsx";
import Profile from "./Profile.jsx";
import { useSoonStore } from "../store/useSoonStore.js";
import { renderImmersiveJourney } from "../core/immersiveExporter.js";
import { buildEchostoryText, buildStoryTimeline, buildPathStarsFromTimeline } from "../core/echostory/echostoryBuilder.js";
import { tickEchostoryTraversal } from "../core/echostory/echostoryTraversalEngine.js";
import { buildStarMp3Trace } from "../core/odysseoStarMp3Trace.js";
import { playBubbleSound, playOneShotFile } from "../core/audioEngine.js";
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
  normalizeOdysseoMode,
} from "../core/uiState.js";


const SWIM_SPEED = 1.15;
const ECHOSTORY_VOICE_BASE_URL = "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/sooncut";

export default function SoonApp({ onBack }) {
  const [page, setPage] = useState("arena");
  const [interactionMode, setInteractionMode] = useState("swim");
  const [odysseoMode, setOdysseoMode] = useState(ODYSSEO_MODE_TRACE);
  const [viewZoom, setViewZoom] = useState(1);
  const [isTravelPlaying, setIsTravelPlaying] = useState(false);
  const [contourPlaybackPaused, setContourPlaybackPaused] = useState(false);
  const [editorOpenKey, setEditorOpenKey] = useState(0);
  const UNIFIED_DEPTH = 1;
  const [exportStatus, setExportStatus] = useState("");
  const [exportUrl, setExportUrl] = useState(null);
  const [bubblesEnabled, setBubblesEnabled] = useState(false);
  const [bubblesIntensity, setBubblesIntensity] = useState(1);
  const [bubbleBucketsOpen, setBubbleBucketsOpen] = useState(false);
  const speedBoostUntilRef = useRef(0);
  const plumeTraceActiveRef = useRef(false);
  const plumeLastPointRef = useRef(null);
  const [soonTouchMode, setSoonTouchMode] = useState("plume");

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
    addTrailItem,
    clearTrailItems,
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
  const stars = echostory?.stars || [];
  const collectedInWave = stars.filter((star) => star?.collected).length;
  const isStoryReady = echostory?.phase === "story";
  const canGoNextWave = !isStoryReady && collectedInWave >= 5;
  const linearCompositionItems = (echostory?.trailItems || []).map((item, index) => ({
    id: item?.id || `trail-${index + 1}`,
    label: item?.label || `Élément ${index + 1}`,
    type: item?.kind || "trace",
  }));

  const handleTrailAction = (action, payload) => {
    if (action === "collect" && payload?.id) {
      addTrailItem(payload);
      return;
    }
    if (action === "play") {
      const items = echostory?.trailItems || [];
      items.forEach((item, index) => {
        window.setTimeout(() => {
          if (item?.kind === "bubble") {
            const bubble = bubbles.find((b) => b.id === item?.bubbleId);
            if (bubble) playBubbleSound(bubble);
            return;
          }
          if (item?.kind === "star") {
            const sampleIndex = Number.parseInt(String(item?.starId || "").match(/(\d{1,3})/)?.[1] || "", 10);
            if (!Number.isFinite(sampleIndex)) return;
            const n = String(sampleIndex);
            const n2 = String(sampleIndex).padStart(2, "0");
            const n3 = String(sampleIndex).padStart(3, "0");
            const candidates = [
              `${ECHOSTORY_VOICE_BASE_URL}/extrait_${n3}.mp3`,
              `${ECHOSTORY_VOICE_BASE_URL}/extrait_${n2}.mp3`,
              `${ECHOSTORY_VOICE_BASE_URL}/extrait_${n}.mp3`,
            ];
            const playHtmlFallback = (url) => {
              const audio = new Audio(url);
              audio.preload = "auto";
              audio.crossOrigin = "anonymous";
              audio.volume = 1;
              return audio.play();
            };
            playOneShotFile(candidates[0], { volume: 1 }).catch(() => {
              playOneShotFile(candidates[1], { volume: 1 }).catch(() => {
                playOneShotFile(candidates[2], { volume: 1 }).catch(() => {
                  playHtmlFallback(candidates[0]).catch(() => {
                    playHtmlFallback(candidates[1]).catch(() => {
                      playHtmlFallback(candidates[2]).catch(() => {});
                    });
                  });
                });
              });
            });
          }
        }, index * 900);
      });
    }
  };

  const flowStep = useMemo(() => {
    const starCount = echostory?.collectedStars?.length || 0;
    const hasPath = Array.isArray(odysseoPath) && odysseoPath.length >= 8;
    const phase = isOdysseo ? "navigo" : "compo";
    if (phase === "compo") {
      return {
        key: "compo",
        title: "1. Composer",
        tip: "Cueillez les étoiles vocales pour composer.",
      };
    }
    if (!hasPath) {
      return {
        key: "trace",
        title: "2. Tracer",
        tip: `Tracez un parcours (8 points mini). Étoiles prêtes: ${starCount}.`,
      };
    }
    return {
      key: "play",
      title: "3. Lire",
      tip: "Relisez la séance et exportez votre rendu immersif.",
    };
  }, [echostory?.collectedStars?.length, isOdysseo, odysseoPath]);

  const [stepTipVisible, setStepTipVisible] = useState(false);

  useEffect(() => {
    const fromHash = parseWorkflowFromHash(window.location.hash);
    const persistedRoot = readPersistedWorkflowRoot();

    if (fromHash?.root === "navigo") {
      setMode(SOON_MODE_RESO);
      setOdysseoMode(normalizeOdysseoMode(fromHash.odysseoMode));
      return;
    }

    if (persistedRoot === "navigo") {
      setMode(SOON_MODE_RESO);
      setOdysseoMode(ODYSSEO_MODE_TRACE);
      return;
    }
  }, [setMode]);

  useEffect(() => {
    const root = mode === SOON_MODE_COMPO ? "echostory" : "navigo";
    persistWorkflowRoot(root);
    window.history.replaceState(null, "", serializeWorkflowHash(root, odysseoMode));
  }, [mode, odysseoMode]);

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

    setExportStatus(`Tracé MP3 prêt (${mp3Trace.length} étoiles).`);
  };

  const handlePlayContourMp3 = () => {
    handleGenerateStarMp3Trace();
    if ((odysseoPath?.length || 0) < 8) {
      setExportStatus("Tracez d’abord le contour (min 8 points) pour lire la piste.");
      return;
    }
    handleComposeAndLaunchTraversal();
    setIsTravelPlaying(true);
    setContourPlaybackPaused(false);
    setExportStatus("Lecture MP3 du contour lancée.");
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

  useEffect(() => {
    plumeTraceActiveRef.current = false;
    plumeLastPointRef.current = null;
  }, [soonTouchMode]);

  const boostFishSpeed = () => {
    speedBoostUntilRef.current = Date.now() + 1200;
  };

  const cycleBubbleDepth = (id) => {
    const bubble = bubbles.find((item) => item.id === id);
    if (!bubble) return;

    selectBubble(id);
    updateBubble(id, { depth: UNIFIED_DEPTH });
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
          depth: UNIFIED_DEPTH,
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
        depth: UNIFIED_DEPTH,
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

    const stars = buildPathStarsFromTimeline({
      lines: previewLines,
      path: odysseoPath || [],
      collectedStars: echostory?.collectedStars || [],
    });
    useSoonStore.setState((state) => ({
      echostory: { ...state.echostory, stars },
    }));
  }, [isOdysseo, soonTouchMode, odysseoPath, echostory?.collectedStars, echostory?.traversalActive]);


  

  const handleFullArenaView = () => {
    setViewZoom(0);
    recenterFish();
  };

  const renderZoomControl = () => (
    <div className="tool-row fish-tools">
      <div className="fish-sliders fish-sliders-layout zoom-only-panel">
        <div className="zoom-panel-header">
          <span className="slider-label slider-label-top">🔍 Zoom arène</span>
          <strong className="zoom-value">{viewZoom.toFixed(1)}×</strong>
        </div>

        <div className="zoom-panel-body">
          <label className="fish-slider-row horizontal zoom-only" htmlFor="zoom-slider-horizontal">
            <span className="sr-only">Zoom arène</span>
            <div className="fish-slider-horizontal-track zoom-track">
              <span className="zoom-bound" aria-hidden="true">−</span>
              <input
                id="zoom-slider-horizontal"
                className="slim-horizontal-range"
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={viewZoom}
                onChange={(event) => setViewZoom(Number(event.target.value))}
                aria-label="Zoom arène"
              />
              <span className="zoom-bound" aria-hidden="true">+</span>
            </div>
          </label>

          <button
            type="button"
            className="zoom-full-arena-btn"
            onClick={handleFullArenaView}
            title="Recentrer automatiquement en vue totale de l’arène"
            aria-label="Recentrer automatiquement en vue totale de l’arène"
          >
            <span aria-hidden="true">◎</span>
            Vue totale
          </button>
        </div>
      </div>
    </div>
  );

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
    const stars = buildPathStarsFromTimeline({
      lines: currentLines,
      path: odysseoPath || [],
      collectedStars: echostory?.collectedStars || [],
    });
    useSoonStore.setState((state) => ({
      echostory: { ...state.echostory, storyTimeline, stars, timelineCursor: 0, activeLine: null },
    }));
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
        interactionMode={isOdysseo && odysseoTool === "depth" ? "circuit" : "swim"}
        odysseoMode={odysseoMode}
        bubbles={[]}
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
          const effectiveSwimSpeed = boosted ? SWIM_SPEED * 1.8 : SWIM_SPEED;
          if (isOdysseo) {
            if (isTravelPlaying) {
              if (contourPlaybackPaused) return;
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
              return;
            }

            tickFish({ swimSpeed: effectiveSwimSpeed, arenaRadius });

            if (plumeTraceActiveRef.current) {
              const fishNow = useSoonStore.getState()?.fish;
              if (Number.isFinite(fishNow?.x) && Number.isFinite(fishNow?.y)) {
                const previous = plumeLastPointRef.current;
                const dx = previous ? fishNow.x - previous.x : 999;
                const dy = previous ? fishNow.y - previous.y : 999;
                const distance = Math.hypot(dx, dy);
                if (!previous || distance >= 18) {
                  addOdysseoPathPoint(fishNow.x, fishNow.y);
                  plumeLastPointRef.current = { x: fishNow.x, y: fishNow.y };
                }
              }
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
        onAddBubble={() => {}}
        onAddPathPoint={addPathPoint}
        onAddOdysseoPathPoint={addOdysseoPathPoint}
        onAddOdysseoDepthMarker={(x, y) => {
          addOdysseoDepthMarker(x, y, UNIFIED_DEPTH);
        }}
        onOpenBubbleEditor={openBubbleEditor}
        onCycleBubbleDepth={cycleBubbleDepth}
        bubblesEnabled={bubblesEnabled}
        bubblesIntensity={bubblesIntensity}
        worldGraph={worldGraph}
        currentArenaId={currentArenaId}
        mazeByArena={mazeByArena}
        gamePaused={gamePaused}
        pendingBlobAction={pendingBlobAction}
        arenaBlob={arenaBlob}
        onToggleBubbles={() => {}}
        onSetBubblesIntensity={() => {}}
        onResetFishContext={() => { recenterFish(); }}
        onToggleMembraneSide={toggleMembraneSide}
        onBlobAction={applyBlobAction}
        onSetFishDepth={setFishDepth}
        echostory={echostory}
        onCollectEchostoryStar={collectEchostoryStar}
        contourPlaybackPaused={contourPlaybackPaused}
        onToggleContourPlayback={() => {
          setContourPlaybackPaused((paused) => {
            const next = !paused;
            setIsTravelPlaying(!next);
            return next;
          });
        }}
        soonTouchMode={soonTouchMode}
        onReleaseTrailItems={clearTrailItems}
        onPlayTrailItems={handleTrailAction}
        trailCount={(echostory?.trailItems || []).length}
      />





      {isEchostory && (
        <section className="echostory-hud" aria-live="polite">
          <span className="echostory-chip">Vague {waveIndex + 1} — {waveNames[waveIndex]}</span>
          <span className="echostory-chip">{collectedInWave} / 5 étoiles cueillies</span>
          {canGoNextWave && (
            <button type="button" className="echostory-next" onClick={advanceEchostoryWave}>
              Vague suivante
            </button>
          )}
        </section>
      )}

      {isOdysseo && (
        <section className="echostory-hud" aria-live="polite">
          <span className="echostory-chip">⭐ tisser des liens entre étoiles • 👂 écouter la traîne.</span>
          <span className="echostory-chip">En mode ⭐, les étoiles construisent une chronologie linéaire.</span>
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
                  className={`bubble-btn tool-chip ${odysseoTool === "depth" ? "active" : ""}`}
                  onClick={() => setOdysseoTool("depth")}
                  title="Poser une ancre d’ambiance"
                >
                  ⚓ Ancre
                </button>

                <button
                  type="button"
                  className="bubble-btn tool-chip danger"
                  onClick={() => {
                    clearOdysseoPath();
                    plumeLastPointRef.current = null;
                  }}
                  title="Effacer le tracé"
                >
                  🧽 Effacer
                </button>
              </div>

              {renderZoomControl()}
            </div>
          ) : (
            renderZoomControl()
          )}
        </div>
      </div>

      {isOdysseo && (
        <div className="mode-switch-bottom" role="group" aria-label="Modes tactiles Soon">
          <div className="mode-switch-pill">
            <button
              type="button"
              className={`mode-switch-button ${soonTouchMode === "plume" ? "active" : ""}`}
              onClick={() => setSoonTouchMode("plume")}
              aria-pressed={soonTouchMode === "plume"}
              title="Mode ⭐ tracé entre étoiles"
            >
              ⭐ Mode tracé
            </button>
            <button
              type="button"
              className={`mode-switch-button ${soonTouchMode === "ear" ? "active" : ""}`}
              onClick={() => setSoonTouchMode("ear")}
              aria-pressed={soonTouchMode === "ear"}
              title="Mode 👂 écoute de la traîne"
            >
              👂 Mode écoute
            </button>
          </div>
        </div>
      )}

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
