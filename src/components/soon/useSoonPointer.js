import {
  clampToCircle,
  distance,
  getBubbleHitRadius,
  normalizeDepth,
  screenToWorld,
} from "../../core/geometry.js";
import {
  clampEditCamera,
  panEditCamera,
  zoomEditCameraAt,
} from "../../core/soonCamera.js";

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
  onOpenBubbleEditor,
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
    const state = stateRef.current;
    const fishDepth = normalizeDepth(state?.fish?.depth);
    const bubbles = [...(state?.bubbles || [])].reverse();
    const sortByNearest = (a, b) => distance(a, point) - distance(b, point);
    const inHitArea = (bubble) => distance(bubble, point) <= getBubbleHitRadius(bubble);

    const sameDepthCandidates = bubbles
      .filter((bubble) => normalizeDepth(bubble?.depth) === fishDepth)
      .filter(inHitArea)
      .sort(sortByNearest);

    if (sameDepthCandidates.length > 0) return sameDepthCandidates[0];

    const fallbackCandidates = bubbles.filter(inHitArea).sort(sortByNearest);
    return fallbackCandidates[0] || null;
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
    const isEditMode = current.interactionMode === "edit";

    const hit = isEditMode ? findBubbleAt(point) : null;
    const beaconHit = isEditMode && current.mode === "reso" ? findBeaconAt(point) : null;

    pointerRef.current.down = true;
    pointerRef.current.pointerId = event.pointerId;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.pendingBubbleId = null;
    pointerRef.current.dragBeaconId = null;
    pointerRef.current.longPressStartPoint = point;
    pointerRef.current.longPressTargetType = hit ? "bubble" : "fish";
    pointerRef.current.longPressTargetId = hit ? hit.id : null;
    pointerRef.current.activePointers = pointerRef.current.activePointers || new Map();
    pointerRef.current.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    pointerRef.current.panStart = point;
    pointerRef.current.panEnabled = isEditMode && !hit;

    clearLongPress();
    pointerRef.current.longPressTimer = setTimeout(() => {
      const nowState = stateRef.current;
      if (!pointerRef.current.down) return;
      if (pointerRef.current.dragBubbleId || pointerRef.current.dragBeaconId) return;

      if (
        isEditMode &&
        pointerRef.current.longPressTargetType === "bubble" &&
        pointerRef.current.longPressTargetId
      ) {
        onCycleBubbleDepth(pointerRef.current.longPressTargetId);
      } else {
        const nextDepth = ((Math.round(nowState.fish?.depth || 1) % 3) || 0) + 1;
        onSetFishDepth(nextDepth);
        pointerRef.current.fishDepthHudUntil = Date.now() + 1800;
      }
      clearLongPress();
    }, LONG_PRESS_MS);

    if (isEditMode && beaconHit) {
      onSelectBeacon(beaconHit.id);
      pointerRef.current.dragBeaconId = beaconHit.id;
      return;
    }

    if (isEditMode && hit) {
      onSelectBubble(hit.id);

      pointerRef.current.pendingBubbleId = hit.id;

      return;
    }

    if (isEditMode) {
      onSelectBubble(null);
    }

    if (!isEditMode && !current.circuitAutopilot) {
      onFishTarget(point.x, point.y);
    }

    if (isEditMode && current.mode === "reso") {
      onAddPathPoint(point);
    }

    const now = Date.now();
    const last = pointerRef.current.lastTapPos;

    const isDoubleTap =
      now - pointerRef.current.lastTapAt < 360 &&
      last &&
      Math.hypot(last.x - point.x, last.y - point.y) < 48;

    if (isDoubleTap && isEditMode) {
      if (hit) {
        onSelectBubble(hit.id);
        onOpenBubbleEditor?.(hit.id);
      } else {
        onAddBubble(point.x, point.y);
      }
    }

    pointerRef.current.lastTapAt = now;
    pointerRef.current.lastTapPos = point;
  }

  function handlePointerMove(event) {
    if (!pointerRef.current.down && !(pointerRef.current.activePointers?.size > 0)) return;

    pointerRef.current.activePointers = pointerRef.current.activePointers || new Map();
    pointerRef.current.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const point = getSafeWorldFromEvent(event);
    const current = stateRef.current;

    const isEditMode = current.interactionMode === "edit";

    if (isEditMode && pointerRef.current.activePointers.size >= 2) {
      const values = [...pointerRef.current.activePointers.values()];
      const a = values[0];
      const b = values[1];
      const midClient = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = canvasRef.current.getBoundingClientRect();
      const centerWorld = screenToWorld({
        clientX: midClient.x,
        clientY: midClient.y,
        rect,
        camera: cameraRef.current,
      });

      if (pointerRef.current.pinchDistance) {
        const factor = dist / pointerRef.current.pinchDistance;
        if (Number.isFinite(factor) && factor > 0) {
          zoomEditCameraAt(cameraRef, factor, centerWorld, rect, arenaRef.current.radius);
        }
      }
      pointerRef.current.pinchDistance = dist;
      pointerRef.current.panEnabled = false;
      clearLongPress();
      return;
    }
    pointerRef.current.pinchDistance = null;

    if (isEditMode && pointerRef.current.dragBeaconId) {
      clearLongPress();
      onMoveBeacon(pointerRef.current.dragBeaconId, point.x, point.y);
      return;
    }

    if (isEditMode && pointerRef.current.pendingBubbleId) {
      const start = pointerRef.current.longPressStartPoint;
      if (start && Math.hypot(start.x - point.x, start.y - point.y) > LONG_PRESS_CANCEL_DISTANCE) {
        pointerRef.current.dragBubbleId = pointerRef.current.pendingBubbleId;
        pointerRef.current.pendingBubbleId = null;
        clearLongPress();
      }
    }

    if (isEditMode && pointerRef.current.dragBubbleId) {
      clearLongPress();
      onMoveBubble(pointerRef.current.dragBubbleId, {
        x: point.x,
        y: point.y,
      });
      return;
    }

    if (isEditMode && pointerRef.current.panEnabled) {
      const start = pointerRef.current.panStart;
      if (start) {
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        panEditCamera(cameraRef, dx, dy);
        const rect = canvasRef.current.getBoundingClientRect();
        clampEditCamera(cameraRef, rect, arenaRef.current.radius);
      }
      pointerRef.current.panStart = point;
      clearLongPress();
      return;
    }
    const start = pointerRef.current.longPressStartPoint;
    if (start && Math.hypot(start.x - point.x, start.y - point.y) > LONG_PRESS_CANCEL_DISTANCE) {
      clearLongPress();
    }

    if (!isEditMode) {
      onFishTarget(point.x, point.y);
    }

    if (isEditMode && current.mode === "reso") {
      onAddPathPoint(point);
    }
  }

  function handlePointerUp(event) {
    clearLongPress();
    pointerRef.current.activePointers?.delete(event.pointerId);
    pointerRef.current.down = (pointerRef.current.activePointers?.size || 0) > 0;
    if (!pointerRef.current.down) {
      pointerRef.current.pointerId = null;
      pointerRef.current.dragBubbleId = null;
      pointerRef.current.pendingBubbleId = null;
      pointerRef.current.dragBeaconId = null;
      pointerRef.current.panEnabled = false;
      pointerRef.current.panStart = null;
      pointerRef.current.pinchDistance = null;
    }

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
