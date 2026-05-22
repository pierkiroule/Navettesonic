const WAVE_ORDER = ["immersion", "bascule", "ouverture"];

function chunkPerWave(durationSec) {
  if (durationSec <= 60) return 1;
  if (durationSec <= 120) return 2;
  if (durationSec <= 160) return 3;
  return 5;
}

export function estimatePathDuration(path = [], speedLevel = 2) {
  if (!Array.isArray(path) || path.length < 2) return 0;
  const pointsPerSecond = speedLevel <= 1 ? 2.2 : speedLevel >= 3 ? 4.8 : 3.5;
  const duration = path.length / pointsPerSecond;
  return Math.max(0, Math.min(180, duration));
}

export function pickStarsForPath(collectedStars = [], path = [], maxDuration = 180) {
  const duration = Math.min(maxDuration, estimatePathDuration(path, 2));
  const perWave = chunkPerWave(duration || 1);
  const grouped = {
    immersion: collectedStars.filter((s) => s?.wave === "immersion"),
    bascule: collectedStars.filter((s) => s?.wave === "bascule"),
    ouverture: collectedStars.filter((s) => s?.wave === "ouverture"),
  };

  return WAVE_ORDER.flatMap((wave) => grouped[wave].slice(0, Math.min(perWave, 5)));
}

export function buildEchostoryText({ collectedStars = [], path = [], skeleton = null, silenceStyle = "dots" } = {}) {
  const selected = pickStarsForPath(collectedStars, path, 180);
  const cues = Array.isArray(skeleton?.cues) && skeleton.cues.length ? skeleton.cues : ["Et bientôt…", "Puis…"];
  const pauseText = silenceStyle === "bar" ? "— silence —" : "...";

  const lines = [];
  selected.forEach((star, index) => {
    lines.push({ type: "cue", text: cues[index % cues.length] });
    lines.push({ type: "fragment", text: star.text });
    if (index < selected.length - 1) lines.push({ type: "pause", text: pauseText });
  });

  const titleSuggestion = selected.length
    ? `ÉchoStory — ${selected[0].wave} → ${selected[selected.length - 1].wave}`
    : "ÉchoStory — murmure vide";

  return {
    titleSuggestion,
    lines,
    plainText: lines.map((line) => line.text).join("\n"),
  };
}
