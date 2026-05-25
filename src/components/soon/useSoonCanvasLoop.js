import { useEffect } from "react";
import {
  clampEditCamera,
  enterWorld,
  exitWorld,
  resetEditCamera,
  resizeCanvas,
  updateArena,
} from "../../core/soonCamera.js";
import { playOneShotFile, updateBubbleSpatialMix } from "../../core/audioEngine.js";
import { updateEcosystemFx } from "../../core/ecosystemFx.js";
import { updateBubbleAudioTriggers } from "../../core/soonAudioTriggers.js";
import { drawScene } from "../../core/soonRenderers.js";
import { resetCanvasPaintState } from "../../core/canvasState.js";
import {
  getCharacterWorldEffects,
  updateCharacters,
} from "../../core/characters/characterEngine.js";



const ECHOSTORY_VOICE_BASE_URL = "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/sooncut";

function getEchostorySampleUrlCandidates(sampleIndex) {
  const n = String(sampleIndex);
  const n2 = String(sampleIndex).padStart(2, "0");
  const n3 = String(sampleIndex).padStart(3, "0");
  return [
    `${ECHOSTORY_VOICE_BASE_URL}/extrait_${n3}.mp3`,
    `${ECHOSTORY_VOICE_BASE_URL}/extrait_${n2}.mp3`,
    `${ECHOSTORY_VOICE_BASE_URL}/extrait_${n}.mp3`,
    `${ECHOSTORY_VOICE_BASE_URL}/${n3}.mp3`,
    `${ECHOSTORY_VOICE_BASE_URL}/${n2}.mp3`,
    `${ECHOSTORY_VOICE_BASE_URL}/${n}.mp3`,
  ];
}

async function playEchostoryStarPreview(star, fishX = 0) {
  if (!star) return;
  const sampleIndex = Number.parseInt(String(star.id || "").match(/(\d{1,3})/)?.[1] || "", 10);
  if (!Number.isFinite(sampleIndex)) return;
  const pan = Math.max(-0.85, Math.min(0.85, fishX / 420));
  const candidates = getEchostorySampleUrlCandidates(sampleIndex);
  for (const url of candidates) {
    try {
      await playOneShotFile(url, { volume: 0.4, pan });
      return;
    } catch {
      // continue
    }
  }
}
function pushNearbyEchostoryStars(current, onCollect) {
  if (current?.mode !== "echostory") return;
  if (!current?.fish) return;
  const fishX = Number.isFinite(current.fish.x) ? current.fish.x : 0;
  const fishY = Number.isFinite(current.fish.y) ? current.fish.y : 0;
  const PUSH_RADIUS = 55;
  const PUSH_DISTANCE = 18;
  (current?.echostory?.stars || []).forEach((star) => {
    if (!star || star.collected) return;
    const dx = (star.x || 0) - fishX;
    const dy = (star.y || 0) - fishY;
    const distance = Math.hypot(dx, dy);
    if (distance > 0 && distance < PUSH_RADIUS) {
      if (!star.previewPlayed) {
        star.previewPlayed = true;
        playEchostoryStarPreview(star, fishX);
      } else if (!star.collectedTriggered && typeof onCollect === "function") {
        star.collectedTriggered = true;
        onCollect(star.id);
        playEchostoryStarPreview(star, fishX);
        current.fish.tailPower = Math.min(18, Math.max(current.fish.tailPower || 0, 1) + 1);
      }
      const ux = dx / distance;
      const uy = dy / distance;
      star.x = (star.x || 0) + ux * PUSH_DISTANCE;
      star.y = (star.y || 0) + uy * PUSH_DISTANCE;
      return;
    }
    if (distance === 0) {
      star.y = (star.y || 0) - PUSH_DISTANCE;
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
}) {
  useEffect(() => {
    let frame = 0;
    let wasEditMode = false;
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
      pushNearbyEchostoryStars(next, onCollectEchostoryStar);
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
  ]);
}
