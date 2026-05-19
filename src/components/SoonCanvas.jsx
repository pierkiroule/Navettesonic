import { useEffect, useRef, useState } from "react";
import { useSoonCanvasLoop } from "./soon/useSoonCanvasLoop.js";
import { useSoonPointer } from "./soon/useSoonPointer.js";
import RadialMenu from "./RadialMenu.jsx";

function BlobContextMenu({ anchor, onSelect }) {
  const baseStyle = { position: "absolute", left: `${anchor?.x || 0}px`, top: `${anchor?.y || 0}px`, transform: "translate(-50%, -50%)", zIndex: 24, width: "220px", height: "220px", pointerEvents: "none" };
  const item = (x, y) => ({ position: "absolute", transform: `translate(${x}px, ${y}px)`, pointerEvents: "auto", minWidth: "110px", borderRadius: "999px", border: "1px solid rgba(125,211,252,0.45)", background: "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(2,6,23,0.9))", boxShadow: "0 8px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(34,211,238,0.18) inset", backdropFilter: "blur(8px)" });
  return (
    <div style={baseStyle}>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.28), rgba(15,23,42,0.9))", border: "1px solid rgba(125,211,252,0.5)", boxShadow: "0 0 24px rgba(34,211,238,0.3)" }} />
      <button type="button" className="radial-menu-item is-active" style={item(0, -92)} onClick={() => onSelect("expi")}>↑ Expi</button>
      <button type="button" className="radial-menu-item is-active" style={item(0, 92)} onClick={() => onSelect("inspi")}>↓ Inspi</button>
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
  onSetFishDepth,
  onCycleBubbleDepth,
  onOpenBubbleEditor,
  onOpenBeaconEditor,
  onRecenterFish,
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
}) {
  const canvasRef = useRef(null);
  const [semioseVideo, setSemioseVideo] = useState(null);
  const [arenaCenterScreen, setArenaCenterScreen] = useState({ x: 0, y: 0 });
  const [fishMenu, setFishMenu] = useState(null);

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
    const fishAngle = Number.isFinite(current?.fish?.angle) ? current.fish.angle : pendingBlobAction.angle || 0;
    const fishX = Number.isFinite(current?.fish?.x) ? current.fish.x : (pendingBlobAction.worldX || 0);
    const fishY = Number.isFinite(current?.fish?.y) ? current.fish.y : (pendingBlobAction.worldY || 0);
    const mouthX = fishX + Math.cos(fishAngle) * 44;
    const mouthY = fishY + Math.sin(fishAngle) * 44;
    const screenX = rect.width * 0.5 + (mouthX - camera.x) * userZoom;
    const screenY = rect.height * 0.5 + (mouthY - camera.y) * userZoom;
    setFishMenu({ type: "blob", angle: pendingBlobAction.angle, screen: { x: screenX, y: screenY } });
  }, [pendingBlobAction]);

  useSoonCanvasLoop({
    canvasRef,
    cameraRef,
    arenaRef,
    stateRef,
    activeBubbleAudioRef,
    onTickFish,
    onSemioseVideoTrigger: setSemioseVideo,
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
    onSetFishDepth,
    onCycleBubbleDepth,
    onOpenBubbleEditor,
    onOpenFishContextMenu: setFishMenu,
    onOpenBeaconEditor,
  });

  useEffect(() => cleanupPointer, [cleanupPointer]);

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
        className="arena-recenter-btn"
        style={{ left: `${arenaCenterScreen.x}px`, top: `${arenaCenterScreen.y}px` }}
        onClick={onRecenterFish}
        aria-label={eyesClosed ? "Quitter écoute à l’aveugle" : "Activer écoute à l’aveugle"}
        title={eyesClosed ? "👁️ Mode visible" : "👂 Mode écoute à l’aveugle"}
      >
        {eyesClosed ? "👁️" : "👂"}
      </button>
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
            if (item.id === "membrane") onToggleMembraneSide?.();
            if (item.id === "reset") onResetFishContext?.();
          }}
        />
      ) : null}
    </div>
  );
}
