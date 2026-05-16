import { useEffect, useRef, useState } from "react";
import { useSoonCanvasLoop } from "./soon/useSoonCanvasLoop.js";
import { useSoonPointer } from "./soon/useSoonPointer.js";
import RadialMenu from "./RadialMenu.jsx";

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
}) {
  const BULLEEXT1_IMAGE =
    "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/dessins/1.png";
  const canvasRef = useRef(null);
  const [semioseVideo, setSemioseVideo] = useState(null);
  const [arenaCenterScreen, setArenaCenterScreen] = useState({ x: 0, y: 0 });
  const [fishMenu, setFishMenu] = useState(null);
  const [bulleext1ImageEvent, setBulleext1ImageEvent] = useState(null);
  const bulleext1TimeoutRef = useRef(null);

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
  ]);

  useSoonCanvasLoop({
    canvasRef,
    cameraRef,
    arenaRef,
    stateRef,
    activeBubbleAudioRef,
    onTickFish,
    onSemioseVideoTrigger: setSemioseVideo,
    onExternalBubbleTouch: () => {
      setBulleext1ImageEvent({ id: `${Date.now()}-${Math.random()}`, url: BULLEEXT1_IMAGE });
      if (bulleext1TimeoutRef.current) {
        clearTimeout(bulleext1TimeoutRef.current);
      }
      bulleext1TimeoutRef.current = setTimeout(() => {
        setBulleext1ImageEvent(null);
      }, 5000);
    },
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

  useEffect(
    () => () => {
      if (bulleext1TimeoutRef.current) {
        clearTimeout(bulleext1TimeoutRef.current);
      }
    },
    []
  );

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

        setArenaCenterScreen({
          x: rect.width * 0.5 - camera.x * userZoom,
          y: rect.height * 0.5 - camera.y * userZoom,
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
      {bulleext1ImageEvent?.url ? (
        <div className="arena2-image-overlay" key={bulleext1ImageEvent.id}>
          <img src={bulleext1ImageEvent.url} alt="bulleext1 event" className="arena2-image-overlay__image" />
        </div>
      ) : null}
      {fishMenu && interactionMode === "swim" ? (
        <RadialMenu
          aria-label="Menu contextuel poisson"
          anchor={fishMenu.screen}
          onClose={() => setFishMenu(null)}
          items={[
            { id: "depth", label: "Profondeur" },
            { id: "bubbles", label: `Bulles ${bubblesEnabled ? "ON" : "OFF"}` },
            { id: "intensity", label: "Intensité bulles" },
            { id: "reset", label: "Reset" },
          ]}
          onSelect={(item) => {
            if (item.id === "depth") onSetFishDepth?.(((Math.round(fish?.depth || 1) % 3) + 1));
            if (item.id === "bubbles") onToggleBubbles?.();
            if (item.id === "intensity") onSetBubblesIntensity?.(Math.min(2, (bubblesIntensity || 1) + 0.25));
            if (item.id === "reset") onResetFishContext?.();
          }}
        />
      ) : null}
    </div>
  );
}
