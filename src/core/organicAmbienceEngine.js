export const CONTOUR_MUSIC_URL =
  "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/music/musicsoon.mp3";

let contourMusicState = {
  selected: false,
  playing: false,
  audio: null,
};

function ensureContourMusicAudio() {
  if (typeof Audio === "undefined") return null;
  if (contourMusicState.audio) return contourMusicState.audio;

  const audio = new Audio(CONTOUR_MUSIC_URL);
  audio.loop = true;
  audio.preload = "auto";
  audio.crossOrigin = "anonymous";
  audio.volume = 0.72;
  contourMusicState.audio = audio;
  return audio;
}

export async function selectContourMusicTrack() {
  contourMusicState.selected = true;
  const audio = ensureContourMusicAudio();
  if (!audio) return true;

  audio.loop = true;
  audio.src = CONTOUR_MUSIC_URL;
  audio.load();

  try {
    audio.muted = true;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
  } catch (_error) {
    // La lecture réelle sera relancée au départ du tour de contour.
  } finally {
    audio.muted = false;
  }

  return true;
}

export async function setContourMusicLoopActive(active) {
  const audio = ensureContourMusicAudio();
  if (!audio || !contourMusicState.selected) return false;

  if (!active) {
    if (contourMusicState.playing) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch (_error) {
        // Certains navigateurs peuvent refuser le seek avant chargement complet.
      }
    }
    contourMusicState.playing = false;
    return false;
  }

  audio.loop = true;
  audio.volume = 0.72;
  try {
    audio.currentTime = 0;
  } catch (_error) {
    // On démarre quand même même si le seek est indisponible.
  }
  await audio.play();
  contourMusicState.playing = true;
  return true;
}

export function isOrganicAmbienceActive() {
  return contourMusicState.selected;
}

export async function toggleOrganicAmbience() {
  return selectContourMusicTrack();
}
