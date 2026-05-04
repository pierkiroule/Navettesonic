const SUPABASE_BUCKET_BASE =
  "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/bulles";

export const SOUND_BUBBLES = [
  {
    id: "baladhaikua",
    label: "Balade haïkuatique",
    file: "Baladhaikua.mp3",
    url: `${SUPABASE_BUCKET_BASE}/Baladhaikua.mp3`,
    type: "haikuatique",
  },
];

export function getSoundBubbleById(id) {
  return SOUND_BUBBLES.find((bubble) => bubble.id === id) || SOUND_BUBBLES[0];
}

export function getSoundBubbleUrl(id) {
  return getSoundBubbleById(id).url;
}
