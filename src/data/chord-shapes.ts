import { noteIndex } from '@/src/utils/chord-transposer';

// -1 = muted, 0 = open, 1+ = fret. Order: [low E, A, D, G, B, high E].
export interface GuitarShape {
  frets: [number, number, number, number, number, number];
  // Optional barre at fret X covering strings [from..to] (0..5)
  barre?: { fret: number; from: number; to: number };
  baseFret?: number; // what fret to label as the top
}

const G: Record<string, GuitarShape> = {
  // Major
  C: { frets: [-1, 3, 2, 0, 1, 0] },
  D: { frets: [-1, -1, 0, 2, 3, 2] },
  E: { frets: [0, 2, 2, 1, 0, 0] },
  F: { frets: [1, 3, 3, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
  G: { frets: [3, 2, 0, 0, 0, 3] },
  A: { frets: [-1, 0, 2, 2, 2, 0] },
  B: { frets: [-1, 2, 4, 4, 4, 2], barre: { fret: 2, from: 1, to: 5 } },

  // Minor
  Cm: { frets: [-1, 3, 5, 5, 4, 3], barre: { fret: 3, from: 1, to: 5 }, baseFret: 3 },
  Dm: { frets: [-1, -1, 0, 2, 3, 1] },
  Em: { frets: [0, 2, 2, 0, 0, 0] },
  Fm: { frets: [1, 3, 3, 1, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
  Gm: { frets: [3, 5, 5, 3, 3, 3], barre: { fret: 3, from: 0, to: 5 }, baseFret: 3 },
  Am: { frets: [-1, 0, 2, 2, 1, 0] },
  Bm: { frets: [-1, 2, 4, 4, 3, 2], barre: { fret: 2, from: 1, to: 5 }, baseFret: 2 },

  // 7
  C7: { frets: [-1, 3, 2, 3, 1, 0] },
  D7: { frets: [-1, -1, 0, 2, 1, 2] },
  E7: { frets: [0, 2, 0, 1, 0, 0] },
  F7: { frets: [1, 3, 1, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
  G7: { frets: [3, 2, 0, 0, 0, 1] },
  A7: { frets: [-1, 0, 2, 0, 2, 0] },
  B7: { frets: [-1, 2, 1, 2, 0, 2] },

  // m7
  Am7: { frets: [-1, 0, 2, 0, 1, 0] },
  Dm7: { frets: [-1, -1, 0, 2, 1, 1] },
  Em7: { frets: [0, 2, 0, 0, 0, 0] },
  Bm7: { frets: [-1, 2, 4, 2, 3, 2], barre: { fret: 2, from: 1, to: 5 }, baseFret: 2 },

  // maj7
  Cmaj7: { frets: [-1, 3, 2, 0, 0, 0] },
  Dmaj7: { frets: [-1, -1, 0, 2, 2, 2] },
  Fmaj7: { frets: [-1, -1, 3, 2, 1, 0] },
  Gmaj7: { frets: [3, 2, 0, 0, 0, 2] },
  Amaj7: { frets: [-1, 0, 2, 1, 2, 0] },

  // sus
  Asus4: { frets: [-1, 0, 2, 2, 3, 0] },
  Dsus4: { frets: [-1, -1, 0, 2, 3, 3] },
  Esus4: { frets: [0, 2, 2, 2, 0, 0] },
};

// alias map for sharp/flat equivalence
const SHARP_FLAT: Record<string, string> = {
  'C#': 'Db', Db: 'C#',
  'D#': 'Eb', Eb: 'D#',
  'F#': 'Gb', Gb: 'F#',
  'G#': 'Ab', Ab: 'G#',
  'A#': 'Bb', Bb: 'A#',
};

// Try direct lookup, then enharmonic alias.
function lookupExact(name: string): GuitarShape | undefined {
  if (G[name]) return G[name];
  // Replace root only with enharmonic
  const m = /^([A-G][#b]?)(.*)$/.exec(name);
  if (!m) return undefined;
  const alt = SHARP_FLAT[m[1]];
  if (alt && G[alt + m[2]]) return G[alt + m[2]];
  return undefined;
}

// Normalize obscure chord-quality notation seen in the database (C7+, $^7$, etc.)
function normalizeQuality(raw: string): string {
  return raw
    .replace(/\$\^\{?#\}?\$/g, '#')
    .replace(/\$\^\{?b\}?\$/g, 'b')
    .replace(/\$\^\{?(\d+)\}?\$/g, '$1')
    .replace(/[()]/g, '')
    .replace(/7\+/g, 'maj7')
    .replace(/sus$/, 'sus4')
    .trim();
}

const ROOTS_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Build a synthesized barré shape by transposing a known base shape up the neck.
function synthesize(root: string, quality: string): GuitarShape | undefined {
  // Start from E or A barre forms
  const eBase: Record<string, GuitarShape> = {
    '': G.F, // major from F (E-shape)
    m: G.Fm,
    '7': G.F7,
    m7: { frets: [1, 3, 1, 1, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
    maj7: { frets: [-1, -1, 3, 2, 1, 0] },
    sus4: { frets: [1, 3, 3, 3, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
    dim: { frets: [-1, -1, 0, 1, 0, 1] },
  };
  const base = eBase[quality];
  if (!base) return undefined;
  const idx = noteIndex(root);
  if (idx === -1) return undefined;
  const fIdx = noteIndex('F');
  const shift = ((idx - fIdx) + 12) % 12;
  const moved = base.frets.map((f) => (f < 0 ? -1 : f + shift)) as GuitarShape['frets'];
  return {
    frets: moved,
    barre: base.barre ? { ...base.barre, fret: base.barre.fret + shift } : undefined,
    baseFret: 1 + shift,
  };
}

export function getGuitarShape(chord: string): GuitarShape | null {
  const m = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(chord.trim());
  if (!m) return null;
  const [, root, rawQuality] = m;
  const quality = normalizeQuality(rawQuality);
  const exact = lookupExact(root + quality);
  if (exact) return exact;
  return synthesize(root, quality) ?? null;
}

// ---------------- PIANO ----------------

const QUALITY_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  M: [0, 4, 7],
  m: [0, 3, 7],
  '5': [0, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  '9': [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  add9: [0, 4, 7, 14],
};

export interface PianoShape {
  rootPc: number; // pitch class 0..11
  intervals: number[]; // semitones from root
  bassPc?: number;
}

export function getPianoShape(chord: string): PianoShape | null {
  const m = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(chord.trim());
  if (!m) return null;
  const [, root, rawQuality, bass] = m;
  const quality = normalizeQuality(rawQuality);
  const intervals = QUALITY_INTERVALS[quality] ?? QUALITY_INTERVALS[''];
  const rootPc = noteIndex(root);
  if (rootPc === -1) return null;
  const bassPc = bass ? noteIndex(bass) : undefined;
  return { rootPc, intervals, bassPc: bassPc === -1 ? undefined : bassPc };
}

export const PIANO_KEY_NAMES = ROOTS_SHARP;
