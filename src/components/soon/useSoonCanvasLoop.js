import { useEffect } from "react";
import {
  clampEditCamera,
  enterWorld,
  exitWorld,
  resetEditCamera,
  resizeCanvas,
  updateArena,
} from "../../core/soonCamera.js";
import { getBucketSampleUrlByIndex, playOneShotFile, updateBubbleSpatialMix } from "../../core/audioEngine.js";
import { updateEcosystemFx } from "../../core/ecosystemFx.js";
import { updateBubbleAudioTriggers } from "../../core/soonAudioTriggers.js";
import { drawScene } from "../../core/soonRenderers.js";
import { getMembraneRadiusForLevel } from "../../core/fishNavigationEngine.js";
import { setContourMusicLoopActive } from "../../core/organicAmbienceEngine.js";
import { resetCanvasPaintState } from "../../core/canvasState.js";
import { ARENA_INNER_BOUNDARY_INSET, MEMBRANE_LEVEL_MULTIPLIERS } from "../../core/constants.js";
import { getBlobRadiusAtAngle } from "../../core/blobArena.js";
import {
  getCharacterWorldEffects,
  updateCharacters,
} from "../../core/characters/characterEngine.js";



const CONTACT_PUSH_DISTANCE = 58;
const SOON_CONTACT_REBOUND_MULTIPLIER = 6;
const STAR_PUSH_SMOOTHING = 0.52;
const STAR_PUSH_MAX_STEP = 28;
const STAR_EDGE_STICK_THRESHOLD = 48;
const STAR_EDGE_STICK_RELEASE = 86;

const CONTOUR_RIDE_DURATION_MS = 90000;
const CONTOUR_RIDE_ENTRY_THRESHOLD = 52;
const ZENITH_STAR_REARM_DELAY_MS = 1800;

function getContourSnapRadius(current = {}, angle = 0) {
  const arenaRadius = Number.isFinite(current?.arenaRadius) ? current.arenaRadius : 1200;
  const fishLevel = Number.isFinite(current?.fish?.arenaLevel) ? current.fish.arenaLevel : 0;
  const hasBlob = Array.isArray(current?.arenaBlob?.points) && current.arenaBlob.points.length > 2;
  if (hasBlob) {
    return Math.max(
      84,
      getBlobRadiusAtAngle(current.arenaBlob, angle) - ARENA_INNER_BOUNDARY_INSET
    );
  }
  return Math.max(84, getMembraneRadiusForLevel(arenaRadius, fishLevel));
}

function updateContourRide(current = {}, arenaRadius = 1200, now = performance.now()) {
  const fish = current?.fish;
  if (!fish) return;

  const zenithAngle = -Math.PI / 2;
  const zenithRadius = getContourSnapRadius(current, zenithAngle);
  const beacon = { x: 0, y: -zenithRadius };
  const ride = current.contourRide || null;
  const zenithStar = current.zenithStar || null;

  if (!ride?.active) {
    fish.isOnContourRide = false;
    const distToBeacon = Math.hypot((fish.x || 0) - beacon.x, (fish.y || 0) - beacon.y);
    const canTrigger = zenithStar?.armed !== false;
    if (canTrigger && distToBeacon <= CONTOUR_RIDE_ENTRY_THRESHOLD) {
      current.zenithStar = {
        ...(zenithStar || {}),
        x: beacon.x,
        y: beacon.y,
        radius: CONTOUR_RIDE_ENTRY_THRESHOLD,
        armed: false,
        hitAt: now,
      };
      current.contourRide = {
        active: true,
        startedAt: now,
        baseAngle: -Math.PI / 2,
      };
      fish.x = beacon.x;
      fish.y = beacon.y;
      fish.targetX = beacon.x;
      fish.targetY = beacon.y;
      fish.vx = 0;
      fish.vy = 0;
      fish.angle = 0;
      fish.isOnContourRide = true;
    }
    if (!canTrigger && !Number.isFinite(zenithStar?.hitAt)) {
      current.zenithStar = {
        ...(zenithStar || {}),
        x: beacon.x,
        y: beacon.y,
        radius: CONTOUR_RIDE_ENTRY_THRESHOLD,
        armed: true,
      };
    } else if (!canTrigger && Number.isFinite(zenithStar?.hitAt) && now - zenithStar.hitAt >= ZENITH_STAR_REARM_DELAY_MS) {
      current.zenithStar = {
        ...(zenithStar || {}),
        x: beacon.x,
        y: beacon.y,
        radius: CONTOUR_RIDE_ENTRY_THRESHOLD,
        armed: true,
      };
    }
    return;
  }

  const elapsed = Math.max(0, now - ride.startedAt);
  const rideDurationMs = Number.isFinite(ride?.durationMs) ? ride.durationMs : CONTOUR_RIDE_DURATION_MS;
  const progress = Math.min(1, elapsed / Math.max(1000, rideDurationMs));
  const angle = ride.baseAngle + progress * Math.PI * 2;
  const contourRadius = getContourSnapRadius(current, angle);
  fish.x = Math.cos(angle) * contourRadius;
  fish.y = Math.sin(angle) * contourRadius;
  fish.targetX = fish.x;
  fish.targetY = fish.y;
  fish.vx = 0;
  fish.vy = 0;
  fish.angle = angle + Math.PI / 2;
  fish.isOnContourRide = true;

  if (progress >= 1) {
    const endRadius = getContourSnapRadius(current, ride.baseAngle);
    fish.x = Math.cos(ride.baseAngle) * endRadius;
    fish.y = Math.sin(ride.baseAngle) * endRadius;
    fish.targetX = fish.x;
    fish.targetY = fish.y;
    fish.vx = 0;
    fish.vy = 0;
    fish.angle = 0;
    fish.isOnContourRide = false;
    current.contourRide = null;
    current.zenithStar = {
      ...(current.zenithStar || {}),
      x: beacon.x,
      y: beacon.y,
      radius: CONTOUR_RIDE_ENTRY_THRESHOLD,
      armed: false,
      hitAt: now,
    };
  }
}


function getEchostorySampleIndex(star, fallbackIndex = 0) {
  const explicitIndex = Number.parseInt(String(star?.sampleIndex || ""), 10);
  if (Number.isFinite(explicitIndex)) return explicitIndex;
  const starNumber = Number.parseInt(String(star?.id || "").match(/star-(\d{1,3})$/)?.[1] || "", 10);
  if (Number.isFinite(starNumber)) return starNumber;
  return fallbackIndex + 1;
}

function getEchostorySampleUrlCandidates(star, fallbackIndex = 0) {
  const sampleIndex = getEchostorySampleIndex(star, fallbackIndex);
  return [getBucketSampleUrlByIndex(sampleIndex)];
}

async function playHtmlAudioFallback(url, volume = 0.85) {
  if (typeof Audio === "undefined") return false;
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.volume = Math.max(0.05, Math.min(1, volume));
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.oncanplaythrough = null;
    };
    audio.onended = () => {
      cleanup();
      resolve(true);
    };
    audio.onerror = () => {
      cleanup();
      resolve(false);
    };
    audio.oncanplaythrough = async () => {
      try {
        await audio.play();
      } catch {
        cleanup();
        resolve(false);
      }
    };
    audio.load();
  });
}

let activeEchostoryStarAudioId = null;

async function playEchostoryStarPreview(star, fishX = 0, fallbackIndex = 0) {
  if (!star) return false;
  const pan = Math.max(-0.85, Math.min(0.85, fishX / 420));
  const candidates = getEchostorySampleUrlCandidates(star, fallbackIndex);
  for (const url of candidates) {
    try {
      await playOneShotFile(url, { volume: 0.78, pan });
      return true;
    } catch {
      // continue
    }
  }

  for (const url of candidates) {
    const played = await playHtmlAudioFallback(url, 0.92);
    if (played) return true;
  }

  console.warn("[Soon][echostory] mp3 étoile introuvable ou illisible", {
    starId: star.id,
    candidates,
  });
  return false;
}

function triggerEchostoryStarPreview(star, { fishX = 0, fallbackIndex = 0, onComplete } = {}) {
  if (!star || star.previewPlaying || star.audioConsumed || activeEchostoryStarAudioId) return false;
  activeEchostoryStarAudioId = star.id || `star-${fallbackIndex + 1}`;
  star.previewPlaying = true;
  star.previewStartedAt = Date.now();
  playEchostoryStarPreview(star, fishX, fallbackIndex).finally(() => {
    star.previewPlaying = false;
    star.previewStartedAt = 0;
    star.audioConsumed = true;
    activeEchostoryStarAudioId = null;
    onComplete?.(star);
  });
  return true;
}

function pushNearbyEchostoryStars(current, { onCollectEchostoryStar } = {}) {
  if (current?.mode !== "echostory" && current?.mode !== "reso") return;
  if (current?.contourRide?.active) return;
  if (!current?.fish) return;
  const fishX = Number.isFinite(current.fish.x) ? current.fish.x : 0;
  const fishY = Number.isFinite(current.fish.y) ? current.fish.y : 0;
  const TRIGGER_RADIUS = 84;
  const arenaRadius = Number.isFinite(current?.arenaRadius) ? current.arenaRadius : 1200;
  const contourSnapThreshold = Math.max(24, arenaRadius - STAR_EDGE_STICK_THRESHOLD);
  const contourReleaseThreshold = Math.max(32, arenaRadius - STAR_EDGE_STICK_RELEASE);

  (current?.echostory?.stars || []).forEach((star, index) => {
    if (!star) return;
    if (!Number.isFinite(star.vx)) star.vx = 0;
    if (!Number.isFinite(star.vy)) star.vy = 0;
    const dx = (star.x || 0) - fishX;
    const dy = (star.y || 0) - fishY;
    const distance = Math.hypot(dx, dy);
    const isInside = distance < TRIGGER_RADIUS;

    if (isInside) {
      if (distance > 0) {
        const ux = dx / distance;
        const uy = dy / distance;
        const pushForce = (1 - distance / TRIGGER_RADIUS) * CONTACT_PUSH_DISTANCE * SOON_CONTACT_REBOUND_MULTIPLIER;
        star.vx += ux * pushForce * STAR_PUSH_SMOOTHING;
        star.vy += uy * pushForce * STAR_PUSH_SMOOTHING;
      }
      if (star.attachedToContour && distance < TRIGGER_RADIUS * 0.6) {
        star.attachedToContour = false;
      }
      triggerEchostoryStarPreview(star, {
        fishX,
        fallbackIndex: index,
        onComplete: (completedStar) => onCollectEchostoryStar?.(completedStar.id),
      });
    }
    const step = Math.hypot(star.vx || 0, star.vy || 0);
    if (step > STAR_PUSH_MAX_STEP && step > 0) {
      const ratio = STAR_PUSH_MAX_STEP / step;
      star.vx *= ratio;
      star.vy *= ratio;
    }
    star.x = (star.x || 0) + (star.vx || 0);
    star.y = (star.y || 0) + (star.vy || 0);
    star.vx *= 0.97;
    star.vy *= 0.97;

    const distCenter = Math.hypot(star.x || 0, star.y || 0);
    if (distCenter >= contourSnapThreshold) {
      const angle = Math.atan2(star.y || 0, star.x || 0);
      const contourRadius = getContourSnapRadius(current, angle);
      star.attachedToContour = true;
      star.contourAngle = angle;
      star.x = Math.cos(angle) * contourRadius;
      star.y = Math.sin(angle) * contourRadius;
      star.vx *= 0.92;
      star.vy *= 0.92;
    } else if (star.attachedToContour && distCenter >= contourReleaseThreshold) {
      const angle = Number.isFinite(star.contourAngle) ? star.contourAngle : Math.atan2(star.y || 0, star.x || 0);
      const contourRadius = getContourSnapRadius(current, angle);
      star.contourAngle = angle;
      star.x = Math.cos(angle) * contourRadius;
      star.y = Math.sin(angle) * contourRadius;
      star.vx *= 0.92;
      star.vy *= 0.92;
    } else if (star.attachedToContour) {
      const angle = Number.isFinite(star.contourAngle) ? star.contourAngle : Math.atan2(star.y || 0, star.x || 0);
      const contourRadius = getContourSnapRadius(current, angle);
      star.contourAngle = angle;
      star.x = Math.cos(angle) * contourRadius;
      star.y = Math.sin(angle) * contourRadius;
      star.vx *= 0.92;
      star.vy *= 0.92;
    }
  });
}

export function useSoonCanvasLoop({
  canvasRef,
  cameraRef,
  arenaRef,
  stateRef,
  activeBubbleAudioRef,
  onTickFish,
  onSemioseVideoTrigger,
  onCollectEchostoryStar,
  onPromptEchostoryStarCollect,
  onCollectTrailItem,
}) {
  useEffect(() => {
    let frame = 0;
    let wasEditMode = false;
    let wasContourRideActive = false;
    const postFxCanvas = document.createElement("canvas");
    const postFxCtx = postFxCanvas.getContext("2d");
    const CAMERA_FOLLOW_SMOOTHING = 0.22;
    const CAMERA_MAX_STEP_PER_FRAME = 42;
    function getArenaWorldCenter(current = {}) {
      const world = current.worldGraph;
      const arenaId = current.currentArenaId || world?.startArenaId;
      const node = (world?.nodes || []).find((item) => item.id === arenaId);
      const center = node?.absoluteCenter || { x: 0, y: 0 };
      return {
        x: Number.isFinite(center.x) ? center.x : 0,
        y: Number.isFinite(center.y) ? center.y : 0,
      };
    }

    function smoothFollowCameraToFish(fishWorld) {
      if (!fishWorld) return;
      const targetX = Number.isFinite(fishWorld.x) ? fishWorld.x : 0;
      const targetY = Number.isFinite(fishWorld.y) ? fishWorld.y : 0;
      const cam = cameraRef.current;
      const currentX = Number.isFinite(cam.x) ? cam.x : targetX;
      const currentY = Number.isFinite(cam.y) ? cam.y : targetY;
      const dx = (targetX - currentX) * CAMERA_FOLLOW_SMOOTHING;
      const dy = (targetY - currentY) * CAMERA_FOLLOW_SMOOTHING;
      const step = Math.hypot(dx, dy);
      if (step > CAMERA_MAX_STEP_PER_FRAME && step > 0) {
        const ratio = CAMERA_MAX_STEP_PER_FRAME / step;
        cam.x = currentX + dx * ratio;
        cam.y = currentY + dy * ratio;
        return;
      }
      cam.x = currentX + dx;
      cam.y = currentY + dy;
    }

    function loop() {
      const canvas = canvasRef.current;

      if (!canvas) {
        frame = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        frame = requestAnimationFrame(loop);
        return;
      }

      const rect = resizeCanvas(canvas, ctx);
      const current = stateRef.current || {};
      const isEditMode = current.interactionMode === "edit";

      updateArena(arenaRef, rect);
      const runtimeRadius = arenaRef.current.radius;
      // Important: pas de changement d'échelle caméra/monde entre niveaux.
      // On garde un rayon runtime constant pour éviter tout effet de dezoom.
      arenaRef.current.radius = runtimeRadius;
      stateRef.current = {
        ...(stateRef.current || {}),
        arenaRadius: runtimeRadius,
      };

      if (current.mode === "reso" || current.mode === "echostory") {
        cameraRef.current.zoom = 1;
      } else if (isEditMode) {
        if (!wasEditMode) {
          resetEditCamera(cameraRef, rect, arenaRef.current.radius);
        }
        clampEditCamera(cameraRef, rect, arenaRef.current.radius);
      } else {
        cameraRef.current.zoom = 1;
      }

      wasEditMode = isEditMode;

      updateCharacters({
        fish: isEditMode ? null : current.fish,
        arenaRadius: arenaRef.current.radius,
      });

      const worldFx = getCharacterWorldEffects();

      if (!isEditMode) {
        onTickFish?.({ arenaRadius: arenaRef.current.radius });
      }

      const next = stateRef.current || {};
      updateContourRide(next, arenaRef.current.radius, performance.now());
      pushNearbyEchostoryStars(next, { onCollectEchostoryStar });
      const isContourRideActive = Boolean(next?.contourRide?.active);
      if (isContourRideActive !== wasContourRideActive) {
        wasContourRideActive = isContourRideActive;
        setContourMusicLoopActive(isContourRideActive).catch((error) => {
          console.warn("Impossible de synchroniser la piste musicale du contour", error);
        });
      }
      const fishDepth = Math.round(next?.fish?.depth || 1);
      (next?.bubbles || []).forEach((bubble) => {
        const d = Math.hypot((bubble.x || 0) - (next?.fish?.x || 0), (bubble.y || 0) - (next?.fish?.y || 0));
        if (!isContourRideActive && d < 62 && Math.abs(Math.round(bubble.depth || 1) - fishDepth) <= 1) {
          if (d > 0) {
            const ux = ((bubble.x || 0) - (next?.fish?.x || 0)) / d;
            const uy = ((bubble.y || 0) - (next?.fish?.y || 0)) / d;
            if (bubble.attachedToContour) {
              bubble.attachedToContour = false;
              bubble.x = (bubble.x || 0) - ux * CONTACT_PUSH_DISTANCE * 2.4;
              bubble.y = (bubble.y || 0) - uy * CONTACT_PUSH_DISTANCE * 2.4;
            } else {
              bubble.x = (bubble.x || 0) + ux * CONTACT_PUSH_DISTANCE;
              bubble.y = (bubble.y || 0) + uy * CONTACT_PUSH_DISTANCE;
            }
          }
        }
        const distCenter = Math.hypot(bubble.x || 0, bubble.y || 0);
        const arenaRadius = Number.isFinite(next?.arenaRadius) ? next.arenaRadius : 1200;
        const contourSnapThreshold = Math.max(24, arenaRadius - 108);
        if (distCenter >= contourSnapThreshold) {
          const angle = Math.atan2(bubble.y || 0, bubble.x || 0);
          const contourRadius = getContourSnapRadius(next, angle);
          bubble.attachedToContour = true;
          bubble.contourAngle = angle;
          bubble.x = Math.cos(angle) * contourRadius;
          bubble.y = Math.sin(angle) * contourRadius;
        } else if (bubble.attachedToContour) {
          const angle = Number.isFinite(bubble.contourAngle) ? bubble.contourAngle : Math.atan2(bubble.y || 0, bubble.x || 0);
          const contourRadius = getContourSnapRadius(next, angle);
          bubble.contourAngle = angle;
          bubble.x = Math.cos(angle) * contourRadius;
          bubble.y = Math.sin(angle) * contourRadius;
        }
      });
      const nextFish = next.fish || null;
      const arenaCenter = getArenaWorldCenter(next);
      const fishWorld = nextFish
        ? {
            x: arenaCenter.x + (Number.isFinite(nextFish.x) ? nextFish.x : 0),
            y: arenaCenter.y + (Number.isFinite(nextFish.y) ? nextFish.y : 0),
          }
        : null;
      if (!isEditMode) {
        smoothFollowCameraToFish(fishWorld);
      }

      if (!isEditMode) {
        updateBubbleAudioTriggers(next, activeBubbleAudioRef);
        updateBubbleSpatialMix(next.fish || null, next.bubbles || []);
      }

      updateEcosystemFx({
        fish: isEditMode ? null : next.fish,
        bubbles: next.bubbles || [],
        mode: next.mode,
      });

      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      try {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        resetCanvasPaintState(ctx);

        drawScene(ctx, rect, performance.now(), {
          stateRef,
          arenaRef,
          cameraRef,
          enterWorld,
          exitWorld,
        });
      } finally {
        ctx.restore();
      }

      const shouldApplyWorldBlur = worldFx.blur > 0.1 && next.mode !== "echostory";
      if (shouldApplyWorldBlur) {
        if (postFxCtx) {
          if (postFxCanvas.width !== canvas.width || postFxCanvas.height !== canvas.height) {
            postFxCanvas.width = canvas.width;
            postFxCanvas.height = canvas.height;
          }
          postFxCtx.setTransform(1, 0, 0, 1, 0, 0);
          postFxCtx.globalCompositeOperation = "copy";
          postFxCtx.filter = "none";
          postFxCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
          postFxCtx.globalCompositeOperation = "source-over";

          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 0.98;
          ctx.filter = `blur(${worldFx.blur}px)`;
          ctx.drawImage(postFxCanvas, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";
          ctx.restore();
        }
      }


      if (worldFx.tornado?.active) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";

        const maxTextWidth = canvas.width * 0.86;
        const fontSize = Math.max(18, Math.floor(canvas.height * 0.032));
        const lineHeight = Math.floor(fontSize * 1.28);

        ctx.font = `600 ${fontSize}px "Inter", "Segoe UI", sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.42)";
        ctx.shadowBlur = 10;

        ctx.fillText(
          "Le silence des yeux",
          canvas.width * 0.5,
          canvas.height * 0.5 - lineHeight * 0.5,
          maxTextWidth
        );
        ctx.fillText(
          "ouvre tes écoutilles !",
          canvas.width * 0.5,
          canvas.height * 0.5 + lineHeight * 0.5,
          maxTextWidth
        );
        ctx.restore();
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resetCanvasPaintState(ctx);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(10, 10, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      frame = requestAnimationFrame(loop);
    }

    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, [
    canvasRef,
    cameraRef,
    arenaRef,
    stateRef,
    activeBubbleAudioRef,
    onTickFish,
    onSemioseVideoTrigger,
    onCollectEchostoryStar,
    onPromptEchostoryStarCollect,
  ]);
}
