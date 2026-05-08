import { normalizeChord } from './chord-parser';

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
};

const SHARP_TO_FLAT: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
};

// Display order in the key picker — chromatic, mixing flats and sharps as Cifra Club does.
export const KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
];

export function noteIndex(note: string): number {
  const normalized = FLAT_TO_SHARP[note] ?? note;
  return SHARP_NOTES.indexOf(normalized);
}

export function preferFlats(key: string): boolean {
  if (!key) return false;
  if (key.endsWith('b')) return true;
  return ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(key);
}

function renderRoot(idx: number, useFlats: boolean): string {
  const i = ((idx % 12) + 12) % 12;
  return useFlats ? FLAT_NOTES[i] : SHARP_NOTES[i];
}

export function transposeChord(chord: string, semitones: number, targetKey?: string): string {
  if (semitones === 0 && !targetKey) return chord;
  // Match optional bass: e.g. C/E, C#m7/G#
  const match = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(chord.trim());
  if (!match) return chord;

  const [, root, flavor, bass] = match;
  const idx = noteIndex(root);
  if (idx === -1) return chord;

  const useFlats = targetKey ? preferFlats(targetKey) : root.endsWith('b');
  const newRoot = renderRoot(idx + semitones, useFlats);

  if (bass) {
    const bassIdx = noteIndex(bass);
    if (bassIdx === -1) return `${newRoot}${flavor}/${bass}`;
    const newBass = renderRoot(bassIdx + semitones, useFlats);
    return `${newRoot}${flavor}/${newBass}`;
  }

  return `${newRoot}${flavor}`;
}

export function extractUniqueChords(content: string): string[] {
  const regex = /\[(.*?)\]/g;
  const set = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    normalizeChord(match[1])
      .split(/\s+/)
      .filter(Boolean)
      .forEach((c) => set.add(c));
  }
  return Array.from(set);
}

// Picks the first parseable chord as a heuristic for the original key.
export function detectOriginalKey(content: string): string {
  const regex = /\[(.*?)\]/;
  const m = regex.exec(content);
  if (!m) return 'C';
  const first = normalizeChord(m[1]).split(/\s+/).filter(Boolean)[0] ?? '';
  const rootMatch = /^([A-G][#b]?)/.exec(first);
  return rootMatch ? rootMatch[1] : 'C';
}

export function semitonesBetween(fromKey: string, toKey: string): number {
  const a = noteIndex(fromKey);
  const b = noteIndex(toKey);
  if (a === -1 || b === -1) return 0;
  let diff = (b - a) % 12;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return diff;
}

export function normalizeRoot(note: string, useFlats: boolean): string {
  if (useFlats && SHARP_TO_FLAT[note]) return SHARP_TO_FLAT[note];
  if (!useFlats && FLAT_TO_SHARP[note]) return FLAT_TO_SHARP[note];
  return note;
}
