import { useEffect, useRef, useState } from "react";
import { useSoonCanvasLoop } from "./soon/useSoonCanvasLoop.js";
import { useSoonPointer } from "./soon/useSoonPointer.js";
import RadialMenu from "./RadialMenu.jsx";
import { getAudioTuning, setAudioTuning } from "../core/audioEngine.js";

function BlobContextMenu({ anchor, onSelect }) {
  const baseStyle = { position: "absolute", left: `${anchor?.x || 0}px`, top: `${anchor?.y || 0}px` };
  return (
    <div style={baseStyle} className="fish-blob-context-menu" aria-label="Menu expi inspi">
      <button type="button" className="fish-blob-half fish-blob-half-top" onClick={() => onSelect("expi")}>
        ↑ Expi
      </button>
      <button type="button" className="fish-blob-half fish-blob-half-bottom" onClick={() => onSelect("inspi")}>
        ↓ Inspi
      </button>
    </div>
  );
}

export default function SoonCanvas({
  mode,
  interactionMode = "swim",
  odysseoMode = "trace",
  bubbles,
  fish,
  selectedBubbleId,
  traceCircuit,
  odysseoPath,
  odysseoDepthMarkers,
  odysseoTool,
  selectedBeaconId,
  circuitAutopilot,
  eyesClosed,
  viewZoom,
  visualLight,
  depth,
  onFishTarget,
  onTickFish,
  onSelectBubble,
  onSelectBeacon,
  onMoveBeacon,
  onMoveBubble,
  onAddBubble,
  onAddPathPoint,
  onAddOdysseoPathPoint,
  onAddOdysseoDepthMarker,
  onBoostFishSpeed,
  onCycleBubbleDepth,
  onOpenBubbleEditor,
  onOpenBeaconEditor,
  onRecenterFish,
  onToggleEyesClosed,
  bubblesEnabled = true,
  bubblesIntensity = 1,
  onToggleBubbles,
  onSetBubblesIntensity,
  onResetFishContext,
  onToggleMembraneSide,
  worldGraph,
  currentArenaId,
  mazeByArena,
  arenaBlob,
  gamePaused = false,
  pendingBlobAction = null,
  onBlobAction,
  onSetFishDepth,
  echostory,
  onCollectEchostoryStar,
  contourPlaybackPaused = false,
  onToggleContourPlayback,
}) {
  const canvasRef = useRef(null);
  const [semioseVideo, setSemioseVideo] = useState(null);
  const [arenaCenterScreen, setArenaCenterScreen] = useState({ x: 0, y: 0 });
  const [fishMenu, setFishMenu] = useState(null);
  const [earActivationText, setEarActivationText] = useState("");
  const [audioTuning, setAudioTuningState] = useState(() => getAudioTuning());
  const [showSensitivitySlider, setShowSensitivitySlider] = useState(false);
  const [echostoryPrompt, setEchostoryPrompt] = useState(null);

  const cameraRef = useRef({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const arenaRef = useRef({
    radius: 1200,
  });

  const pointerRef = useRef({
    down: false,
    pointerId: null,
    dragBubbleId: null,
    pendingBubbleId: null,
    dragBeaconId: null,
    lastTapAt: 0,
    lastTapPos: null,
    lastTapTargetId: null,
    longPressTimer: null,
    longPressStartPoint: null,
    longPressTargetType: null,
    longPressTargetId: null,
    fishDepthHudUntil: 0,
    activePointers: new Map(),
    panEnabled: false,
    panStart: null,
    pinchDistance: null,
    startPoint: null,
  });

  const activeBubbleAudioRef = useRef(new Set());

  const stateRef = useRef({
    mode,
    interactionMode,
    odysseoMode,
    bubbles,
    fish,
      selectedBubbleId,
    traceCircuit,
    odysseoPath,
    odysseoDepthMarkers,
    odysseoTool,
    selectedBeaconId,
    circuitAutopilot,
    eyesClosed,
    viewZoom,
    visualLight,
    depth,
    bubblesEnabled,
    bubblesIntensity,
    worldGraph,
    currentArenaId,
    mazeByArena,
    arenaBlob,
    gamePaused,
    pendingBlobAction,
    echostory,
    contourPlaybackPaused,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      interactionMode,
      odysseoMode,
      bubbles,
      fish,
          selectedBubbleId,
      traceCircuit,
      odysseoPath,
      odysseoDepthMarkers,
      odysseoTool,
      selectedBeaconId,
      circuitAutopilot,
      eyesClosed,
      viewZoom,
      visualLight,
      depth,
      bubblesEnabled,
      bubblesIntensity,
      worldGraph,
      currentArenaId,
      mazeByArena,
      arenaBlob,
      gamePaused,
      pendingBlobAction,
      echostory,
      contourPlaybackPaused,
    };
  }, [
    mode,
    interactionMode,
    odysseoMode,
    bubbles,
    fish,
      selectedBubbleId,
    traceCircuit,
    odysseoPath,
    odysseoDepthMarkers,
    odysseoTool,
    selectedBeaconId,
    circuitAutopilot,
    eyesClosed,
    viewZoom,
    visualLight,
    depth,
    bubblesEnabled,
    bubblesIntensity,
    worldGraph,
    currentArenaId,
    mazeByArena,
    arenaBlob,
    gamePaused,
    pendingBlobAction,
    echostory,
    contourPlaybackPaused,
  ]);

  useEffect(() => {
    if (!pendingBlobAction || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const current = stateRef.current || {};
    const camera = cameraRef.current || { x: 0, y: 0 };
    const arenaRadius = current.arenaRadius || arenaRef.current.radius || 1200;
    const fitZoom = Math.min(rect.width, rect.height) / (arenaRadius * 2.55);
    const userZoom = fitZoom * (1 + (Number.isFinite(current.viewZoom) ? current.viewZoom : 0) * 1.55);
    const fishX = Number.isFinite(current?.fish?.x) ? current.fish.x : (pendingBlobAction.worldX || 0);
    const fishY = Number.isFinite(current?.fish?.y) ? current.fish.y : (pendingBlobAction.worldY || 0);
    const screenX = rect.width * 0.5 + (fishX - camera.x) * userZoom;
    const screenY = rect.height * 0.5 + (fishY - camera.y) * userZoom - 74;
    setFishMenu({ type: "blob", angle: pendingBlobAction.angle, screen: { x: screenX, y: screenY } });
  }, [pendingBlobAction]);

  useEffect(() => {
    if (!fishMenu || fishMenu.type !== "blob") return;
    if (!pendingBlobAction) {
      setFishMenu(null);
      return;
    }
    const menuAngle = Number.isFinite(fishMenu?.angle) ? fishMenu.angle : 0;
    const actionAngle = Number.isFinite(pendingBlobAction?.angle) ? pendingBlobAction.angle : 0;
    const angleDiff = Math.atan2(Math.sin(menuAngle - actionAngle), Math.cos(menuAngle - actionAngle));
    if (Math.abs(angleDiff) > 0.08) {
      setFishMenu(null);
      return;
    }
    const fishX = Number.isFinite(fish?.x) ? fish.x : 0;
    const fishY = Number.isFinite(fish?.y) ? fish.y : 0;
    const fishDistance = Math.hypot(fishX, fishY);
    const arenaRadius = stateRef.current?.arenaRadius || arenaRef.current.radius || 1200;
    const borderThreshold = Math.max(80, arenaRadius - 180);
    if (fishDistance < borderThreshold) {
      setFishMenu(null);
    }
  }, [fishMenu, fish?.x, fish?.y, pendingBlobAction]);

  useSoonCanvasLoop({
    canvasRef,
    cameraRef,
    arenaRef,
    stateRef,
    activeBubbleAudioRef,
    onTickFish,
    onSemioseVideoTrigger: setSemioseVideo,
    onCollectEchostoryStar,
    onPromptEchostoryStarCollect: (starId) => {
      setEchostoryPrompt({ starId, openedAt: Date.now() });
    },
  });

  useEffect(() => {
    if (!echostoryPrompt) return;
    const timeoutId = setTimeout(() => setEchostoryPrompt(null), 7000);
    return () => clearTimeout(timeoutId);
  }, [echostoryPrompt]);

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cleanupPointer,
  } = useSoonPointer({
    canvasRef,
    cameraRef,
    arenaRef,
    pointerRef,
    stateRef,
    onFishTarget,
    onSelectBubble,
    onSelectBeacon,
    onMoveBeacon,
    onMoveBubble,
    onAddBubble,
    onAddPathPoint,
    onAddOdysseoPathPoint,
    onAddOdysseoDepthMarker,
    onBoostFishSpeed,
    onCycleBubbleDepth,
    onOpenBubbleEditor,
    onOpenFishContextMenu: setFishMenu,
    onOpenBeaconEditor,
    onToggleContourPlayback,
  });

  useEffect(() => cleanupPointer, [cleanupPointer]);

  const previousEyesClosedRef = useRef(eyesClosed);
  useEffect(() => {
    const wasClosed = previousEyesClosedRef.current;
    previousEyesClosedRef.current = eyesClosed;
    if (eyesClosed && !wasClosed) {
      setEarActivationText("Oser le silence des yeux pour ouvrir les écoutilles 👂");
      const timeoutId = setTimeout(() => setEarActivationText(""), 2800);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [eyesClosed]);

  const handleEarButtonClick = () => {
    onToggleEyesClosed?.();
  };

  useEffect(() => {
    let frame = 0;

    const updateArenaCenterScreen = () => {
      const canvas = canvasRef.current;
      const current = stateRef.current || {};
      const camera = cameraRef.current || { x: 0, y: 0 };

      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const arenaRadius = current.arenaRadius || arenaRef.current.radius || 1200;
        const viewZoom = Number.isFinite(current.viewZoom) ? current.viewZoom : 0;
        const fitZoom = Math.min(rect.width, rect.height) / (arenaRadius * 2.55);
        const userZoom = fitZoom * (1 + viewZoom * 1.55);
        const world = current.worldGraph;
        const arenaId = current.currentArenaId || world?.startArenaId;
        const arenaNode = (world?.nodes || []).find((node) => node.id === arenaId) || null;
        const center = arenaNode?.absoluteCenter || { x: 0, y: 0 };
        const arenaCenterX = Number.isFinite(center.x) ? center.x : 0;
        const arenaCenterY = Number.isFinite(center.y) ? center.y : 0;

        setArenaCenterScreen({
          x: rect.width * 0.5 + (arenaCenterX - camera.x) * userZoom,
          y: rect.height * 0.5 + (arenaCenterY - camera.y) * userZoom,
        });
      }

      frame = requestAnimationFrame(updateArenaCenterScreen);
    };

    frame = requestAnimationFrame(updateArenaCenterScreen);
    return () => cancelAnimationFrame(frame);
  }, [arenaRef, cameraRef, canvasRef, stateRef]);

  return (
    <div className="soon-canvas-shell">
      <canvas
        ref={canvasRef}
        className="soon-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <button
        type="button"
        className={`arena-recenter-btn ${eyesClosed ? "is-active" : ""}`}
        style={{ left: `${arenaCenterScreen.x}px`, top: `${arenaCenterScreen.y}px` }}
        aria-label={eyesClosed ? "Mode aveugle actif" : "Mode aveugle inactif"}
        title="Activer/désactiver l’écoute"
        onClick={handleEarButtonClick}
      >
        👂
      </button>
      {earActivationText ? (
        <div className="ear-activation-text" role="status" aria-live="polite">
          {earActivationText}
        </div>
      ) : null}
      {semioseVideo?.url ? (
        <div
          key={semioseVideo.id}
          className="semiose-video-bubble"
          onAnimationEnd={() => setSemioseVideo(null)}
        >
          <video
            className="semiose-video"
            src={semioseVideo.url}
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      ) : null}
      {fishMenu && interactionMode === "swim" && fishMenu?.type === "blob" ? (
        <BlobContextMenu
          anchor={fishMenu.screen}
          onSelect={(action) => {
            onBlobAction?.(action, fishMenu?.angle);
            setFishMenu(null);
          }}
        />
      ) : null}
      {fishMenu && interactionMode === "swim" && fishMenu?.type !== "blob" ? (
        <RadialMenu
          aria-label="Menu contextuel poisson"
          anchor={fishMenu.screen}
          onClose={() => setFishMenu(null)}
          items={fishMenu?.type === "blob" ? [
            { id: "expi", label: "↑ Expi" },
            { id: "inspi", label: "↓ Inspi" },
          ] : [
            { id: "depth", label: "Profondeur" },
            { id: "bubbles", label: `Bulles ${bubblesEnabled ? "ON" : "OFF"}` },
            { id: "intensity", label: "Intensité bulles" },
            { id: "resonance", label: `Résonance ${Math.round(audioTuning.resonance * 100)}%` },
            { id: "detect", label: `Portée ${audioTuning.detection.toFixed(2)}x` },
            { id: "contrast", label: `Relief ${audioTuning.depthSeparation.toFixed(2)}x` },
            { id: "sensitivity", label: `Sensibilité ${Math.round((audioTuning.sensitivity || 0) * 100)}%` },
            { id: "membrane", label: fish?.membraneSide === "outside" ? "Aller intérieur" : "Aller extérieur" },
            { id: "reset", label: "Reset" },
          ]}
          onSelect={(item) => {
            if (fishMenu?.type === "blob") {
              onBlobAction?.(item.id, fishMenu?.angle);
              return;
            }
            if (item.id === "depth") onSetFishDepth?.(((Math.round(fish?.depth || 1) % 3) + 1));
            if (item.id === "bubbles") onToggleBubbles?.();
            if (item.id === "intensity") onSetBubblesIntensity?.(Math.min(2, (bubblesIntensity || 1) + 0.25));
            if (item.id === "resonance") {
              const next = audioTuning.resonance >= 0.95 ? 0 : audioTuning.resonance + 0.1;
              setAudioTuning({ resonance: next });
              setAudioTuningState(getAudioTuning());
            }
            if (item.id === "detect") {
              const next = audioTuning.detection >= 1.85 ? 0.7 : audioTuning.detection + 0.15;
              setAudioTuning({ detection: next });
              setAudioTuningState(getAudioTuning());
            }
            if (item.id === "contrast") {
              const next = audioTuning.depthSeparation >= 1.75 ? 0.45 : audioTuning.depthSeparation + 0.15;
              setAudioTuning({ depthSeparation: next });
              setAudioTuningState(getAudioTuning());
            }
            if (item.id === "sensitivity") setShowSensitivitySlider((v) => !v);
            if (item.id === "membrane") onToggleMembraneSide?.();
            if (item.id === "reset") onResetFishContext?.();
          }}
        />
      ) : null}
      {showSensitivitySlider && fishMenu?.screen ? (
        <div className="fish-sensitivity-slider" style={{ left: `${fishMenu.screen.x + 66}px`, top: `${fishMenu.screen.y + 12}px` }}>
          <label>
            👂 Sensibilité
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={Number(audioTuning.sensitivity || 0)}
              onChange={(event) => {
                const next = Number(event.target.value);
                setAudioTuning({ sensitivity: next });
                setAudioTuningState(getAudioTuning());
              }}
            />
          </label>
        </div>
      ) : null}
      {echostoryPrompt && mode === "echostory" ? (
        <div className="echostory-prompt-menu" role="dialog" aria-live="polite" aria-label="Cueillir l'étoile ?">
          <p>Cueillir cette étoile sonore ?</p>
          <div className="echostory-prompt-actions">
            <button
              type="button"
              onClick={() => {
                onCollectEchostoryStar?.(echostoryPrompt.starId);
                if (stateRef.current?.fish) {
                  stateRef.current.fish.tailPower = Math.min(18, Math.max(stateRef.current.fish.tailPower || 0, 1) + 1);
                }
                const stars = stateRef.current?.echostory?.stars || [];
                const star = stars.find((item) => item?.id === echostoryPrompt.starId);
                if (star) {
                  star.collectedTriggered = true;
                  star.collectPromptOpen = false;
                }
                setEchostoryPrompt(null);
              }}
            >
              Oui, cueillir
            </button>
            <button
              type="button"
              onClick={() => {
                const stars = stateRef.current?.echostory?.stars || [];
                const star = stars.find((item) => item?.id === echostoryPrompt.starId);
                if (star) {
                  star.collectPromptOpen = false;
                }
                setEchostoryPrompt(null);
              }}
            >
              Non
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
