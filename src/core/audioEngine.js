import { listSoundBubbles } from "../services/supabaseSoundService.js";

const SUPABASE_BUBBLES_BASE =
  "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/bulles";

let bucketFileSet = null;

async function getBucketFileSet() {
  if (bucketFileSet) return bucketFileSet;
  const items = await listSoundBubbles();
  bucketFileSet = new Set((items || []).map((item) => item.file));
  return bucketFileSet;
}

async function resolveSample(bubble) {
  const id = bubble?.sampleId || "";
  const requestedFile = id.startsWith("supabase:") ? id.slice("supabase:".length) : "";
  const bucketFiles = await getBucketFileSet();
  const file = bucketFiles.has(requestedFile) ? requestedFile : "Bulle_001.mp3";
  return {
    id: `supabase:${file}`,
    name: file.replace(/\.[^/.]+$/, ""),
    kind: "file",
    url: `${SUPABASE_BUBBLES_BASE}/${encodeURIComponent(file)}`,
  };
}

let audioCtx = null;
let masterGain = null;
let masterFilter = null;

const activeSounds = new Map();
const fileBuffers = new Map();
const activeOneShots = new Set();
const DEFAULT_MASTER_GAIN = 0.24;
const AMBIENT_NEAR_GAIN = 0.3;
const AMBIENT_FAR_GAIN = 0.2;

const audioTuning = {
  resonance: 0.5,
  detection: 1,
  depthSeparation: 1,
  sensitivity: 0.7,
};

function getAudioContext() {
  if (audioCtx) return audioCtx;

  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterFilter = audioCtx.createBiquadFilter();
  masterFilter.type = "lowpass";
  masterFilter.frequency.value = 5400;
  masterFilter.Q.value = 0.9;
  masterGain.gain.value = DEFAULT_MASTER_GAIN;
  masterGain.connect(masterFilter);
  masterFilter.connect(audioCtx.destination);

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
    panner,
    stop: (when) => source.stop(when),
  });
}

export async function playBubbleSound(bubble) {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  stopActiveSound(bubble.id);

  const sample = await resolveSample(bubble);
  await playFileBubble(ctx, bubble, sample);
}

export function stopBubbleSound(bubbleId) {
  stopActiveSound(bubbleId);
}

export function updateAmbientMix({ near = false } = {}) {
  if (!audioCtx || !masterGain) return;

  masterGain.gain.setTargetAtTime(
    near ? AMBIENT_NEAR_GAIN : AMBIENT_FAR_GAIN,
    audioCtx.currentTime,
    0.2
  );
}

export function stopAllBubbleSounds() {
  Array.from(activeSounds.keys()).forEach(stopActiveSound);
}

export function getAudioTuning() {
  return { ...audioTuning };
}

export function setAudioTuning(patch = {}) {
  audioTuning.resonance = Math.max(0, Math.min(1, Number.isFinite(patch.resonance) ? patch.resonance : audioTuning.resonance));
  audioTuning.detection = Math.max(0.65, Math.min(1.9, Number.isFinite(patch.detection) ? patch.detection : audioTuning.detection));
  audioTuning.depthSeparation = Math.max(0.4, Math.min(1.8, Number.isFinite(patch.depthSeparation) ? patch.depthSeparation : audioTuning.depthSeparation));
  audioTuning.sensitivity = Math.max(0, Math.min(1, Number.isFinite(patch.sensitivity) ? patch.sensitivity : audioTuning.sensitivity));

  if (audioCtx && masterFilter) {
    const cut = 900 + audioTuning.resonance * 7800;
    const q = 0.5 + audioTuning.resonance * 7.5;
    masterFilter.frequency.setTargetAtTime(cut, audioCtx.currentTime, 0.18);
    masterFilter.Q.setTargetAtTime(q, audioCtx.currentTime, 0.18);
  }
}

export function getDetectionScale() {
  return audioTuning.detection * (0.65 + audioTuning.sensitivity * 1.35);
}

export function updateBubbleSpatialMix(fish, bubbles = []) {
  if (!audioCtx || !masterGain || !fish) return;
  const ctx = getAudioContext();
  const fishDepth = Math.max(1, Math.min(3, Math.round(fish?.depth || 2)));
  const sensitivityBoost = 0.5 + audioTuning.sensitivity * 1.35;

  bubbles.forEach((bubble) => {
    const current = activeSounds.get(bubble.id);
    if (!current) return;
    const dx = (bubble.x || 0) - (fish.x || 0);
    const dy = (bubble.y || 0) - (fish.y || 0);
    const bubbleDepth = Math.max(1, Math.min(3, Math.round(bubble.depth || 2)));
    const z = (bubbleDepth - fishDepth) * 120;
    const d = Math.sqrt(dx * dx + dy * dy + z * z);
    const hearRadius = 520 + sensitivityBoost * 360;
    const distGain = Math.max(0, Math.min(1, 1 - d / hearRadius));
    const depthDiff = Math.abs((Math.round(bubble.depth || 2)) - fishDepth);
    const depthPenalty = Math.max(0.12, 1 - depthDiff * 0.38 * audioTuning.depthSeparation);
    const bubbleResonance = Math.max(0, Math.min(1, Number.isFinite(Number(bubble?.resonance)) ? Number(bubble.resonance) : 0.75));
    const targetGain = 0.001 + Math.pow(distGain, 1.55) * depthPenalty * (0.08 + bubbleResonance * 0.14 + audioTuning.sensitivity * 0.12);
    const pan = Math.max(-0.95, Math.min(0.95, dx / 300));
    current.gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.09);
    current.panner.pan.setTargetAtTime(pan, ctx.currentTime, 0.07);
  });
}

export async function playOneShotFile(url, { volume = 0.18, pan = 0 } = {}) {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const buffer = await loadAudioBuffer(url);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();

  panner.pan.value = Math.max(-0.95, Math.min(0.95, pan));
  gain.gain.value = Math.max(0.001, Math.min(1, volume));

  source.buffer = buffer;
  source.loop = false;

  source.connect(panner);
  panner.connect(gain);
  gain.connect(masterGain);

  activeOneShots.add(source);
  source.onended = () => {
    activeOneShots.delete(source);
  };

  source.start();

  return new Promise((resolve) => {
    source.onended = () => {
      activeOneShots.delete(source);
      resolve();
    };
  });
}
