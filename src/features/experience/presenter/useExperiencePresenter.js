import { useEffect, useRef } from 'react';
import { AudioEngine } from '../../../core/audio/audioEngine';
import { SceneEngine } from '../../../core/canvas/sceneEngine';
import { BUBBLES } from '../../../core/config/experienceConfig';
import { APP_VIEWS } from '../../../core/utils/views';
import { usePointerControls } from '../hooks/usePointerControls';
import { useResizeCanvas } from '../hooks/useResizeCanvas';
import { resolveSampleId, resolveSooncutSequence } from '../model/experienceModel';

function drawScene(canvas, worldState) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;

  const bgGradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height));
  bgGradient.addColorStop(0, '#061022');
  bgGradient.addColorStop(1, '#02040d');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(cx, cy);

  BUBBLES.forEach((bubble) => {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(120, 205, 255, 0.14)';
    ctx.strokeStyle = 'rgba(120, 205, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.arc(bubble.x, bubble.y, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  worldState.fireflies.forEach((firefly) => {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 236, 170, 0.95)';
    ctx.shadowColor = 'rgba(255, 226, 138, 0.8)';
    ctx.shadowBlur = 12;
    ctx.arc(firefly.x, firefly.y, 4.2, 0, Math.PI * 2);
    ctx.fill();
  });

  if (worldState.activeTriangle) {
    const [a, b, c] = worldState.activeTriangle.fireflies;

    if (a && b && c) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.95)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 80, 80, 0.6)';
      ctx.shadowBlur = 14;
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.fillStyle = '#8be8ff';
  ctx.arc(worldState.fish.x, worldState.fish.y, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function useExperiencePresenter({ state, dispatch }) {
  const experienceRef = useRef(null);
  const canvasRef = useRef(null);
  const audioEngineRef = useRef(null);
  const sceneEngineRef = useRef(null);

  usePointerControls(experienceRef);
  useResizeCanvas();

  useEffect(() => {
    const container = experienceRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return undefined;
    }

    const resizeCanvas = () => {
      canvas.width = Math.max(1, container.clientWidth);
      canvas.height = Math.max(1, container.clientHeight);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const audioEngine = new AudioEngine();
    const sceneEngine = new SceneEngine({
      bubbles: BUBBLES,
      onTriangleHit: (sequence) => {
        audioEngine.triggerSequence(resolveSooncutSequence(sequence));
      },
      onUpdate: (worldState) => {
        const arenaDiameter = window.innerWidth || 1;
        const xInViewport = worldState.fish.x + arenaDiameter / 2;
        audioEngine.setSpatialPosition(xInViewport, arenaDiameter);
        drawScene(canvas, worldState);

        dispatch({
          type: 'SET_SCENE_SNAPSHOT',
          payload: {
            escapedCount: worldState.stats.escapedCount,
            formedTriangleCount: worldState.stats.formedTriangleCount,
            activeTriangle: worldState.activeTriangle,
            fireflyCount: worldState.fireflies.length,
          },
        });
      },
    });

    audioEngineRef.current = audioEngine;
    sceneEngineRef.current = sceneEngine;

    sceneEngine.init(container);
    sceneEngine.start();
    audioEngine.start();

    const onPointerMove = (event) => {
      const rect = container.getBoundingClientRect();
      const clientX = event.clientX ?? event.touches?.[0]?.clientX;
      const clientY = event.clientY ?? event.touches?.[0]?.clientY;

      if (typeof clientX !== 'number' || typeof clientY !== 'number') {
        return;
      }

      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      sceneEngine.setPointer({ x, y });
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('touchmove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('touchmove', onPointerMove);

      sceneEngine.destroy();
      audioEngine.destroy();

      sceneEngineRef.current = null;
      audioEngineRef.current = null;
    };
  }, [dispatch]);

  useEffect(() => {
    const sceneEngine = sceneEngineRef.current;
    const audioEngine = audioEngineRef.current;

    if (!sceneEngine || !audioEngine) {
      return;
    }

    const isExperienceActive = state.currentView === APP_VIEWS.EXPERIENCE;
    const shouldPause = !isExperienceActive || state.isInteractionPaused;

    if (shouldPause) {
      sceneEngine.pause();
      audioEngine.pause();
      return;
    }

    sceneEngine.resume();
    audioEngine.resume();
  }, [state.currentView, state.isInteractionPaused]);

  useEffect(() => {
    const resolvedSampleId = resolveSampleId(state.selectedBubble);

    if (!resolvedSampleId || !audioEngineRef.current) {
      return;
    }

    audioEngineRef.current.triggerSample(resolvedSampleId);
  }, [state.selectedBubble]);

  const onBubbleChange = (bubbleId) => {
    dispatch({ type: 'SET_SELECTED_BUBBLE', payload: bubbleId });
  };

  const onArenaTriangleTap = (sampleId) => {
    if (!sampleId || !audioEngineRef.current) {
      return;
    }

    audioEngineRef.current.triggerSample(sampleId);
  };

  return {
    experienceRef,
    canvasRef,
    onBubbleChange,
    onArenaTriangleTap,
  };
}
