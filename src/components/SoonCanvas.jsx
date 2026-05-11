import { useEffect, useRef } from "react";
import { useSoonCanvasLoop } from "./soon/useSoonCanvasLoop.js";
import { useSoonPointer } from "./soon/useSoonPointer.js";

export default function SoonCanvas({
  mode,
  interactionMode = "swim",
  editTool = "navigate",
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
    longPressTimer: null,
    longPressStartPoint: null,
    longPressTargetType: null,
    longPressTargetId: null,
    fishDepthHudUntil: 0,
    activePointers: new Map(),
    panEnabled: false,
    panStart: null,
    pinchDistance: null,
  });

  const activeBubbleAudioRef = useRef(new Set());

  const stateRef = useRef({
    mode,
    interactionMode,
    editTool,
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
      editTool,
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
    editTool,
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
  });

  useEffect(() => cleanupPointer, [cleanupPointer]);

  return (
    <canvas
      ref={canvasRef}
      className="soon-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
