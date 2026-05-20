import { sampleLibrary } from "./defaultPack.js";

const runtimeSupabaseSamples = [];

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
