import { sampleLibrary } from "../data/defaultPack.js";
const SAMPLE_RATE = 44100;
const DEFAULT_DURATION = 75;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function depthToZ(depth = 1) {
  if (depth === 1) return 80;
  if (depth === 2) return 0;
  return -90;
}

async function loadAudioBuffer(ctx, url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Audio introuvable: ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

function findSample(sampleId) {
  return (
    sampleLibrary.find((sample) => sample.id === sampleId) ||
    sampleLibrary[0]
  );
}

function getNearestDepth(markers = [], index = 0) {
  if (!markers.length) return 2;

  let best = markers[0];
  let bestDist = Math.abs(index - best.pathIndex);

  markers.forEach((marker) => {
    const d = Math.abs(index - marker.pathIndex);
    if (d < bestDist) {
      best = marker;
      bestDist = d;
    }
  });

  return best?.depth || 2;
}

function samplePath(path = [], markers = [], t = 0) {
  if (!path.length) return { x: 0, y: 0, z: 0, yaw: 0, index: 0 };

  const maxIndex = path.length - 1;
  const phase = t % 1;
  const pingPong = phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
  const index = pingPong * maxIndex;

  const low = Math.floor(index);
  const high = Math.min(maxIndex, low + 1);
  const mix = index - low;

  const a = path[low] || path[0];
  const b = path[high] || a;

  const x = a.x + (b.x - a.x) * mix;
  const y = a.y + (b.y - a.y) * mix;

  const look = phase <= 0.5 ? 3 : -3;
  const p0 = path[clamp(Math.floor(index - look), 0, maxIndex)] || a;
  const p1 = path[clamp(Math.floor(index + look), 0, maxIndex)] || b;
  const yaw = Math.atan2(p1.y - p0.y, p1.x - p0.x);

  const depth = getNearestDepth(markers, Math.round(index));

  return {
    x,
    y,
    z: depthToZ(depth),
    yaw,
    index,
  };
}

function getBubbleZ(bubble) {
  return depthToZ(Math.round(bubble.depth || 2));
}


function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i += 1) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function audioBufferToWav(buffer) {
  const channels = buffer.numberOfChannels;
  const length = buffer.length * channels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, length, true);

  let offset = 44;

  for (let i = 0; i < buffer.length; i += 1) {
    for (let ch = 0; ch < channels; ch += 1) {
      const sample = clamp(buffer.getChannelData(ch)[i], -1, 1);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export async function renderImmersiveJourney({
  path = [],
  markers = [],
  bubbles = [],
  duration = DEFAULT_DURATION,
} = {}) {
  if (!path || path.length < 2) {
    throw new Error("Trace un parcours avant de générer l’immersion sonore.");
  }

  const safeDuration = clamp(duration, 20, 180);
  const ctx = new OfflineAudioContext(2, SAMPLE_RATE * safeDuration, SAMPLE_RATE);

  const master = ctx.createGain();
  master.gain.value = 0.72;
  master.connect(ctx.destination);

  const activeBubbles = bubbles.filter((bubble) => Number.isFinite(bubble.x) && Number.isFinite(bubble.y));

  const decodedSamples = new Map();

  for (const bubble of activeBubbles) {
    const sample = findSample(bubble.sampleId);

    if (sample?.kind === "file" && sample.url && !decodedSamples.has(sample.id)) {
      try {
        decodedSamples.set(sample.id, await loadAudioBuffer(ctx, sample.url));
        console.log("[Soon export] sample chargé", sample.id, sample.url);
      } catch (error) {
        console.warn("[Soon export] Sample ignoré", sample.id, error);
      }
    }
  }

  activeBubbles.forEach((bubble) => {
    const sample = findSample(bubble.sampleId);
    const buffer = decodedSamples.get(sample?.id);

    if (!buffer) return;

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;
    source.loop = true;

    filter.type = "lowpass";
    filter.frequency.value =
      Math.round(bubble.depth || 2) === 3
        ? 950
        : Math.round(bubble.depth || 2) === 1
          ? 5200
          : 2400;
    filter.Q.value = 0.7;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(master);

    gain.gain.setValueAtTime(0, 0);

    for (let t = 0; t < safeDuration; t += 0.18) {
      const fish = samplePath(path, markers, t / safeDuration);
      const bx = bubble.x;
      const by = bubble.y;
      const bz = getBubbleZ(bubble);

      const dx = bx - fish.x;
      const dy = by - fish.y;
      const dz = bz - fish.z;

      const cos = Math.cos(-fish.yaw);
      const sin = Math.sin(-fish.yaw);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;

      const dist = Math.sqrt(rx * rx + ry * ry + dz * dz);
      const near = clamp(1 - dist / 680, 0, 1);
      const depthMatch = 1 - clamp(Math.abs(dz) / 180, 0, 0.85);
      const amp = near * near * depthMatch * 0.55;

      const p = clamp(rx / 360, -1, 1);

      gain.gain.setTargetAtTime(amp, t, 0.12);
      pan.pan.setTargetAtTime(p, t, 0.1);
    }

    gain.gain.setTargetAtTime(0, safeDuration - 1.2, 0.4);

    source.start(0);
    source.stop(safeDuration);
  });

  const rendered = await ctx.startRendering();
  return audioBufferToWav(rendered);
}
