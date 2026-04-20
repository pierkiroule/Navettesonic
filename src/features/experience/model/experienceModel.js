import { SAMPLE_LIBRARY } from '../../../core/config/audioConfig';

export const EXPERIENCE_COPY = {
  caption: 'Double tap sur le poisson pour ouvrir la collection sonore',
  helperTips: "Garde le doigt (ou clic) appuyé dans l'océan : le poisson-plume suit ton mouvement.",
  panelTitle: 'Collection Soon•° (demo)',
  panelDescription: 'Choisissez un sample, placez-le autour du poisson, puis validez pour déposer une bulle sonore.',
  selectPlaceholder: 'Sélectionnez une bulle',
  samplesTitle: 'Samples disponibles',
};

export function resolveSampleId(selectedBubbleId) {
  if (!selectedBubbleId) {
    return null;
  }

  const preferredSample = SAMPLE_LIBRARY.find((entry) => entry.id === selectedBubbleId.replace('bubble-', ''));

  if (preferredSample) {
    return preferredSample.id;
  }

  const fallbackSample = SAMPLE_LIBRARY[Math.floor(Math.random() * SAMPLE_LIBRARY.length)];
  return fallbackSample?.id ?? null;
}
