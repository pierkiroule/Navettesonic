import { useEffect } from "react";
import {
  clampEditCamera,
  enterWorld,
  exitWorld,
  resetEditCamera,
  resizeCanvas,
  updateArena,
} from "../../core/soonCamera.js";
import { updateAmbientMix } from "../../core/audioEngine.js";
import { consumeSemioseVideoTrigger, updateFireflyGame } from "../../core/fireflyGame.js";
import { updateEcosystemFx } from "../../core/ecosystemFx.js";
import { updateBubbleAudioTriggers } from "../../core/soonAudioTriggers.js";
import { drawScene } from "../../core/soonRenderers.js";
import {
  getCharacterWorldEffects,
  updateCharacters,
} from "../../core/characters/characterEngine.js";

export function useSoonCanvasLoop({
  canvasRef,
  cameraRef,
  arenaRef,
  stateRef,
  activeBubbleAudioRef,
  onTickFish,
  onSemioseVideoTrigger,
}) {
  useEffect(() => {
    let frame = 0;
    let wasEditMode = false;

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

      if (current.mode === "reso" || current.mode === "compo") {
        cameraRef.current.zoom = 1;
        if (current.fish) {
          cameraRef.current.x = Number.isFinite(current.fish.x) ? current.fish.x : 0;
          cameraRef.current.y = Number.isFinite(current.fish.y) ? current.fish.y : 0;
        }
      } else if (isEditMode) {
        if (!wasEditMode) {
          resetEditCamera(cameraRef, rect, arenaRef.current.radius);
        }
        clampEditCamera(cameraRef, rect, arenaRef.current.radius);
      } else {
        cameraRef.current.zoom = 1;
        if (current.fish) {
          cameraRef.current.x = Number.isFinite(current.fish.x) ? current.fish.x : 0;
          cameraRef.current.y = Number.isFinite(current.fish.y) ? current.fish.y : 0;
        }
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

      if (!isEditMode) {
        updateAmbientMix(next.bubbles || [], next.fish || null);
        updateBubbleAudioTriggers(next, activeBubbleAudioRef);

        updateFireflyGame({
          fish: next.fish,
          mode: next.mode,
          bubbles: next.bubbles || [],
        });
        const semioseVideoTrigger = consumeSemioseVideoTrigger();
        if (semioseVideoTrigger) {
          onSemioseVideoTrigger?.(semioseVideoTrigger);
        }
      }

      updateEcosystemFx({
        fish: isEditMode ? null : next.fish,
        bubbles: next.bubbles || [],
        mode: next.mode,
      });

      ctx.filter = "none";

      drawScene(ctx, rect, performance.now(), {
        stateRef,
        arenaRef,
        cameraRef,
        enterWorld,
        exitWorld,
      });

      if (worldFx.blur > 0.1) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.98;
        ctx.filter = `blur(${worldFx.blur}px)`;
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";
        ctx.restore();
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
  ]);
}
