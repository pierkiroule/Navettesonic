import { useEffect, useRef, useState } from "react";
import { useSoonCanvasLoop } from "./soon/useSoonCanvasLoop.js";
import { useSoonPointer } from "./soon/useSoonPointer.js";

export default function SoonCanvas({
  mode,
  interactionMode = "swim",
  bubbles,
  fish,
  selectedBubbleId,
  traceCircuit,
  selectedBeaconId,
  circuitAutopilot,
  path,
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
  onSetFishDepth,
  onCycleBubbleDepth,
  onOpenBubbleEditor,
}) {
  const canvasRef = useRef(null);
  const [depthToast, setDepthToast] = useState(null);

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
    activePointers: new Map(),
    panEnabled: false,
    panStart: null,
    pinchDistance: null,
  });

  const activeBubbleAudioRef = useRef(new Set());

  const stateRef = useRef({
    mode,
    interactionMode,
    bubbles,
    fish,
    selectedBubbleId,
    traceCircuit,
    selectedBeaconId,
    circuitAutopilot,
    path,
    eyesClosed,
    viewZoom,
    visualLight,
    depth,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      interactionMode,
      bubbles,
      fish,
      selectedBubbleId,
      traceCircuit,
      selectedBeaconId,
      circuitAutopilot,
      path,
      eyesClosed,
      viewZoom,
      visualLight,
      depth,
    };
  }, [
    mode,
    interactionMode,
    bubbles,
    fish,
    selectedBubbleId,
    traceCircuit,
    selectedBeaconId,
    circuitAutopilot,
    path,
    eyesClosed,
    viewZoom,
    visualLight,
    depth,
  ]);

  useSoonCanvasLoop({
    canvasRef,
    cameraRef,
    arenaRef,
    stateRef,
    activeBubbleAudioRef,
    onTickFish,
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
    onSetFishDepth,
    onCycleBubbleDepth,
    onOpenBubbleEditor,
    onDepthToast: setDepthToast,
  });

  useEffect(() => cleanupPointer, [cleanupPointer]);

  useEffect(() => {
    if (!depthToast) return;

    const timer = setTimeout(() => {
      setDepthToast(null);
    }, 1600);

    return () => clearTimeout(timer);
  }, [depthToast]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        className="soon-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {depthToast && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 80,
            pointerEvents: "none",
            padding: "14px 20px",
            borderRadius: "999px",
            color: "rgba(240, 249, 255, 0.96)",
            background: "rgba(2, 6, 23, 0.72)",
            border: "1px solid rgba(186, 230, 253, 0.26)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            backdropFilter: "blur(14px)",
            font: "700 16px system-ui",
            letterSpacing: "0.02em",
          }}
        >
          Profondeur de nage = {depthToast}
        </div>
      )}
    </div>
  );
}
