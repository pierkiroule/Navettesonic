import { sampleLibrary } from "./defaultPack.js";
import { listSoundBubbles } from "../services/supabaseSoundService.js";

const runtimeSupabaseSamples = [];
let runtimeLoadPromise = null;

export function setRuntimeSupabaseSamples(items = []) {
  runtimeSupabaseSamples.length = 0;
  for (const item of items) {
    if (!item?.file) continue;
    runtimeSupabaseSamples.push({
      id: `supabase:${item.file}`,
      name: item.name || item.file.replace(/\.[^/.]+$/, ""),
      kind: "file",
      source: "supabase",
    });
  }
}

export function getRuntimeSupabaseSamples() {
  return runtimeSupabaseSamples.slice();
}

export function getPlayableSamples() {
  const dynamic = getRuntimeSupabaseSamples();
  if (dynamic.length) return dynamic;
  return sampleLibrary.slice();
}

export function ensureRuntimeSupabaseSamplesLoaded() {
  if (runtimeSupabaseSamples.length) return Promise.resolve(getRuntimeSupabaseSamples());
  if (runtimeLoadPromise) return runtimeLoadPromise;

  runtimeLoadPromise = listSoundBubbles()
    .then((items) => {
      setRuntimeSupabaseSamples(items || []);
      return getRuntimeSupabaseSamples();
    })
    .catch(() => getRuntimeSupabaseSamples())
    .finally(() => {
      runtimeLoadPromise = null;
    });

  return runtimeLoadPromise;
}
