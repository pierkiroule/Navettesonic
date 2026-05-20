import { createClient } from "@supabase/supabase-js";
import { sampleLibrary } from "../data/defaultPack.js";

const SUPABASE_URL = "https://qyffktrggapfzlmmlerq.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const BUCKET = "Soonbucket";
const FOLDER = "bulles";

const PUBLIC_BASE =
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${FOLDER}`;

export const fallbackSoundBubbles = [
  {
    id: "baladhaikua",
    name: "Balade haïkuatique",
    file: "Baladhaikua.mp3",
    url: `${PUBLIC_BASE}/Baladhaikua.mp3`,
    source: "fallback",
  },
];

function normalizeFileName(name = "") {
  return name.replace(/\.[^/.]+$/, "");
}

function fromLibraryFallback() {
  return sampleLibrary
    .filter((sample) => sample?.kind === "file" && typeof sample.url === "string")
    .map((sample) => ({
      id: String(sample.id || "").toLowerCase(),
      name: sample.name || normalizeFileName(sample.id || "Bulle"),
      file: `${sample.id}.mp3`,
      url: sample.url,
      source: "sample-library",
    }));
}

function mergeUniqueById(items = []) {
  const byId = new Map();
  items.forEach((item) => {
    const id = String(item?.id || "").trim().toLowerCase();
    if (!id) return;
    if (!byId.has(id)) byId.set(id, { ...item, id });
  });
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
}

export async function listSoundBubbles() {
  if (!SUPABASE_ANON_KEY) {
    console.warn("[Soon] VITE_SUPABASE_ANON_KEY absente. Fallback statique utilisé.");
    return mergeUniqueById([...fromLibraryFallback(), ...fallbackSoundBubbles]);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(FOLDER, {
      limit: 100,
      sortBy: {
        column: "name",
        order: "asc",
      },
    });

  if (error) {
    console.warn("[Soon] Impossible de lister les bulles Supabase", error);
    return mergeUniqueById([...fromLibraryFallback(), ...fallbackSoundBubbles]);
  }

  const files = (data || [])
    .filter((file) => file.name.toLowerCase().endsWith(".mp3"))
    .map((file) => ({
      id: file.name.replace(/\.[^/.]+$/, "").toLowerCase(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      file: file.name,
      url: `${PUBLIC_BASE}/${encodeURIComponent(file.name)}`,
      source: "supabase",
    }));

  return mergeUniqueById([...files, ...fromLibraryFallback(), ...fallbackSoundBubbles]);
}
