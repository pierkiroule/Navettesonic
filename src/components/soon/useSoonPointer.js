import { clampToCircle, distance, screenToWorld } from "../../core/geometry.js";
import { playBubbleSound } from "../../core/audioEngine.js";

export function useSoonPointer({
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
}) {
  function getWorldFromEvent(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return screenToWorld({
      clientX: event.clientX,
      clientY: event.clientY,
      rect,
      camera: cameraRef.current,
    });
  }

  function getSafeWorldFromEvent(event) {
    const point = getWorldFromEvent(event);
    return clampToCircle(point, arenaRef.current.radius - 70);
  }

  function findBubbleAt(point) {
    return [...(stateRef.current.bubbles || [])]
      .reverse()
      .find((bubble) => distance(bubble, point) <= bubble.r);
  }

  function findBeaconAt(point) {
    return [...(stateRef.current.traceCircuit || [])]
      .reverse()
      .find((beacon) => distance(beacon, point) <= 26);
  }

  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);

    const point = getSafeWorldFromEvent(event);
    const current = stateRef.current;

    const hit = findBubbleAt(point);
    const beaconHit = current.mode === "reso" ? findBeaconAt(point) : null;

    pointerRef.current.down = true;
    pointerRef.current.pointerId = event.pointerId;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.dragBeaconId = null;

    if (beaconHit) {
      onSelectBeacon(beaconHit.id);
      pointerRef.current.dragBeaconId = beaconHit.id;
      return;
    }

    if (hit) {
      onSelectBubble(hit.id);
      playBubbleSound(hit, current.fish);

      if (current.mode === "compo") {
        pointerRef.current.dragBubbleId = hit.id;
      }

      return;
    }

    onSelectBubble(null);

    if (!current.circuitAutopilot) {
      onFishTarget(point.x, point.y);
    }

    if (current.mode === "reso") {
      onAddPathPoint(point);
    }

    const now = Date.now();
    const last = pointerRef.current.lastTapPos;

    const isDoubleTap =
      now - pointerRef.current.lastTapAt < 360 &&
      last &&
      Math.hypot(last.x - point.x, last.y - point.y) < 48;

    if (isDoubleTap && current.mode === "compo") {
      onAddBubble(point.x, point.y);
    }

    pointerRef.current.lastTapAt = now;
    pointerRef.current.lastTapPos = point;
  }

  function handlePointerMove(event) {
    if (!pointerRef.current.down) return;

    const point = getSafeWorldFromEvent(event);
    const current = stateRef.current;

    if (pointerRef.current.dragBeaconId) {
      onMoveBeacon(pointerRef.current.dragBeaconId, point.x, point.y);
      return;
    }

    if (pointerRef.current.dragBubbleId) {
      onMoveBubble(pointerRef.current.dragBubbleId, {
        x: point.x,
        y: point.y,
      });
      return;
    }

    onFishTarget(point.x, point.y);

    if (current.mode === "reso") {
      onAddPathPoint(point);
    }
  }

  function handlePointerUp(event) {
    pointerRef.current.down = false;
    pointerRef.current.pointerId = null;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.dragBeaconId = null;

    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
