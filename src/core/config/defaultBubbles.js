import { assertSampleId, isSampleId } from './samples';

const DEFAULT_SAMPLE_FALLBACK_ID = 'zen-gong';

const RAW_DEFAULT_BUBBLES = [
  { id: 'bubble-aube', label: 'Aube liquide', sampleId: 'zen-gong' },
  { id: 'bubble-brume', label: 'Brume claire', sampleId: 'harp-mist' },
  { id: 'bubble-abyss', label: 'Abysses calmes', sampleId: 'tibetan-bowl' },
];

function assertBubbleSampleIdsAtStartup() {
  if (!import.meta.env.DEV) {
    return;
  }

  const invalidBubbles = RAW_DEFAULT_BUBBLES.filter((bubble) => !isSampleId(bubble.sampleId));

  console.assert(
    invalidBubbles.length === 0,
    `[defaultBubbles] sampleId invalide au démarrage: ${invalidBubbles
      .map((bubble) => `${bubble.id} -> ${bubble.sampleId}`)
      .join(', ')}`,
  );
}

function resolveBubbleSampleId(sampleId, bubbleId) {
  if (isSampleId(sampleId)) {
    return sampleId;
  }

  console.warn(
    `[defaultBubbles] sampleId "${sampleId}" introuvable pour ${bubbleId}. Fallback explicite vers "${DEFAULT_SAMPLE_FALLBACK_ID}".`,
  );

  return DEFAULT_SAMPLE_FALLBACK_ID;
}

assertBubbleSampleIdsAtStartup();

export const DEFAULT_BUBBLES = RAW_DEFAULT_BUBBLES.map((bubble) => ({
  ...bubble,
  sampleId: assertSampleId(resolveBubbleSampleId(bubble.sampleId, bubble.id)),
}));
