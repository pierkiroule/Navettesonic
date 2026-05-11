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
  const LONG_PRESS_MS = 500;
  const LONG_PRESS_CANCEL_DISTANCE = 10;
  const DRAG_START_DISTANCE = 12;
  const DOUBLE_TAP_MS = 300;
  const DOUBLE_TAP_DISTANCE = 40;

  function clearLongPress() {
    if (pointerRef.current.longPressTimer) clearTimeout(pointerRef.current.longPressTimer);
    pointerRef.current.longPressTimer = null;
    pointerRef.current.longPressStartPoint = null;
    pointerRef.current.longPressTargetType = null;
    pointerRef.current.longPressTargetId = null;
  }
  const isEditMode = (s) => s.interactionMode === "edit";
  const isTraceMode = (s) => isEditMode(s) && s.mode === "reso" && s.editTool === "trace";

  function getWorldFromEvent(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    return screenToWorld({ clientX: event.clientX, clientY: event.clientY, rect, camera: cameraRef.current });
  }
  function getSafeWorldFromEvent(event) {
    return clampToCircle(getWorldFromEvent(event), arenaRef.current.radius - 70);
  }
  function findBubbleAt(point) {
    const state = stateRef.current;
    const fishDepth = normalizeDepth(state?.fish?.depth);
    const bubbles = [...(state?.bubbles || [])].reverse();
    const inHitArea = (bubble) => distance(bubble, point) <= getBubbleHitRadius(bubble);
    const sameDepth = bubbles.filter((b) => normalizeDepth(b?.depth) === fishDepth).filter(inHitArea);
    return sameDepth[0] || bubbles.find(inHitArea) || null;
  }
  function findBeaconAt(point) {
    return [...(stateRef.current.traceCircuit || [])].reverse().find((beacon) => distance(beacon, point) <= 26);
  }

  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);

    const point = getSafeWorldFromEvent(event);
    const current = stateRef.current;
    const edit = isEditMode(current);
    const hitBubble = edit ? findBubbleAt(point) : null;
    const hitBeacon = edit && current.mode === "reso" ? findBeaconAt(point) : null;

    pointerRef.current.down = true;
    pointerRef.current.activePointers = pointerRef.current.activePointers || new Map();
    pointerRef.current.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pointerRef.current.pointerId = event.pointerId;
    pointerRef.current.longPressStartPoint = point;
    pointerRef.current.panStart = point;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.pendingBubbleId = null;
    pointerRef.current.dragBeaconId = null;
    pointerRef.current.gesture = "tap_candidate";
    pointerRef.current.longPressTargetType = hitBubble ? "bubble" : "empty";
    pointerRef.current.longPressTargetId = hitBubble ? hitBubble.id : null;

    clearLongPress();
    pointerRef.current.longPressTimer = setTimeout(() => {
      const nowState = stateRef.current;
      if (!pointerRef.current.down || pointerRef.current.gesture === "pinch_zoom") return;
      if (pointerRef.current.dragBubbleId || pointerRef.current.dragBeaconId) return;
      if (isEditMode(nowState) && pointerRef.current.longPressTargetType === "bubble" && pointerRef.current.longPressTargetId) {
        onCycleBubbleDepth(pointerRef.current.longPressTargetId);
      } else if (!isEditMode(nowState)) {
        const nextDepth = ((Math.round(nowState.fish?.depth || 1) % 3) || 0) + 1;
        onSetFishDepth(nextDepth);
      }
      clearLongPress();
    }, LONG_PRESS_MS);

    if (edit && hitBeacon) {
      onSelectBeacon(hitBeacon.id);
      pointerRef.current.dragBeaconId = hitBeacon.id;
      pointerRef.current.gesture = "drag_beacon";
      return;
    }
    if (edit && hitBubble) {
      onSelectBubble(hitBubble.id);
      pointerRef.current.pendingBubbleId = hitBubble.id;
      return;
    }

    if (edit) {
      onSelectBubble(null);
      if (isTraceMode(current)) {
        onAddPathPoint(point);
        pointerRef.current.gesture = "draw_path";
      } else {
        pointerRef.current.gesture = "pan_camera";
      }
      return;
    }

    if (!current.circuitAutopilot) onFishTarget(point.x, point.y);

    const now = Date.now();
    const last = pointerRef.current.lastTapPos;
    const isDoubleTap = now - pointerRef.current.lastTapAt < DOUBLE_TAP_MS && last && Math.hypot(last.x - point.x, last.y - point.y) < DOUBLE_TAP_DISTANCE;
    if (isDoubleTap) onSetFishDepth(((Math.round(current.fish?.depth || 1) % 3) || 0) + 1);
    pointerRef.current.lastTapAt = now;
    pointerRef.current.lastTapPos = point;
  }

  function handlePointerMove(event) {
    if (!pointerRef.current.down && !(pointerRef.current.activePointers?.size > 0)) return;
    pointerRef.current.activePointers = pointerRef.current.activePointers || new Map();
    pointerRef.current.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const point = getSafeWorldFromEvent(event);
    const current = stateRef.current;
    const edit = isEditMode(current);

    if (edit && pointerRef.current.activePointers.size >= 2) {
      const [a, b] = [...pointerRef.current.activePointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = canvasRef.current.getBoundingClientRect();
      const centerWorld = screenToWorld({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2, rect, camera: cameraRef.current });
      if (pointerRef.current.pinchDistance) {
        const factor = dist / pointerRef.current.pinchDistance;
        if (Number.isFinite(factor) && factor > 0) zoomEditCameraAt(cameraRef, factor, centerWorld, rect, arenaRef.current.radius);
      }
      pointerRef.current.pinchDistance = dist;
      pointerRef.current.gesture = "pinch_zoom";
      clearLongPress();
      return;
    }
    pointerRef.current.pinchDistance = null;

    if (edit && pointerRef.current.dragBeaconId) {
      pointerRef.current.gesture = "drag_beacon";
      clearLongPress();
      onMoveBeacon(pointerRef.current.dragBeaconId, point.x, point.y);
      return;
    }

    if (edit && pointerRef.current.pendingBubbleId) {
      const start = pointerRef.current.longPressStartPoint;
      if (start && Math.hypot(start.x - point.x, start.y - point.y) > DRAG_START_DISTANCE) {
        pointerRef.current.dragBubbleId = pointerRef.current.pendingBubbleId;
        pointerRef.current.pendingBubbleId = null;
        pointerRef.current.gesture = "drag_bubble";
        clearLongPress();
      }
    }

    if (edit && pointerRef.current.dragBubbleId) {
      onMoveBubble(pointerRef.current.dragBubbleId, { x: point.x, y: point.y });
      return;
    }

    if (edit && pointerRef.current.gesture === "pan_camera") {
      const start = pointerRef.current.panStart;
      if (start) {
        panEditCamera(cameraRef, point.x - start.x, point.y - start.y);
        const rect = canvasRef.current.getBoundingClientRect();
        clampEditCamera(cameraRef, rect, arenaRef.current.radius);
      }
      pointerRef.current.panStart = point;
      clearLongPress();
      return;
    }

    if (edit && pointerRef.current.gesture === "draw_path" && isTraceMode(current)) {
      onAddPathPoint(point);
      clearLongPress();
      return;
    }

    const start = pointerRef.current.longPressStartPoint;
    if (start && Math.hypot(start.x - point.x, start.y - point.y) > LONG_PRESS_CANCEL_DISTANCE) clearLongPress();

    if (!edit) onFishTarget(point.x, point.y);
  }

  function handlePointerUp(event) {
    const current = stateRef.current;
    const point = getSafeWorldFromEvent(event);
    const edit = isEditMode(current);

    if (edit && pointerRef.current.gesture === "tap_candidate") {
      const hit = findBubbleAt(point);
      const now = Date.now();
      const last = pointerRef.current.lastTapPos;
      const isDoubleTap = now - pointerRef.current.lastTapAt < DOUBLE_TAP_MS && last && Math.hypot(last.x - point.x, last.y - point.y) < DOUBLE_TAP_DISTANCE;
      if (isDoubleTap) {
        if (hit) {
          onSelectBubble(hit.id);
          onOpenBubbleEditor?.(hit.id);
        } else if (current.mode === "compo") {
          onAddBubble(point.x, point.y);
        }
      }
      pointerRef.current.lastTapAt = now;
      pointerRef.current.lastTapPos = point;
    }

    clearLongPress();
    pointerRef.current.activePointers?.delete(event.pointerId);
    pointerRef.current.down = (pointerRef.current.activePointers?.size || 0) > 0;
    if (!pointerRef.current.down) {
      pointerRef.current.pointerId = null;
      pointerRef.current.dragBubbleId = null;
      pointerRef.current.pendingBubbleId = null;
      pointerRef.current.dragBeaconId = null;
      pointerRef.current.panStart = null;
      pointerRef.current.pinchDistance = null;
      pointerRef.current.gesture = "idle";
    }

    try { canvasRef.current?.releasePointerCapture(event.pointerId); } catch {}
  }

  function cleanupPointer() { clearLongPress(); }

  return { handlePointerDown, handlePointerMove, handlePointerUp, cleanupPointer };
}
