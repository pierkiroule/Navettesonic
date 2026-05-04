const SUPABASE_BUBBLES_BASE =
  "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/bulles";

export const defaultPack = {
  id: "soon-local-demo",
  title: "Soon•° local",
  bubbles: [
    {
      id: "b1",
      label: "Balade haïkuatique",
      x: -220,
      y: -120,
      r: 72,
      hue: 190,
      depth: 1,
      sampleId: "baladhaikua",
    },
    {
      id: "b2",
      label: "Sax",
      x: 210,
      y: 80,
      r: 82,
      hue: 265,
      depth: 2,
      sampleId: "sax",
    },
    {
      id: "b3",
      label: "Scani",
      x: -40,
      y: 230,
      r: 90,
      hue: 155,
      depth: 3,
      sampleId: "scani",
    },
    {
      id: "b4",
      label: "Tech",
      x: 190,
      y: -230,
      r: 74,
      hue: 215,
      depth: 1,
      sampleId: "tech",
    },
    {
      id: "b5",
      label: "Drill",
      x: -260,
      y: 180,
      r: 78,
      hue: 330,
      depth: 2,
      sampleId: "drill",
    },
  ],
};

export const sampleLibrary = [
  {
    id: "baladhaikua",
    name: "Balade haïkuatique",
    kind: "file",
    url: `${SUPABASE_BUBBLES_BASE}/Baladhaikua.mp3`,
  },
  {
    id: "drill",
    name: "Drill",
    kind: "file",
    url: `${SUPABASE_BUBBLES_BASE}/drill.mp3`,
  },
  {
    id: "sax",
    name: "Sax",
    kind: "file",
    url: `${SUPABASE_BUBBLES_BASE}/Sax.mp3`,
  },
  {
    id: "scani",
    name: "Scani",
    kind: "file",
    url: `${SUPABASE_BUBBLES_BASE}/Scani.mp3`,
  },
  {
    id: "tech",
    name: "Tech",
    kind: "file",
    url: `${SUPABASE_BUBBLES_BASE}/Tech.mp3`,
  },

  // Fallbacks synthétiques
  {
    id: "tone-water",
    name: "Eau douce synthétique",
    kind: "tone",
    frequency: 220,
    type: "sine",
  },
  {
    id: "tone-light",
    name: "Luciole synthétique",
    kind: "tone",
    frequency: 440,
    type: "triangle",
  },
  {
    id: "tone-deep",
    name: "Profondeur synthétique",
    kind: "tone",
    frequency: 110,
    type: "sine",
  },
  {
    id: "tone-air",
    name: "Souffle synthétique",
    kind: "tone",
    frequency: 330,
    type: "sine",
  },
];
