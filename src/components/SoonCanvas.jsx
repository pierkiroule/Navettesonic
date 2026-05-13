import { useEffect, useRef, useState } from "react";
import { useSoonCanvasLoop } from "./soon/useSoonCanvasLoop.js";
import { useSoonPointer } from "./soon/useSoonPointer.js";
import { playBubbleSound, stopBubbleSound } from "../core/audioEngine.js";
import { getBubbleHitRadius } from "../core/geometry.js";

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
}) {
  const canvasRef = useRef(null);
  const [semioseVideo, setSemioseVideo] = useState(null);
  const [resonanceButtonState, setResonanceButtonState] = useState(null);
  const waveTouchedIdsRef = useRef([]);
  const waveTouchedSetRef = useRef(new Set());

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
  ]);

  useSoonCanvasLoop({
    canvasRef,
    cameraRef,
    arenaRef,
    stateRef,
    activeBubbleAudioRef,
    onTickFish,
    onSemioseVideoTrigger: setSemioseVideo,
    onTornadoWaveStart: () => {
      waveTouchedIdsRef.current = [];
      waveTouchedSetRef.current = new Set();
      setResonanceButtonState({
        waveId: Date.now(),
        expiresAt: Date.now() + 10000,
        consumed: false,
        isPlaying: false,
      });
    },
    onTornadoWaveProgress: ({ tornado, previousRadius, currentRadius }) => {
      const bubbleList = stateRef.current?.bubbles || [];
      bubbleList.forEach((bubble) => {
        if (waveTouchedSetRef.current.has(bubble.id)) return;
        const d = Math.hypot((bubble.x || 0) - tornado.x, (bubble.y || 0) - tornado.y);
        const hitRadius = getBubbleHitRadius(bubble);
        if (previousRadius <= d + hitRadius && currentRadius >= d - hitRadius) {
          waveTouchedSetRef.current.add(bubble.id);
          waveTouchedIdsRef.current.push(bubble.id);
        }
      });
    },
  });

  useEffect(() => {
    if (!resonanceButtonState || resonanceButtonState.consumed) return;
    const timeoutId = setTimeout(() => {
      setResonanceButtonState((current) => {
        if (!current) return null;
        if (current.expiresAt <= Date.now() && !current.isPlaying) return null;
        return current;
      });
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [resonanceButtonState]);

  async function playResonanceOnce() {
    if (!resonanceButtonState || resonanceButtonState.consumed || resonanceButtonState.isPlaying) return;
    setResonanceButtonState((current) => (current ? { ...current, consumed: true, isPlaying: true } : current));
    const ordered = waveTouchedIdsRef.current
      .map((id) => (stateRef.current?.bubbles || []).find((bubble) => bubble.id === id))
      .filter(Boolean);

    for (const bubble of ordered) {
      // eslint-disable-next-line no-await-in-loop
      await playBubbleSound(bubble);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 900));
      stopBubbleSound(bubble.id);
    }

    setResonanceButtonState(null);
  }

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
    onOpenBeaconEditor,
  });

  useEffect(() => cleanupPointer, [cleanupPointer]);

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
      {resonanceButtonState && !resonanceButtonState.consumed && Date.now() < resonanceButtonState.expiresAt ? (
        <div className="resonance-overlay">
          <button type="button" className="resonance-cta" onClick={playResonanceOnce}>
            Écouter la Résonance
          </button>
        </div>
      ) : null}
    </div>
  );
}
