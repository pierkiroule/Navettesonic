import { SAMPLE_LIBRARY } from '../config/audioConfig';

export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.panner = null;
    this.sampleNodes = new Map();
    this.isRunning = false;
  }

  init() {
    if (this.audioContext) {
      return;
    }

    const ContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new ContextClass();

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.2;

    this.panner = this.audioContext.createStereoPanner();
    this.panner.pan.value = 0;

    this.masterGain.connect(this.panner);
    this.panner.connect(this.audioContext.destination);

    this.prepareSampleNodes();
  }

  prepareSampleNodes() {
    SAMPLE_LIBRARY.forEach((sample, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = sample.frequency;

      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(this.masterGain);
      oscillator.start();

      this.sampleNodes.set(sample.id, { oscillator, gain });
    });
  }

  async start() {
    this.init();

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.isRunning = true;
  }

  pause() {
    if (!this.audioContext || !this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.sampleNodes.forEach(({ gain }) => {
      gain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.05);
    });
  }

  resume() {
    if (!this.audioContext) {
      return;
    }

    this.isRunning = true;
  }

  setSpatialPosition(x, width) {
    if (!this.audioContext || !this.panner || !width) {
      return;
    }

    const normalizedX = (x / width) * 2 - 1;
    this.panner.pan.setTargetAtTime(normalizedX, this.audioContext.currentTime, 0.05);
  }

  triggerSample(sampleId) {
    if (!this.audioContext || !this.isRunning) {
      return;
    }

    const node = this.sampleNodes.get(sampleId);

    if (!node) {
      return;
    }

    const now = this.audioContext.currentTime;
    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(node.gain.gain.value, now);
    node.gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
    node.gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
  }

  destroy() {
    if (!this.audioContext) {
      return;
    }

    this.sampleNodes.forEach(({ oscillator, gain }) => {
      try {
        oscillator.stop();
      } catch {
        // noop: oscillator can already be stopped
      }
      oscillator.disconnect();
      gain.disconnect();
    });

    this.sampleNodes.clear();

    if (this.masterGain) {
      this.masterGain.disconnect();
    }

    if (this.panner) {
      this.panner.disconnect();
    }

    this.audioContext.close();

    this.audioContext = null;
    this.masterGain = null;
    this.panner = null;
    this.isRunning = false;
  }
}
