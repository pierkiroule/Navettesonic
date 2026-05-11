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
  onDepthToast,
}) {
  const MOVE_CANCEL = 12;
  const DOUBLE_TAP_MS = 360;
  const DOUBLE_TAP_DIST = 48;

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

    const inHitArea = (bubble) =>
      distance(bubble, point) <= getBubbleHitRadius(bubble);

    const sortByNearest = (a, b) =>
      distance(a, point) - distance(b, point);

    const sameDepth = bubbles
      .filter((bubble) => normalizeDepth(bubble?.depth) === fishDepth)
      .filter(inHitArea)
      .sort(sortByNearest);

    if (sameDepth.length) return sameDepth[0];

    return bubbles.filter(inHitArea).sort(sortByNearest)[0] || null;
  }

  function findBeaconAt(point) {
    return [...(stateRef.current.traceCircuit || [])]
      .reverse()
      .find((beacon) => distance(beacon, point) <= 26);
  }

  function isDoubleTap(point, targetId = null) {
    const now = Date.now();
    const last = pointerRef.current.lastTapPos;
    const lastTargetId = pointerRef.current.lastTapTargetId || null;

    return (
      now - pointerRef.current.lastTapAt < DOUBLE_TAP_MS &&
      last &&
      Math.hypot(last.x - point.x, last.y - point.y) < DOUBLE_TAP_DIST &&
      lastTargetId === targetId
    );
  }

  function rememberTap(point, targetId = null) {
    pointerRef.current.lastTapAt = Date.now();
    pointerRef.current.lastTapPos = point;
    pointerRef.current.lastTapTargetId = targetId;
  }

  function cycleFishDepth() {
    const current = stateRef.current;
    const currentDepth = normalizeDepth(current.fish?.depth);
    const nextDepth = currentDepth >= 3 ? 1 : currentDepth + 1;

    onSetFishDepth?.(nextDepth);
    onDepthToast?.(nextDepth);
  }

  function registerPointer(event) {
    pointerRef.current.activePointers =
      pointerRef.current.activePointers || new Map();

    pointerRef.current.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);
    registerPointer(event);

    const point = getSafeWorldFromEvent(event);
    const current = stateRef.current;
    const isEditMode = current.interactionMode === "edit";

    pointerRef.current.down = true;
    pointerRef.current.pointerId = event.pointerId;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.pendingBubbleId = null;
    pointerRef.current.dragBeaconId = null;
    pointerRef.current.panEnabled = false;
    pointerRef.current.panStart = null;
    pointerRef.current.pinchDistance = null;
    pointerRef.current.longPressStartPoint = point;

    clearLongPress();

    if (!isEditMode) {
      const doubleTap = isDoubleTap(point, null);

      onSelectBubble?.(null);

      if (doubleTap) {
        cycleFishDepth();
        rememberTap(point, null);
        return;
      }

      if (!current.circuitAutopilot) {
        onFishTarget?.(point.x, point.y);
      }

      if (current.mode === "reso") {
        onAddPathPoint?.(point);
      }

      rememberTap(point, null);
      return;
    }

    const hit = findBubbleAt(point);
    const beaconHit =
      current.mode === "reso" ? findBeaconAt(point) : null;

    if (beaconHit) {
      onSelectBeacon?.(beaconHit.id);
      pointerRef.current.dragBeaconId = beaconHit.id;
      rememberTap(point, beaconHit.id);
      return;
    }

    if (hit) {
      const doubleTap = isDoubleTap(point, hit.id);

      onSelectBubble?.(hit.id);
      pointerRef.current.pendingBubbleId = hit.id;

      if (doubleTap) {
        onOpenBubbleEditor?.(hit.id);
      }

      rememberTap(point, hit.id);
      return;
    }

    const doubleTapEmpty = isDoubleTap(point, null);

    onSelectBubble?.(null);
    pointerRef.current.panEnabled = true;
    pointerRef.current.panStart = point;

    if (doubleTapEmpty) {
      onAddBubble?.(point.x, point.y);
    }

    rememberTap(point, null);
  }

  function handlePointerMove(event) {
    registerPointer(event);

    const current = stateRef.current;
    const isEditMode = current.interactionMode === "edit";
    const point = getSafeWorldFromEvent(event);

    if (!pointerRef.current.down && !(pointerRef.current.activePointers?.size > 0)) {
      return;
    }

    if (isEditMode && pointerRef.current.activePointers.size >= 2) {
      const values = [...pointerRef.current.activePointers.values()];
      const a = values[0];
      const b = values[1];

      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const midClient = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      };

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
          zoomEditCameraAt(
            cameraRef,
            factor,
            centerWorld,
            rect,
            arenaRef.current.radius
          );
        }
      }

      pointerRef.current.pinchDistance = dist;
      pointerRef.current.panEnabled = false;
      clearLongPress();
      return;
    }

    pointerRef.current.pinchDistance = null;

    const start = pointerRef.current.longPressStartPoint;
    const moved =
      start && Math.hypot(start.x - point.x, start.y - point.y) > MOVE_CANCEL;

    if (isEditMode && pointerRef.current.dragBeaconId) {
      onMoveBeacon?.(pointerRef.current.dragBeaconId, point.x, point.y);
      return;
    }

    if (isEditMode && pointerRef.current.pendingBubbleId && moved) {
      pointerRef.current.dragBubbleId = pointerRef.current.pendingBubbleId;
      pointerRef.current.pendingBubbleId = null;
    }

    if (isEditMode && pointerRef.current.dragBubbleId) {
      onMoveBubble?.(pointerRef.current.dragBubbleId, {
        x: point.x,
        y: point.y,
      });
      return;
    }

    if (isEditMode && pointerRef.current.panEnabled) {
      const panStart = pointerRef.current.panStart;

      if (panStart) {
        const dx = point.x - panStart.x;
        const dy = point.y - panStart.y;

        panEditCamera(cameraRef, dx, dy);

        const rect = canvasRef.current.getBoundingClientRect();
        clampEditCamera(cameraRef, rect, arenaRef.current.radius);
      }

      pointerRef.current.panStart = point;
      return;
    }

    if (!isEditMode) {
      onFishTarget?.(point.x, point.y);
    }
  }

  function handlePointerUp(event) {
    clearLongPress();

    pointerRef.current.activePointers?.delete(event.pointerId);

    const stillActive = (pointerRef.current.activePointers?.size || 0) > 0;
    pointerRef.current.down = stillActive;

    if (!stillActive) {
      pointerRef.current.pointerId = null;
      pointerRef.current.dragBubbleId = null;
      pointerRef.current.pendingBubbleId = null;
      pointerRef.current.dragBeaconId = null;
      pointerRef.current.panEnabled = false;
      pointerRef.current.panStart = null;
      pointerRef.current.pinchDistance = null;
      pointerRef.current.longPressStartPoint = null;
    }

    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
  }

  function cleanupPointer() {
    clearLongPress();
    pointerRef.current.activePointers?.clear();
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cleanupPointer,
  };
}
