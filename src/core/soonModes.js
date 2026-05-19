import { SOON_MODE_COMPO, SOON_MODE_INTRO, SOON_MODE_RESO } from "./uiState.js";

export const SOON_MODES = [
  {
    id: SOON_MODE_INTRO,
    icon: "°",
    label: "Intro•°",
    text: "Revenir à l’accueil de l’odyssée.",
  },
  {
    id: SOON_MODE_COMPO,
    icon: "🫧",
    label: "Composer•°",
    text: "Pose tes bulles sonores et récolte les lucioles.",
  },
  {
    id: SOON_MODE_RESO,
    icon: "◌",
    label: "Tracer / Traverser•°",
    text: "Trace ton trajet puis traverse-le avec le poisson-plume.",
  },
];
