import { useEffect, useMemo, useRef, useState } from "react";
import SidePanel from "../components/SidePanel.jsx";
import SoonCanvas from "../components/SoonCanvas.jsx";
import WorkflowShell from "../components/WorkflowShell.jsx";
import Profile from "./Profile.jsx";
import BubbleBucketsMenu from "../components/BubbleBucketsMenu.jsx";
import { useSoonStore } from "../store/useSoonStore.js";
import { renderImmersiveJourney } from "../core/immersiveExporter.js";
import { buildEchostoryText } from "../core/echostory/echostoryBuilder.js";
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
    generateEchostoryText,
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
    "Cueillez les premières étoiles sensorielles.",
    "Laissez entrer l’étrange.",
    "Approchez du rêve.",
  ];
  const stars = echostory?.stars || [];
  const collectedInWave = stars.filter((star) => star?.collected).length;
  const canGoNextWave = collectedInWave >= 5;

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



  const handleGenerateEchostoryFromPath = () => {
    const skeleton = ECHOSTORY_SKELETONS[0];
    const story = buildEchostoryText({
      collectedStars: echostory?.collectedStars || [],
      path: odysseoPath || [],
      skeleton,
      silenceStyle: "dots",
    });
    setEchostoryDraft(story);
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
          <button
            type="button"
            className={`bubble-btn mode-toggle ${isEchostory ? "active" : ""}`}
            onClick={() => setMode(SOON_MODE_ECHOSTORY)}
            style={{ marginLeft: 8 }}
          >
            ✨ ÉchoStory
          </button>
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


      {activeRoot === WORKFLOW_ROOT_TUTO && (
        <section className="tutorial-panel" aria-label="Tutoriel Soon">
          <h3>Tuto•° — prise en main simple et pro</h3>
          <p>
            Bienvenue dans Soon•°. Tu vas créer un écho-système sonore en 2 étapes :
            <strong> Compo </strong>(tu construis), puis <strong>Navigo</strong> (tu fais voyager l’écoute).
          </p>
          <div className="tutorial-grid">
            <article>
              <h4>Étape 1 — Se déplacer</h4>
              <ul>
                <li><strong>Tap :</strong> le poisson-plume nage vers la zone visée.</li>
                <li><strong>Double-tap :</strong> active un boost court de vitesse.</li>
                <li><strong>Appui long :</strong> ouvre le menu radial contextuel.</li>
                <li><strong>Recentrer :</strong> remet le poisson au centre et relance ton orientation.</li>
              </ul>
              <p><strong>Validation :</strong> Je sais me déplacer librement.</p>
            </article>
            <article>
              <h4>Étape 2 — Créer et régler les bulles (Compo)</h4>
              <ul>
                <li><strong>Mode Éditer :</strong> double-tap vide pour créer 1 bulle.</li>
                <li><strong>Tap bulle :</strong> ouvre les réglages de ta bulle sonore.</li>
                <li><strong>Profondeur :</strong> règle P1/P2/P3 pour donner du relief.</li>
                <li><strong>Mission :</strong> crée 3 bulles avec des profondeurs différentes.</li>
              </ul>
              <p><strong>Validation :</strong> J’entends les variations selon la position et la profondeur.</p>
            </article>
            <article>
              <h4>Étape 3 — Tracer et jouer (Navigo)</h4>
              <ul>
                <li><strong>Outil Dessin ✏️ :</strong> trace le trajet d’écoute.</li>
                <li><strong>Outil Ancre ⚓ :</strong> place des jalons de profondeur (1, 2, 3).</li>
                <li><strong>Play / Pause :</strong> lance ou arrête la traversée du parcours.</li>
                <li><strong>Effacer 🧽 :</strong> nettoie le tracé pour recommencer un nouveau voyage.</li>
              </ul>
              <p><strong>Validation :</strong> J’ai joué mon premier parcours d’écoute.</p>
            </article>
            <article>
              <h4>Tips pro (optionnel)</h4>
              <ul>
                <li><strong>3 à 5 bulles max</strong> pour garder une scène lisible.</li>
                <li><strong>Contrastes clairs</strong> : profondeur, taille, rôle.</li>
                <li><strong>Récit d’écoute</strong> : entrée → tension → relâchement.</li>
                <li><strong>Itération courte</strong> : 1 modif = 1 réécoute.</li>
              </ul>
            </article>
          </div>
        </section>
      )}


      {isEchostory && (
        <section
          className="echostory-hud"
          style={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: 92,
            zIndex: 18,
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(8,16,28,0.86)",
            border: "1px solid rgba(150,180,255,0.28)",
            color: "#eaf4ff",
            backdropFilter: "blur(3px)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 4 }}>ÉchoStory</strong>
          <div style={{ fontSize: 13, opacity: 0.95, marginBottom: 4 }}>
            Vague actuelle : {waveIndex + 1}/3 — {waveNames[waveIndex]}
          </div>
          <div style={{ fontSize: 12, opacity: 0.82, marginBottom: 8 }}>
            Vague {waveIndex + 1} — {waveNames[waveIndex]} : "{waveCopy[waveIndex]}"
          </div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>{collectedInWave} / 5 étoiles cueillies</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="bubble-btn mode-toggle"
              onClick={generateEchostoryText}
              disabled={!canGoNextWave}
            >
              Vague suivante
            </button>
            <button
              type="button"
              className="bubble-btn mode-toggle"
              onClick={resetEchostory}
            >
              Réinitialiser
            </button>
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
                  onClick={handleGenerateEchostoryFromPath}
                  title="Générer un texte ÉchoStory depuis le tracé"
                >
                  ✍️ Générer ÉchoStory texte
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
