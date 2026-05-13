import { useEffect } from "react";
import {
  clampEditCamera,
  enterWorld,
  exitWorld,
  followFishCamera,
  resetEditCamera,
  resizeCanvas,
  updateArena,
} from "../../core/soonCamera.js";
import { updateAmbientMix } from "../../core/audioEngine.js";
import { updateFireflyGame } from "../../core/fireflyGame.js";
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

      if (current.mode === "reso" || current.mode === "compo") {
        cameraRef.current.x = 0;
        cameraRef.current.y = 0;
        cameraRef.current.zoom = 1;
      } else if (isEditMode) {
        if (!wasEditMode) {
          resetEditCamera(cameraRef, rect, arenaRef.current.radius);
        }
        clampEditCamera(cameraRef, rect, arenaRef.current.radius);
      } else {
        followFishCamera(
          cameraRef,
          arenaRef,
          current.fish,
          rect,
          current.viewZoom
        );
      }

      wasEditMode = isEditMode;

      updateCharacters({
        fish: isEditMode ? null : current.fish,
        arenaRadius: arenaRef.current.radius,
      });

      const worldFx = getCharacterWorldEffects();

      if (!isEditMode) {
        onTickFish?.();
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
  ]);
}
