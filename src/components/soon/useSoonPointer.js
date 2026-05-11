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
  onSetFishDepth,
  onCycleBubbleDepth,
}) {
  const LONG_PRESS_MS = 520;
  const LONG_PRESS_CANCEL_DISTANCE = 12;

  function clearLongPress() {
    if (pointerRef.current.longPressTimer) {
      clearTimeout(pointerRef.current.longPressTimer);
    }
    pointerRef.current.longPressTimer = null;
    pointerRef.current.longPressStartPoint = null;
    pointerRef.current.longPressTargetType = null;
    pointerRef.current.longPressTargetId = null;
  }
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
    pointerRef.current.pendingBubbleId = null;
    pointerRef.current.dragBeaconId = null;
    pointerRef.current.longPressStartPoint = point;
    pointerRef.current.longPressTargetType = hit ? "bubble" : "fish";
    pointerRef.current.longPressTargetId = hit ? hit.id : null;

    clearLongPress();
    pointerRef.current.longPressTimer = setTimeout(() => {
      const nowState = stateRef.current;
      if (!pointerRef.current.down) return;
      if (pointerRef.current.dragBubbleId || pointerRef.current.dragBeaconId) return;

      if (pointerRef.current.longPressTargetType === "bubble" && pointerRef.current.longPressTargetId) {
        onCycleBubbleDepth(pointerRef.current.longPressTargetId);
      } else {
        const nextDepth = ((Math.round(nowState.fish?.depth || 1) % 3) || 0) + 1;
        onSetFishDepth(nextDepth);
        pointerRef.current.fishDepthHudUntil = Date.now() + 1800;
      }
      clearLongPress();
    }, LONG_PRESS_MS);

    if (beaconHit) {
      onSelectBeacon(beaconHit.id);
      pointerRef.current.dragBeaconId = beaconHit.id;
      return;
    }

    if (hit) {
      onSelectBubble(hit.id);
      playBubbleSound(hit, current.fish);

      if (current.mode === "compo") {
        pointerRef.current.pendingBubbleId = hit.id;
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
      clearLongPress();
      onMoveBeacon(pointerRef.current.dragBeaconId, point.x, point.y);
      return;
    }

    if (pointerRef.current.pendingBubbleId) {
      const start = pointerRef.current.longPressStartPoint;
      if (start && Math.hypot(start.x - point.x, start.y - point.y) > LONG_PRESS_CANCEL_DISTANCE) {
        pointerRef.current.dragBubbleId = pointerRef.current.pendingBubbleId;
        pointerRef.current.pendingBubbleId = null;
        clearLongPress();
      }
    }

    if (pointerRef.current.dragBubbleId) {
      clearLongPress();
      onMoveBubble(pointerRef.current.dragBubbleId, {
        x: point.x,
        y: point.y,
      });
      return;
    }
    const start = pointerRef.current.longPressStartPoint;
    if (start && Math.hypot(start.x - point.x, start.y - point.y) > LONG_PRESS_CANCEL_DISTANCE) {
      clearLongPress();
    }

    onFishTarget(point.x, point.y);

    if (current.mode === "reso") {
      onAddPathPoint(point);
    }
  }

  function handlePointerUp(event) {
    clearLongPress();
    pointerRef.current.down = false;
    pointerRef.current.pointerId = null;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.pendingBubbleId = null;
    pointerRef.current.dragBeaconId = null;

    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
  }

  function cleanupPointer() {
    clearLongPress();
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cleanupPointer,
  };
}
