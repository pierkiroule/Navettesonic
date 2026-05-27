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
const CONTACT_PUSH_DISTANCE = 34;
const BLINK_DELAY_MS = 2000;
const BLINK_DURATION_MS = 5000;

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

async function playEchostoryStarPreview(star, fishX = 0) {
  if (!star) return;
  const sampleIndex = Number.parseInt(String(star.id || "").match(/(\d{1,3})/)?.[1] || "", 10);
  if (!Number.isFinite(sampleIndex)) return;
  const pan = Math.max(-0.85, Math.min(0.85, fishX / 420));
  const candidates = getEchostorySampleUrlCandidates(sampleIndex);
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

  console.warn("[Soon][echostory] preview introuvable ou illisible", {
    starId: star.id,
    candidates,
  });
  return false;
}

function triggerEchostoryStarPreview(star, fishX = 0) {
  if (!star || star.previewPlaying) return;
  star.previewPlaying = true;
  star.previewStartedAt = Date.now();
  playEchostoryStarPreview(star, fishX).finally(() => {
    star.previewPlaying = false;
    star.previewStartedAt = 0;
  });
}

function pushNearbyEchostoryStars(current, onPrompt) {
  if (current?.mode !== "echostory" && current?.mode !== "reso") return;
  if (!current?.fish) return;
  const fishX = Number.isFinite(current.fish.x) ? current.fish.x : 0;
  const fishY = Number.isFinite(current.fish.y) ? current.fish.y : 0;
  const TRIGGER_RADIUS = 55;
  const RESO_RETRIGGER_MS = 1200;
  const arenaRadius = Number.isFinite(current?.arenaRadius) ? current.arenaRadius : 1200;
  const contourSnapThreshold = Math.max(24, arenaRadius - 108);
  const contourRadius = Math.max(84, arenaRadius - 34);

  (current?.echostory?.stars || []).forEach((star) => {
    if (!star || star.collected) return;
    if (star.attachedToContour) return;
    const dx = (star.x || 0) - fishX;
    const dy = (star.y || 0) - fishY;
    const distance = Math.hypot(dx, dy);
    const isInside = distance < TRIGGER_RADIUS;

    if (current?.mode === "reso") {
      const touchMode = current?.soonTouchMode || "bubble";
      const isPlumeWeaving = touchMode === "plume";
      const isEarMode = touchMode === "ear";
      if (!isInside) {
        star.resoInside = false;
        return;
      }
      const now = Date.now();
      const readyByCooldown = now >= (star.resoAudioCooldownUntil || 0);
      if (!star.resoInside && readyByCooldown && !star.previewPlaying) {
        star.resoInside = true;
        star.resoAudioCooldownUntil = now + RESO_RETRIGGER_MS;
        triggerEchostoryStarPreview(star, fishX);
      }
      if (!isPlumeWeaving && !isEarMode && distance > 0 && isInside) {
        const ux = dx / distance;
        const uy = dy / distance;
        star.x = (star.x || 0) + ux * CONTACT_PUSH_DISTANCE;
        star.y = (star.y || 0) + uy * CONTACT_PUSH_DISTANCE;
      }
      const distCenter = Math.hypot(star.x || 0, star.y || 0);
      if (!isPlumeWeaving && !isEarMode && distCenter >= contourSnapThreshold) {
        const angle = Math.atan2(star.y || 0, star.x || 0);
        star.attachedToContour = true;
        star.contourAngle = angle;
        star.x = Math.cos(angle) * contourRadius;
        star.y = Math.sin(angle) * contourRadius;
      }
      if (isPlumeWeaving && isInside) {
        star.collected = true;
        onPrompt?.({ type: "star-collect", starId: star.id, star });
      }
      return;
    }

    const now = Date.now();
    if (Number.isFinite(star.blinkArmAt) && now >= star.blinkArmAt && now > (star.blinkUntil || 0)) {
      star.blinkUntil = now + BLINK_DURATION_MS;
      star.blinkArmAt = null;
    }

    if (distance > 0 && isInside) {
      const now = Date.now();
      const blinking = now <= (star.blinkUntil || 0);
      if (!star.previewPlaying && (!blinking || now >= (star.previewCooldownUntil || 0))) {
        triggerEchostoryStarPreview(star, fishX);
        star.previewCooldownUntil = now + 900;
      }
      if (blinking) {
        star.collected = true;
        onPrompt?.({ type: "star-collect", starId: star.id, star });
      } else {
        if (!Number.isFinite(star.blinkArmAt) || now > star.blinkArmAt) {
          star.blinkArmAt = now + BLINK_DELAY_MS;
        }
      }
      const ux = dx / distance;
      const uy = dy / distance;
      star.x = (star.x || 0) + ux * PUSH_DISTANCE;
      star.y = (star.y || 0) + uy * PUSH_DISTANCE;
      return;
    }
    if (distance === 0) {
      star.y = (star.y || 0) - CONTACT_PUSH_DISTANCE;
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
      pushNearbyEchostoryStars(next, onPromptEchostoryStarCollect);
      const fishDepth = Math.round(next?.fish?.depth || 1);
      (next?.bubbles || []).forEach((bubble) => {
        const now = Date.now();
        if (Number.isFinite(bubble.blinkArmAt) && now >= bubble.blinkArmAt && now > (bubble.blinkUntil || 0)) {
          bubble.blinkUntil = now + BLINK_DURATION_MS;
          bubble.blinkArmAt = null;
        }
        const d = Math.hypot((bubble.x || 0) - (next?.fish?.x || 0), (bubble.y || 0) - (next?.fish?.y || 0));
        if (d < 62 && Math.abs(Math.round(bubble.depth || 1) - fishDepth) <= 1) {
          const blinking = now <= (bubble.blinkUntil || 0);
          if (d > 0) {
            const ux = ((bubble.x || 0) - (next?.fish?.x || 0)) / d;
            const uy = ((bubble.y || 0) - (next?.fish?.y || 0)) / d;
            bubble.x = (bubble.x || 0) + ux * CONTACT_PUSH_DISTANCE;
            bubble.y = (bubble.y || 0) + uy * CONTACT_PUSH_DISTANCE;
          }
          if (blinking) {
            onCollectTrailItem?.({
              id: `bubble:${bubble.id}`,
              kind: "bubble",
              label: bubble.label || "Bulle sonore",
              bubbleId: bubble.id,
              sampleId: bubble.sampleId,
            });
          } else if (!Number.isFinite(bubble.blinkArmAt) || now > bubble.blinkArmAt) {
            bubble.blinkArmAt = now + BLINK_DELAY_MS;
          }
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
