import { sampleLibrary } from "../data/defaultPack.js";

let audioCtx = null;
let masterGain = null;

const activeSounds = new Map();
const fileBuffers = new Map();

function getAudioContext() {
  if (audioCtx) return audioCtx;

  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.14;
  masterGain.connect(audioCtx.destination);

  return audioCtx;
}

async function loadAudioBuffer(url) {
  const ctx = getAudioContext();

  if (fileBuffers.has(url)) {
    return fileBuffers.get(url);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Audio introuvable: ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arrayBuffer);

  fileBuffers.set(url, buffer);

  return buffer;
}

function stopActiveSound(bubbleId) {
  const current = activeSounds.get(bubbleId);

  if (!current) return;

  const ctx = getAudioContext();

  try {
    current.gain.gain.setTargetAtTime(0.001, ctx.currentTime, 0.08);
    current.stop?.(ctx.currentTime + 0.15);
  } catch {
    // ignore
  }

  activeSounds.delete(bubbleId);
}

function playToneBubble(ctx, bubble, sample) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  const depth = bubble.depth || 1;

  osc.type = sample.type || "sine";
  osc.frequency.value = sample.frequency || 220;

  filter.type = "lowpass";
  filter.frequency.value = 900 + depth * 480;

  gain.gain.value = 0.001;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc.start();

  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.12);

  activeSounds.set(bubble.id, {
    gain,
    stop: (when) => osc.stop(when),
  });
}

async function playFileBubble(ctx, bubble, sample) {
  const buffer = await loadAudioBuffer(sample.url);

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();

  const pan = Math.max(-0.85, Math.min(0.85, (bubble.x || 0) / 420));

  source.buffer = buffer;
  source.loop = true;

  panner.pan.value = pan;
  gain.gain.value = 0.001;

  source.connect(panner);
  panner.connect(gain);
  gain.connect(masterGain);

  source.start();

  gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.22);

  activeSounds.set(bubble.id, {
    gain,
    stop: (when) => source.stop(when),
  });
}

export async function playBubbleSound(bubble) {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  stopActiveSound(bubble.id);

  const sample =
    sampleLibrary.find((item) => item.id === bubble.sampleId) ||
    sampleLibrary[0];

  if (sample.kind === "file" && sample.url) {
    try {
      await playFileBubble(ctx, bubble, sample);
      return;
    } catch (error) {
      console.warn("[Soon] lecture fichier audio impossible, fallback tone", error);
    }
  }

  playToneBubble(ctx, bubble, sample);
}

export function stopBubbleSound(bubbleId) {
  stopActiveSound(bubbleId);
}

export function updateAmbientMix({ near = false } = {}) {
  if (!audioCtx || !masterGain) return;

  masterGain.gain.setTargetAtTime(
    near ? 0.22 : 0.12,
    audioCtx.currentTime,
    0.2
  );
}

export function stopAllBubbleSounds() {
  Array.from(activeSounds.keys()).forEach(stopActiveSound);
}
