import { useEffect, useRef, useState } from "react";
import { useSoonCanvasLoop } from "./soon/useSoonCanvasLoop.js";
import { useSoonPointer } from "./soon/useSoonPointer.js";
import RadialMenu from "./RadialMenu.jsx";
import { getAudioTuning, setAudioTuning } from "../core/audioEngine.js";
import { ARENA_INNER_BOUNDARY_INSET, MEMBRANE_LEVEL_MULTIPLIERS } from "../core/constants.js";


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
  soonTouchMode = "bubble",
  onReleaseTrailItems,
  onPlayTrailItems,
  trailCount = 0,
}) {
  const canvasRef = useRef(null);
  const [semioseVideo, setSemioseVideo] = useState(null);
  const [fishMenu, setFishMenu] = useState(null);
  const [audioTuning, setAudioTuningState] = useState(() => getAudioTuning());
  const [showSensitivitySlider, setShowSensitivitySlider] = useState(false);
  const [contourPlayButton, setContourPlayButton] = useState({ visible: false, x: 0, y: 0 });
  const [contourRideDurationMs, setContourRideDurationMs] = useState(90000);

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
    soonTouchMode,
  });

  useEffect(() => {
    const previousRuntime = stateRef.current || {};
    stateRef.current = {
      ...previousRuntime,
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
      soonTouchMode,
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
    soonTouchMode,
  ]);

  void pendingBlobAction;
  void onBlobAction;

  useSoonCanvasLoop({
    canvasRef,
    cameraRef,
    arenaRef,
    stateRef,
    activeBubbleAudioRef,
    onTickFish,
    onSemioseVideoTrigger: setSemioseVideo,
    onCollectEchostoryStar,
    onPromptEchostoryStarCollect: () => {},
    onCollectTrailItem: () => {},
  });

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

  useEffect(() => {
    let frame = 0;
    const updateContourPlayButton = () => {
      const canvas = canvasRef.current;
      const current = stateRef.current || {};
      const fishState = current.fish || {};
      const rideActive = Boolean(current?.contourRide?.active);
      if (!canvas || !fishState || rideActive) {
        setContourPlayButton((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        frame = requestAnimationFrame(updateContourPlayButton);
        return;
      }
      const arenaRadius = Number.isFinite(current.arenaRadius) ? current.arenaRadius : (arenaRef.current.radius || 1200);
      const level = Number.isFinite(fishState.arenaLevel) ? fishState.arenaLevel : 0;
      const multiplier = MEMBRANE_LEVEL_MULTIPLIERS[level] ?? MEMBRANE_LEVEL_MULTIPLIERS[0] ?? 1;
      const contourRadius = Math.max(84, Math.max(0, arenaRadius - ARENA_INNER_BOUNDARY_INSET) * multiplier);
      const zenith = { x: 0, y: -contourRadius };
      const fishX = Number.isFinite(fishState.x) ? fishState.x : 0;
      const fishY = Number.isFinite(fishState.y) ? fishState.y : 0;
      const snapped = Math.hypot(fishX - zenith.x, fishY - zenith.y) <= 38;

      if (!snapped) {
        setContourPlayButton((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        frame = requestAnimationFrame(updateContourPlayButton);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const viewZoom = Number.isFinite(current.viewZoom) ? current.viewZoom : 0;
      const fitZoom = Math.min(rect.width, rect.height) / (arenaRadius * 2.55);
      const userZoom = fitZoom * (1 + viewZoom * 1.55);
      const world = current.worldGraph;
      const arenaId = current.currentArenaId || world?.startArenaId;
      const arenaNode = (world?.nodes || []).find((node) => node.id === arenaId) || null;
      const center = arenaNode?.absoluteCenter || { x: 0, y: 0 };
      const centerX = Number.isFinite(center.x) ? center.x : 0;
      const centerY = Number.isFinite(center.y) ? center.y : 0;
      const camera = cameraRef.current || { x: 0, y: 0 };

      const screenX = rect.width * 0.5 + (centerX + zenith.x - camera.x) * userZoom;
      const screenY = rect.height * 0.5 + (centerY + zenith.y - camera.y) * userZoom - 46;
      setContourPlayButton({ visible: true, x: screenX, y: screenY });
      frame = requestAnimationFrame(updateContourPlayButton);
    };
    frame = requestAnimationFrame(updateContourPlayButton);
    return () => cancelAnimationFrame(frame);
  }, [arenaRef, cameraRef, canvasRef, stateRef]);

  const handleContourPlayClick = () => {
    const current = stateRef.current || {};
    const fishState = current.fish || {};
    const arenaRadius = Number.isFinite(current.arenaRadius) ? current.arenaRadius : (arenaRef.current.radius || 1200);
    const level = Number.isFinite(fishState.arenaLevel) ? fishState.arenaLevel : 0;
    const multiplier = MEMBRANE_LEVEL_MULTIPLIERS[level] ?? MEMBRANE_LEVEL_MULTIPLIERS[0] ?? 1;
    const contourRadius = Math.max(84, Math.max(0, arenaRadius - ARENA_INNER_BOUNDARY_INSET) * multiplier);
    const now = performance.now();
    const zenith = { x: 0, y: -contourRadius };

    fishState.x = zenith.x;
    fishState.y = zenith.y;
    fishState.targetX = zenith.x;
    fishState.targetY = zenith.y;
    fishState.vx = 0;
    fishState.vy = 0;
    fishState.angle = 0;
    current.contourRide = {
      active: true,
      startedAt: now,
      baseAngle: -Math.PI / 2,
      durationMs: contourRideDurationMs,
    };
    current.zenithStar = { ...(current.zenithStar || {}), x: zenith.x, y: zenith.y, radius: 52, armed: false, hitAt: now };
    setContourPlayButton((prev) => ({ ...prev, visible: false }));
  };

  const contourDurationOptions = [
    { value: 30000, label: "30 s" },
    { value: 60000, label: "1 min" },
    { value: 90000, label: "1 min 30" },
    { value: 120000, label: "2 min" },
    { value: 180000, label: "3 min" },
    { value: 240000, label: "4 min" },
    { value: 300000, label: "5 min" },
  ];

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
      {contourPlayButton.visible ? (
        <div
          className="contour-play-controls"
          style={{ left: `${contourPlayButton.x}px`, top: `${contourPlayButton.y}px` }}
        >
          <button
            type="button"
            className="contour-play-btn"
            onClick={handleContourPlayClick}
            aria-label="Lancer le tour de contour"
            title="Play tour de piste"
          >
            ▶
          </button>
          <label className="contour-duration-wrap" aria-label="Durée du tour">
            <span>Durée</span>
            <select
              className="contour-duration-select"
              value={contourRideDurationMs}
              onChange={(event) => setContourRideDurationMs(Number(event.target.value))}
            >
              {contourDurationOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
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
      {fishMenu && interactionMode === "swim" && fishMenu?.type !== "blob" ? (
        <RadialMenu
          aria-label="Menu contextuel poisson"
          anchor={fishMenu.screen}
          onClose={() => setFishMenu(null)}
          items={[
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
    </div>
  );
}
