import { useEffect } from "react";
import {
  enterWorld,
  exitWorld,
  followFishCamera,
  resizeCanvas,
  updateArena,
} from "../../core/soonCamera.js";
import { updateAmbientMix } from "../../core/audioEngine.js";
import { updateFireflyGame } from "../../core/fireflyGame.js";
import { updateEcosystemFx } from "../../core/ecosystemFx.js";
import { updateBubbleAudioTriggers } from "../../core/soonAudioTriggers.js";
import { drawScene } from "../../core/soonRenderers.js";

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

    function loop() {
      const canvas = canvasRef.current;

      if (!canvas) {
        frame = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      const rect = resizeCanvas(canvas, ctx);

      const current = stateRef.current;

      updateArena(arenaRef, rect);
      followFishCamera(cameraRef, arenaRef, current.fish, rect);

      const isEditMode = current.interactionMode === "edit";

      if (!isEditMode) {
        onTickFish();
      }

      const next = stateRef.current;

      if (!isEditMode) {
        updateAmbientMix(next.bubbles, next.fish);
      }

      updateFireflyGame({
        fish: next.fish,
        mode: next.mode,
        bubbles: next.bubbles,
      });

      updateEcosystemFx({
        fish: next.fish,
        bubbles: next.bubbles,
        mode: next.mode,
      });

      if (!isEditMode) {
        updateBubbleAudioTriggers(next, activeBubbleAudioRef);
      }

      drawScene(ctx, rect, performance.now(), {
        stateRef,
        arenaRef,
        cameraRef,
        enterWorld,
        exitWorld,
      });

      frame = requestAnimationFrame(loop);
    }

    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, [canvasRef, cameraRef, arenaRef, stateRef, activeBubbleAudioRef, onTickFish]);
}
