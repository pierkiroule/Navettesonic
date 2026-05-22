const SUPABASE_BUBBLES_BASE =
  "https://qyffktrggapfzlmmlerq.supabase.co/storage/v1/object/public/Soonbucket/bulles";

export const defaultPack = {
  id: "soon-local-demo",
  title: "Soon•° local",
  bubbles: [
    {
      id: "b1",
      label: "Bulle 001",
      x: 0,
      y: -920,
      r: 72,
      hue: 175,
      depth: 1,
      sampleId: "supabase:Bulle_001.mp3",
    },
    {
      id: "b2",
      label: "Bulle 002",
      x: 875,
      y: -285,
      r: 70,
      hue: 205,
      depth: 1,
      sampleId: "supabase:Bulle_002.mp3",
    },
    {
      id: "b3",
      label: "Bulle 003",
      x: 540,
      y: 745,
      r: 74,
      hue: 235,
      depth: 2,
      sampleId: "supabase:Bulle_003.mp3",
    },
    {
      id: "b4",
      label: "Bulle 004",
      x: -540,
      y: 745,
      r: 76,
      hue: 265,
      depth: 2,
      sampleId: "supabase:Bulle_004.mp3",
    },
    {
      id: "b5",
      label: "Bulle 005",
      x: -875,
      y: -285,
      r: 78,
      hue: 295,
      depth: 3,
      sampleId: "supabase:Bulle_005.mp3",
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
