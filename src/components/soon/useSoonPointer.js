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
  onAddOdysseoPathPoint,
  onAddOdysseoDepthMarker,
  onSetFishDepth,
  onOpenBubbleEditor,
  onOpenFishContextMenu,
  onDepthToast,
}) {
  const MOVE_CANCEL = 12;
  const DOUBLE_TAP_MS = 420;
  const DOUBLE_TAP_DIST = 72;
  const LONG_PRESS_MS = 480;

  function getWorldFromEvent(event) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const current = stateRef.current || {};
    const viewZoom = Number.isFinite(current.viewZoom) ? current.viewZoom : 0;
    const arenaRadius = current.arenaRadius || arenaRef.current.radius || 1200;

    const fitZoom = Math.min(rect.width, rect.height) / (arenaRadius * 2.55);
    const finalZoom = fitZoom * (1 + viewZoom * 1.55);

    const x = (event.clientX - rect.left - rect.width / 2) / finalZoom + cameraRef.current.x;
    const y = (event.clientY - rect.top - rect.height / 2) / finalZoom + cameraRef.current.y;

    return { x, y };
  }

  function getSafeWorldFromEvent(event, options = {}) {
    const point = getWorldFromEvent(event);
    const navigableRadius = Math.max(0, arenaRef.current.radius - 18);
    const viewZoom = Number.isFinite(stateRef.current?.viewZoom)
      ? stateRef.current.viewZoom
      : 0;

    // Zoom-out max: si le doigt est proche du bord écran, on autorise un
    // target directement au bord navigable pour atteindre toute l'arène.
    if (options.swimEdgeBoost && viewZoom <= 0.02) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dxScreen = event.clientX - cx;
      const dyScreen = event.clientY - cy;
      const screenDist = Math.hypot(dxScreen, dyScreen);
      const screenLimit = Math.min(rect.width, rect.height) * 0.5 * 0.96;

      if (screenDist >= screenLimit * 0.9 && screenDist > 0.0001) {
        return {
          x: (dxScreen / screenDist) * navigableRadius,
          y: (dyScreen / screenDist) * navigableRadius,
        };
      }
    }

    return clampToCircle(point, navigableRadius);
  }

  function registerPointer(event) {
    pointerRef.current.activePointers =
      pointerRef.current.activePointers || new Map();

    pointerRef.current.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  function findBubbleAt(point) {
    const bubbles = [...(stateRef.current?.bubbles || [])].reverse();

    return (
      bubbles
        .filter((bubble) => distance(bubble, point) <= getBubbleHitRadius(bubble))
        .sort((a, b) => distance(a, point) - distance(b, point))[0] || null
    );
  }


  function isDoubleTapScreen(event, key = "global") {
    const now = Date.now();
    const last = pointerRef.current.lastTapScreenPos;
    const lastKey = pointerRef.current.lastTapKey || "global";

    return (
      now - (pointerRef.current.lastTapAt || 0) < DOUBLE_TAP_MS &&
      last &&
      lastKey === key &&
      Math.hypot(last.x - event.clientX, last.y - event.clientY) < DOUBLE_TAP_DIST
    );
  }

  function rememberTapScreen(event, key = "global") {
    pointerRef.current.lastTapAt = Date.now();
    pointerRef.current.lastTapKey = key;
    pointerRef.current.lastTapScreenPos = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function cycleFishDepth() {
    const currentDepth = normalizeDepth(stateRef.current.fish?.depth);
    const nextDepth = currentDepth >= 3 ? 1 : currentDepth + 1;

    onSetFishDepth?.(nextDepth);
    onDepthToast?.(nextDepth);
  }

  function clearLongPressTimer() {
    if (pointerRef.current.longPressTimer) {
      clearTimeout(pointerRef.current.longPressTimer);
      pointerRef.current.longPressTimer = null;
    }
  }

  function armLongPress(event, point, current) {
    clearLongPressTimer();
    pointerRef.current.longPressStartPoint = point;
    pointerRef.current.longPressTimer = setTimeout(() => {
      const latest = stateRef.current || current;
      if (latest.interactionMode !== "swim") return;
      onOpenFishContextMenu?.({ screen: { x: event.clientX, y: event.clientY }, world: point });
      pointerRef.current.longPressTimer = null;
    }, LONG_PRESS_MS);
  }

  function handleSwimPointerDown(event, point, current) {
    const doubleTap = isDoubleTapScreen(event, "swim");

    onSelectBubble?.(null);

    if (doubleTap) {
      cycleFishDepth();

      // reset pour éviter triple tap parasite
      pointerRef.current.lastTapAt = 0;
      pointerRef.current.lastTapScreenPos = null;
      pointerRef.current.lastTapKey = null;

      return;
    }

    rememberTapScreen(event, "swim");

    if (!current.circuitAutopilot) {
      onFishTarget?.(point.x, point.y, arenaRef.current.radius);
    }

    if (current.mode === "reso") {
      onAddPathPoint?.(point);
    }
  }

  function handleEditPointerDown(event, point, current) {
    const hit = findBubbleAt(point);
    if (hit) {
      onSelectBubble?.(hit.id);
      onOpenBubbleEditor?.(hit.id);

      pointerRef.current.pendingBubbleId = hit.id;
      rememberTapScreen(event, `bubble:${hit.id}`);
      return;
    }

    const doubleTapEmpty = isDoubleTapScreen(event, "edit-empty");

    onSelectBubble?.(null);

    pointerRef.current.panEnabled = true;
    pointerRef.current.panStart = point;

    if (doubleTapEmpty) {
      onAddBubble?.(point.x, point.y);

      pointerRef.current.lastTapAt = 0;
      pointerRef.current.lastTapScreenPos = null;
      pointerRef.current.lastTapKey = null;

      return;
    }

    rememberTapScreen(event, "edit-empty");
  }

  function handleCircuitPointerDown(event, point, current) {
    onSelectBubble?.(null);
    onSelectBeacon?.(null);

    if (current.odysseoTool === "depth") {
      onAddOdysseoDepthMarker?.(point.x, point.y);
      return;
    }

    if (current.odysseoTool === "draw") {
      onAddOdysseoPathPoint?.(point.x, point.y);
    }
  }

  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);
    registerPointer(event);

    const point = getSafeWorldFromEvent(event, { swimEdgeBoost: true });
    const current = stateRef.current;
    const isEditMode = current.interactionMode === "edit";
    const isCircuitMode = current.interactionMode === "circuit";

    pointerRef.current.down = true;
    pointerRef.current.pointerId = event.pointerId;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.pendingBubbleId = null;
    pointerRef.current.dragBeaconId = null;
    pointerRef.current.panEnabled = false;
    pointerRef.current.panStart = null;
    pointerRef.current.pinchDistance = null;
    pointerRef.current.startPoint = point;
    armLongPress(event, point, current);

    if (isCircuitMode) {
      handleCircuitPointerDown(event, point, current);
      return;
    }

    if (isEditMode) {
      handleEditPointerDown(event, point, current);
      return;
    }

    handleSwimPointerDown(event, point, current);
  }

  function handlePointerMove(event) {
    registerPointer(event);

    const current = stateRef.current;
    const isEditMode = current.interactionMode === "edit";
    const isCircuitMode = current.interactionMode === "circuit";
    const point = getSafeWorldFromEvent(event, { swimEdgeBoost: true });

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
      return;
    }

    pointerRef.current.pinchDistance = null;

    const start = pointerRef.current.startPoint;
    const moved =
      start && Math.hypot(start.x - point.x, start.y - point.y) > MOVE_CANCEL;
    if (moved) clearLongPressTimer();

    if ((isEditMode || isCircuitMode) && pointerRef.current.dragBeaconId) {
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

    if (isCircuitMode) {
      if (current.odysseoTool === "draw") {
        onAddOdysseoPathPoint?.(point.x, point.y);
      }
      return;
    }

    if (!isEditMode) {
      onFishTarget?.(point.x, point.y, arenaRef.current.radius);

      if (current.mode === "reso") {
        onAddPathPoint?.(point);
      }
    }
  }

  function handlePointerUp(event) {
    clearLongPressTimer();
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
      pointerRef.current.startPoint = null;
    }

    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
  }

  function cleanupPointer() {
    clearLongPressTimer();
    pointerRef.current.activePointers?.clear();
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cleanupPointer,
  };
}
