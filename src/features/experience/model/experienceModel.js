import { BUBBLES, SOONCUT_SAMPLE_IDS } from '../../../core/config/experienceConfig';

export const EXPERIENCE_COPY = {
  caption: 'Le poisson libère des lucioles audio quand il heurte les bulles mères Sooncut.',
  helperTips: 'Fais dériver les lucioles : elles peuvent se tisser en triangle pour jouer un poème vocal en 3 segments.',
  panelTitle: 'Réseau lucioles · Sooncut',
  panelDescription:
    'Chaque bulle mère contient un sample. Quand un triangle apparaît et que le poisson le traverse, la séquence de 3 samples se déclenche.',
  selectPlaceholder: 'Déclencher un segment Sooncut',
  samplesTitle: 'Segments Sooncut actifs',
};

export function resolveSampleId(selectedBubbleId) {
  if (!selectedBubbleId) {
    return null;
  }

  const selectedBubble = BUBBLES.find((bubble) => bubble.id === selectedBubbleId);
  return selectedBubble?.sampleId ?? null;
}

export function resolveSooncutSequence(sequence) {
  if (!Array.isArray(sequence) || sequence.length !== 3) {
    return SOONCUT_SAMPLE_IDS;
  }

  return sequence;
}
