import {
  clampToCircle,
  distance,
  getBubbleHitRadius,
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
  onSelectBubble,
  onSelectBeacon,
  onMoveBeacon,
  onMoveBubble,
  onAddBubble,
  onAddOdysseoPathPoint,
  onAddOdysseoDepthMarker,
  onOpenBubbleEditor,
  onOpenFishContextMenu,
  onDepthToast,
  onToggleContourPlayback,
}) {
  const MOVE_CANCEL = 12;
  const DOUBLE_TAP_MS = 420;
  const DOUBLE_TAP_DIST = 72;
  const LONG_PRESS_MS = 480;
  const STAR_TOUCH_RADIUS = 112;
  const STAR_TOUCH_RADIUS_MULTIPLIER = 2.6;
  const TOUCH_POINTER_ID = -1001;

  function getNow() {
    return typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  }

  function shouldUseTouchFallback(event) {
    return (
      event?.pointerType === "touch" &&
      typeof window !== "undefined" &&
      "ontouchstart" in window
    );
  }

  function removeTouchDragListeners() {
    if (typeof window === "undefined") return;
    const move = pointerRef.current.windowTouchMoveListener;
    const end = pointerRef.current.windowTouchEndListener;
    if (move) window.removeEventListener("touchmove", move);
    if (end) {
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    }
    pointerRef.current.windowTouchMoveListener = null;
    pointerRef.current.windowTouchEndListener = null;
  }

  function bindTouchDragListeners() {
    if (typeof window === "undefined") return;
    removeTouchDragListeners();
    const move = (event) => handleTouchMove(event);
    const end = (event) => handleTouchEnd(event);
    pointerRef.current.windowTouchMoveListener = move;
    pointerRef.current.windowTouchEndListener = end;
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end, { passive: false });
    window.addEventListener("touchcancel", end, { passive: false });
  }

  function getWorldFromEvent(event) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const current = stateRef.current || {};
    const viewZoom = Number.isFinite(current.viewZoom) ? current.viewZoom : 0;
    const arenaRadius = current.arenaRadius || arenaRef.current.radius || 1200;

    const fitZoom = Math.min(rect.width, rect.height) / (arenaRadius * 2.55);
    const finalZoom = fitZoom * (1 + viewZoom * 1.55);
    const world = current.worldGraph;
    const arenaId = current.currentArenaId || world?.startArenaId;
    const arenaNode = (world?.nodes || []).find((node) => node.id === arenaId) || null;
    const arenaCenter = arenaNode?.absoluteCenter || { x: 0, y: 0 };
    const centerX = Number.isFinite(arenaCenter.x) ? arenaCenter.x : 0;
    const centerY = Number.isFinite(arenaCenter.y) ? arenaCenter.y : 0;

    const x = (event.clientX - rect.left - rect.width / 2) / finalZoom + cameraRef.current.x - centerX;
    const y = (event.clientY - rect.top - rect.height / 2) / finalZoom + cameraRef.current.y - centerY;

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

    if (stateRef.current?.interactionMode === "swim") {
      return point;
    }

    if (stateRef.current?.fish?.outsideFreeSwim) {
      return point;
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


  function findEchostoryStarAt(point) {
    if (stateRef.current?.mode !== "echostory" && stateRef.current?.mode !== "reso") return null;
    const stars = [...(stateRef.current?.echostory?.stars || [])].reverse();

    return (
      stars
        .filter((star) => star && !star.expired)
        .filter((star) => {
          const radius = Number.isFinite(star.r) ? star.r : 34;
          return distance(star, point) <= Math.max(STAR_TOUCH_RADIUS, radius * STAR_TOUCH_RADIUS_MULTIPLIER);
        })
        .sort((a, b) => distance(a, point) - distance(b, point))[0] || null
    );
  }

  function moveEchostoryStarWithPointer(star, point) {
    if (!star || star.expired) return false;
    const now = getNow();
    const offset = pointerRef.current.dragStarOffset || { x: 0, y: 0 };
    const next = clampToCircle(
      { x: point.x + offset.x, y: point.y + offset.y },
      Math.max(40, (arenaRef.current.radius || 1200) - 42)
    );
    star.x = next.x;
    star.y = next.y;
    star.vx = 0;
    star.vy = 0;
    star.attachedToContour = false;
    star.expiring = false;
    star.pendingBreathChoice = false;
    star.breathMenuOpenedAt = 0;
    star.selectedOnContour = false;
    star.lastDraggedByTouchAt = now;
    star.draggingByTouch = true;

    return true;
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

  function clearLongPressTimer() {
    if (pointerRef.current.longPressTimer) {
      clearTimeout(pointerRef.current.longPressTimer);
      pointerRef.current.longPressTimer = null;
    }
  }

  function endStarDrag() {
    const activeStar = pointerRef.current.dragStarRef;
    if (activeStar) {
      activeStar.draggingByTouch = false;
      activeStar.vx = 0;
      activeStar.vy = 0;
    }
    pointerRef.current.dragStarId = null;
    pointerRef.current.dragStarRef = null;
    pointerRef.current.dragStarOffset = null;
  }

  function beginStarDrag(star, event, point) {
    if (!star || star.expired) return false;
    pointerRef.current.dragStarId = star.id || null;
    pointerRef.current.dragStarRef = star;
    pointerRef.current.dragStarOffset = {
      x: (Number.isFinite(star.x) ? star.x : point.x) - point.x,
      y: (Number.isFinite(star.y) ? star.y : point.y) - point.y,
    };
    onSelectBubble?.(null);
    rememberTapScreen(event, `star:${star.id || "anonymous"}`);
    moveEchostoryStarWithPointer(star, point);
    return true;
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
    void point;
    void current;
    onSelectBubble?.(null);
    rememberTapScreen(event, "swim");
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
    if (shouldUseTouchFallback(event)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    event.preventDefault?.();
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {}
    registerPointer(event);

    const point = getSafeWorldFromEvent(event, { swimEdgeBoost: true });
    const current = stateRef.current;
    const isEditMode = current.interactionMode === "edit";
    const isCircuitMode = current.interactionMode === "circuit";
    if (current.mode === "reso") {
      const contourReaders = current.contourReaderHitZones || [];
      const hitReader = contourReaders.find((reader) => Math.hypot((reader.x || 0) - point.x, (reader.y || 0) - point.y) <= (reader.r || 24));
      if (hitReader) {
        onToggleContourPlayback?.();
        return;
      }
    }

    pointerRef.current.down = true;
    pointerRef.current.pointerId = event.pointerId;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.pendingBubbleId = null;
    pointerRef.current.dragBeaconId = null;
    endStarDrag();
    pointerRef.current.panEnabled = false;
    pointerRef.current.panStart = null;
    pointerRef.current.pinchDistance = null;
    pointerRef.current.startPoint = point;

    if (!isEditMode && !isCircuitMode && current.interactionMode === "swim") {
      const hitStar = findEchostoryStarAt(point);
      if (hitStar) {
        beginStarDrag(hitStar, event, point);
        return;
      }
    }

    if (isCircuitMode) {
      handleCircuitPointerDown(event, point, current);
      return;
    }

    if (isEditMode) {
      handleEditPointerDown(event, point, current);
      return;
    }

    // En nage, on désactive le long-press contextuel pour ne pas casser
    // la propulsion continue quand le doigt reste posé.
    if (current.interactionMode !== "swim") {
      armLongPress(event, point, current);
    }

    handleSwimPointerDown(event, point, current);
  }

  function handlePointerMove(event) {
    if (shouldUseTouchFallback(event)) return;
    registerPointer(event);

    const current = stateRef.current;
    const isEditMode = current.interactionMode === "edit";
    const isCircuitMode = current.interactionMode === "circuit";
    const point = getSafeWorldFromEvent(event, { swimEdgeBoost: false });

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

    if (!isEditMode && !isCircuitMode && (pointerRef.current.dragStarId || pointerRef.current.dragStarRef)) {
      event.preventDefault?.();
      const stars = stateRef.current?.echostory?.stars || [];
      const star = pointerRef.current.dragStarId
        ? stars.find((item) => item?.id === pointerRef.current.dragStarId)
        : pointerRef.current.dragStarRef;
      if (moveEchostoryStarWithPointer(star, point)) return;
    }

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
      return;
    }
  }

  function handlePointerUp(event) {
    if (shouldUseTouchFallback(event)) return;
    clearLongPressTimer();
    pointerRef.current.activePointers?.delete(event.pointerId);

    const stillActive = (pointerRef.current.activePointers?.size || 0) > 0;
    pointerRef.current.down = stillActive;

    if (!stillActive) {
      pointerRef.current.pointerId = null;
      pointerRef.current.dragBubbleId = null;
      pointerRef.current.pendingBubbleId = null;
      pointerRef.current.dragBeaconId = null;
      endStarDrag();
      pointerRef.current.panEnabled = false;
      pointerRef.current.panStart = null;
      pointerRef.current.pinchDistance = null;
      pointerRef.current.startPoint = null;
    }

    try {
      canvasRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
  }

  function getPrimaryTouch(event) {
    return event?.touches?.[0] || event?.changedTouches?.[0] || null;
  }

  function touchToPointerEvent(touch, sourceEvent) {
    return {
      pointerId: TOUCH_POINTER_ID,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => sourceEvent?.preventDefault?.(),
    };
  }

  function handleTouchStart(event) {
    const touch = getPrimaryTouch(event);
    if (!touch) return;
    event.preventDefault?.();
    pointerRef.current.touchSequenceActive = true;
    bindTouchDragListeners();
    handlePointerDown(touchToPointerEvent(touch, event));
  }

  function handleTouchMove(event) {
    const touch = getPrimaryTouch(event);
    if (!touch) return;
    event.preventDefault?.();
    handlePointerMove(touchToPointerEvent(touch, event));
  }

  function handleTouchEnd(event) {
    const touch = getPrimaryTouch(event) || { clientX: 0, clientY: 0 };
    event.preventDefault?.();
    handlePointerUp(touchToPointerEvent(touch, event));
    pointerRef.current.touchSequenceActive = false;
    removeTouchDragListeners();
  }

  function cleanupPointer() {
    clearLongPressTimer();
    removeTouchDragListeners();
    pointerRef.current.touchSequenceActive = false;
    pointerRef.current.activePointers?.clear();
    endStarDrag();
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    cleanupPointer,
  };
}
