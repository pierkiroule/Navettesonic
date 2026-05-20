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

const activeSounds = new Map();
const fileBuffers = new Map();
const activeOneShots = new Set();

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

  const sample = await resolveSample(bubble);
  await playFileBubble(ctx, bubble, sample);
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
