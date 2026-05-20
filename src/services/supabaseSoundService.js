const PUBLIC_BASE =
  "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/bulles";

const BUCKET_BUBBLE_COUNT = 26;

function buildBucketBubble(index) {
  const name = `Bulle_${String(index).padStart(3, "0")}`;
  const file = `${name}.mp3`;
  return {
    id: name.toLowerCase(),
    name,
    file,
    url: `${PUBLIC_BASE}/${file}`,
    source: "bucket",
  };
}

const BUCKET_BUBBLES = Array.from({ length: BUCKET_BUBBLE_COUNT }, (_, i) => buildBucketBubble(i + 1));

export async function listSoundBubbles() {
  return BUCKET_BUBBLES;
}
