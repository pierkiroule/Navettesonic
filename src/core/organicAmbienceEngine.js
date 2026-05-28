let ambienceState = {
  active: false,
  stop: null,
};

async function loadTone() {
  const moduleUrl = "https://esm.sh/tone@15.1.22?bundle";
  return import(/* @vite-ignore */ moduleUrl);
}

async function loadOmnitone() {
  const moduleUrl = "https://esm.sh/omnitone@1.3.0?bundle";
  return import(/* @vite-ignore */ moduleUrl);
}

export async function toggleOrganicAmbience() {
  if (ambienceState.active) {
    ambienceState.stop?.();
    ambienceState = { active: false, stop: null };
    return false;
  }

  const [{ default: Tone }, Omnitone] = await Promise.all([loadTone(), loadOmnitone()]);
  await Tone.start();

  const context = Tone.getContext().rawContext;
  const scene = Omnitone.createFOARenderer(context, { hrirPathList: undefined });
  await scene.initialize();

  const master = new Tone.Gain(0.26);
  const lowpass = new Tone.Filter(880, "lowpass");
  const slowAutoFilter = new Tone.AutoFilter({
    frequency: 0.08,
    depth: 0.74,
    baseFrequency: 240,
    octaves: 3.2,
  }).start();

  const pad = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1.8,
    modulationIndex: 8,
    envelope: { attack: 2.2, decay: 0.8, sustain: 0.55, release: 5 },
    modulationEnvelope: { attack: 0.2, decay: 1.2, sustain: 0.4, release: 2.8 },
  });

  const texture = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.4, decay: 0.3, sustain: 0.18, release: 1.2 },
  });

  const driftPanner = new Tone.Panner3D({
    panningModel: "HRTF",
    distanceModel: "inverse",
    maxDistance: 12,
    refDistance: 1,
    rolloffFactor: 0.75,
  });

  const sceneInput = Tone.getContext().createGain();
  driftPanner.connect(lowpass);
  lowpass.connect(slowAutoFilter);
  slowAutoFilter.connect(master);
  master.toDestination();

  scene.input.connect(sceneInput);
  sceneInput.connect(Tone.getContext().destination);

  pad.connect(driftPanner);
  texture.connect(driftPanner);

  const chordPool = [
    ["C3", "G3", "D4", "A4"],
    ["A2", "E3", "B3", "F#4"],
    ["F2", "C3", "G3", "D4"],
    ["D3", "A3", "E4", "B4"],
  ];

  const loop = new Tone.Loop((time) => {
    const chord = chordPool[Math.floor(Math.random() * chordPool.length)];
    pad.triggerAttackRelease(chord, "3m", time, 0.32 + Math.random() * 0.2);
    if (Math.random() > 0.4) {
      texture.triggerAttackRelease("8n", time + Tone.Time("4n").toSeconds() * Math.random(), 0.15);
    }
    const x = (Math.random() - 0.5) * 2.4;
    const y = (Math.random() - 0.5) * 1.4;
    const z = -0.7 - Math.random() * 1.8;
    driftPanner.setPosition(x, y, z);
  }, "2m");

  loop.start(0);
  Tone.getTransport().start();

  ambienceState = {
    active: true,
    stop: () => {
      loop.stop();
      loop.dispose();
      pad.dispose();
      texture.dispose();
      driftPanner.dispose();
      lowpass.dispose();
      slowAutoFilter.dispose();
      master.dispose();
      Tone.getTransport().stop();
    },
  };

  return true;
}

export function isOrganicAmbienceActive() {
  return ambienceState.active;
}
