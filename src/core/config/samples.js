export const SAMPLES = [
  { id: 'zen-gong', name: 'Zen Gong' },
  { id: 'harp-mist', name: 'Harp Mist' },
  { id: 'tibetan-bowl', name: 'Tibetan Bowl' },
  { id: 'forest-breath', name: 'Forest Breath' },
  { id: 'river-flow', name: 'River Flow' },
  { id: 'lotus-drift', name: 'Lotus Drift' },
];

/** @typedef {typeof SAMPLES[number]['id']} SampleId */

const SAMPLE_ID_SET = new Set(SAMPLES.map((sample) => sample.id));

/**
 * @param {string | null | undefined} sampleId
 * @returns {sampleId is SampleId}
 */
export function isSampleId(sampleId) {
  return typeof sampleId === 'string' && SAMPLE_ID_SET.has(sampleId);
}

/**
 * @param {string} sampleId
 * @returns {SampleId}
 */
export function assertSampleId(sampleId) {
  if (!isSampleId(sampleId)) {
    throw new Error(`[samples] sample.id inconnu: "${sampleId}".`);
  }

  return sampleId;
}
