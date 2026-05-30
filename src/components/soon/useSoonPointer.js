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
import {
  ECHOSTORY_MUSIC_CORE_ID,
  canCreateEchostoryLink,
  getEchostoryLinks,
  makeLinkId,
} from "../../core/echostory/echostoryConstellation.js";

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
  onMoveEchostoryStar,
  onToggleEchostoryLink,
  activeContactsRef,
}) {
  const MOVE_CANCEL = 12;
  const DOUBLE_TAP_MS = 420;
  const DOUBLE_TAP_DIST = 72;
  const LONG_PRESS_MS = 480;
  const STAR_TOUCH_SCREEN_RADIUS = 56;

  function getNow() {
    return typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
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

  function getWorldScale() {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    const rect = canvas.getBoundingClientRect();
    const current = stateRef.current || {};
    const viewZoom = Number.isFinite(current.viewZoom) ? current.viewZoom : 0;
    const arenaRadius = current.arenaRadius || arenaRef.current.radius || 1200;
    return Math.max(0.0001, Math.min(rect.width, rect.height) / (arenaRadius * 2.55) * (1 + viewZoom * 1.55));
  }

  function getStarTouchRadius(star) {
    const radius = Number.isFinite(star?.r) ? star.r : 34;
    const screenRadiusInWorld = STAR_TOUCH_SCREEN_RADIUS / getWorldScale();
    return Math.max(radius, screenRadiusInWorld);
  }

  function logStarPointer(message, ...args) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.log(message, ...args);
    }
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


  function findBubbleAt(point) {
    const bubbles = [...(stateRef.current?.bubbles || [])].reverse();

    return (
      bubbles
        .filter((bubble) => distance(bubble, point) <= getBubbleHitRadius(bubble))
        .sort((a, b) => distance(a, point) - distance(b, point))[0] || null
    );
  }

  function isFishPlaybackActive() {
    return Boolean(stateRef.current?.echostory?.echostoryPlayback?.active);
  }

  function getEchostoryStars() {
    return Array.isArray(stateRef.current?.echostory?.stars)
      ? stateRef.current.echostory.stars
      : [];
  }

  function findEchostoryStarAt(point) {
    if (isFishPlaybackActive()) return null;
    if (stateRef.current?.mode !== "echostory" && stateRef.current?.mode !== "reso") return null;
    const stars = [...getEchostoryStars()].reverse();

    return (
      stars
        .filter((star) => star && !star.expired)
        .filter((star) => distance(star, point) <= getStarTouchRadius(star))
        .sort((a, b) => distance(a, point) - distance(b, point))[0] || null
    );
  }


  function getCoreContactRadius() {
    return 75;
  }

  function getPhysicalStarRadius(star) {
    return Math.max(8, Number.isFinite(star?.r) ? star.r : 34);
  }

  function isContacting(a, b) {
    if (!a || !b) return false;
    const ar = getPhysicalStarRadius(a);
    const br = b.id === ECHOSTORY_MUSIC_CORE_ID ? getCoreContactRadius() : getPhysicalStarRadius(b);
    return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)) <= ar + br;
  }

  function updateDragContacts(draggedStar) {
    if (isFishPlaybackActive()) return;
    if (!draggedStar?.id || draggedStar.expired) return;
    const contactSet = activeContactsRef?.current || (pointerRef.current.activeContactsRef ||= new Set());
    const candidates = [
      { id: ECHOSTORY_MUSIC_CORE_ID, x: 0, y: 0, r: getCoreContactRadius() },
      ...getEchostoryStars().filter((star) => star?.id && star.id !== draggedStar.id && !star.expired && !star.expiring),
    ];
    const currentlyTouching = new Set();

    candidates.forEach((candidate) => {
      const pairId = makeLinkId(draggedStar.id, candidate.id);
      if (!isContacting(draggedStar, candidate)) return;
      currentlyTouching.add(pairId);
      if (contactSet.has(pairId)) return;
      const echostory = stateRef.current?.echostory || {};
      const linkAlreadyExists = getEchostoryLinks(echostory).some(
        (link) => makeLinkId(link?.from, link?.to) === pairId
      );
      if (!linkAlreadyExists && !canCreateEchostoryLink(echostory, draggedStar.id, candidate.id)) return;
      contactSet.add(pairId);
      const measuredLength = Math.hypot((draggedStar.x || 0) - (candidate.x || 0), (draggedStar.y || 0) - (candidate.y || 0));
      onToggleEchostoryLink?.(draggedStar.id, candidate.id, {
        restLength: Math.max(42, measuredLength),
        kind: candidate.id === ECHOSTORY_MUSIC_CORE_ID ? "music-core" : "branch",
        now: getNow(),
      });
    });

    [...contactSet].forEach((pairId) => {
      const endpoints = pairId.split("__");
      if (!endpoints.includes(draggedStar.id)) return;
      if (!currentlyTouching.has(pairId)) contactSet.delete(pairId);
    });
  }

  function clearDragContacts() {
    const contactSet = activeContactsRef?.current || pointerRef.current.activeContactsRef;
    contactSet?.clear?.();
  }

  function publishEchostoryStar(star, patch) {
    if (!star?.id) return;
    onMoveEchostoryStar?.(star.id, patch);
  }

  function updateEchostoryStarForDrag(star, patch) {
    if (!star || star.expired) return false;
    Object.assign(star, patch);
    publishEchostoryStar(star, patch);
    return true;
  }

  function getActiveStar() {
    const activeStarId = pointerRef.current.activeStarId;
    if (!activeStarId) return null;
    return getEchostoryStars().find((star) => star?.id === activeStarId) || null;
  }

  function beginStarDrag(event, star, point) {
    if (isFishPlaybackActive()) return false;
    if (!star?.id || star.expired) return false;

    event.preventDefault?.();
    event.stopPropagation?.();

    pointerRef.current.activeStarId = star.id;
    pointerRef.current.activeStarPointerId = event.pointerId;
    pointerRef.current.activeStarOffset = {
      x: point.x - (Number.isFinite(star.x) ? star.x : point.x),
      y: point.y - (Number.isFinite(star.y) ? star.y : point.y),
    };
    pointerRef.current.down = true;
    pointerRef.current.pointerId = event.pointerId;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.pendingBubbleId = null;
    pointerRef.current.dragBeaconId = null;
    pointerRef.current.panEnabled = false;
    pointerRef.current.panStart = null;
    pointerRef.current.pinchDistance = null;
    pointerRef.current.startPoint = point;

    clearLongPressTimer();
    onSelectBubble?.(null);
    rememberTapScreen(event, `star:${star.id}`);

    const now = getNow();
    const started = updateEchostoryStarForDrag(star, {
      attachedToContour: false,
      vx: 0,
      vy: 0,
      expiring: false,
      pendingBreathChoice: false,
      breathMenuOpenedAt: 0,
      selectedOnContour: false,
      lastDraggedByTouchAt: now,
      draggingByTouch: true,
    });
    updateDragContacts(star);
    return started;
  }

  function moveActiveStar(event) {
    if (isFishPlaybackActive()) return false;
    const activeStarId = pointerRef.current.activeStarId;
    if (!activeStarId) return false;
    if (
      event.pointerId != null &&
      pointerRef.current.activeStarPointerId != null &&
      event.pointerId !== pointerRef.current.activeStarPointerId
    ) {
      return false;
    }

    const star = getActiveStar();
    if (!star) return false;

    event.preventDefault?.();
    event.stopPropagation?.();

    const point = getSafeWorldFromEvent(event, { swimEdgeBoost: false });
    const offset = pointerRef.current.activeStarOffset || { x: 0, y: 0 };
    const next = clampToCircle(
      { x: point.x - offset.x, y: point.y - offset.y },
      Math.max(40, (arenaRef.current.radius || 1200) - 42)
    );

    logStarPointer("[star move]", activeStarId, next.x, next.y);

    const moved = updateEchostoryStarForDrag(star, {
      x: next.x,
      y: next.y,
      vx: 0,
      vy: 0,
      attachedToContour: false,
      pendingBreathChoice: false,
      selectedOnContour: false,
      draggingByTouch: true,
    });
    updateDragContacts(star);
    return moved;
  }

  function endStarDrag() {
    const star = getActiveStar();
    if (star) {
      updateEchostoryStarForDrag(star, {
        vx: 0,
        vy: 0,
        draggingByTouch: false,
      });
    }
    pointerRef.current.activeStarId = null;
    pointerRef.current.activeStarPointerId = null;
    pointerRef.current.activeStarOffset = null;
    clearDragContacts();
  }

  function finishActiveStarDrag(event) {
    if (!pointerRef.current.activeStarId) return false;
    if (
      event?.pointerId != null &&
      pointerRef.current.activeStarPointerId != null &&
      event.pointerId !== pointerRef.current.activeStarPointerId
    ) {
      return false;
    }

    event?.preventDefault?.();
    event?.stopPropagation?.();
    clearLongPressTimer();
    pointerRef.current.activePointers?.delete(pointerRef.current.activeStarPointerId ?? event?.pointerId);
    pointerRef.current.down = false;
    pointerRef.current.pointerId = null;
    pointerRef.current.dragBubbleId = null;
    pointerRef.current.pendingBubbleId = null;
    pointerRef.current.dragBeaconId = null;
    pointerRef.current.panEnabled = false;
    pointerRef.current.panStart = null;
    pointerRef.current.pinchDistance = null;
    pointerRef.current.startPoint = null;
    endStarDrag();
    return true;
  }

  function startStarPointerDrag(event) {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const point = getWorldFromEvent(event);
    logStarPointer("[star pointerdown]", point);
    const hitStar = findEchostoryStarAt(point);
    logStarPointer("[star hit]", hitStar?.id || null);
    if (!hitStar) return false;

    return beginStarDrag(event, hitStar, point);
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (startStarPointerDrag(event)) return;

    event.preventDefault?.();
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
    if (moveActiveStar(event)) return;
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
    if (finishActiveStarDrag(event)) return;
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
  }

  function cleanupPointer() {
    clearLongPressTimer();
    pointerRef.current.activePointers?.clear();
    endStarDrag();
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cleanupPointer,
  };
}
