export interface Segment {
  chord: string;
  text: string;
}

// The source database stores chords with LaTeX-style accidentals/superscripts
// (e.g. `F$^{#}`, `B$^{7}$`, `Cm/E$^{b}`). Convert them to canonical names
// like F#, B7, Cm/Eb before any chord-aware code touches them.
export function normalizeChord(raw: string): string {
  return raw
    .replace(/\$\^\{?#\}?\$?/g, '#')
    .replace(/\$\^\{?b\}?\$?/g, 'b')
    .replace(/\$\^\{?(\d+)\}?\$?/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const parseCache = new Map<string, Segment[]>();
const PARSE_CACHE_LIMIT = 4096;

export function parseLine(line: string): Segment[] {
  const cached = parseCache.get(line);
  if (cached) return cached;
  const result = parseLineImpl(line);
  if (parseCache.size >= PARSE_CACHE_LIMIT) parseCache.clear();
  parseCache.set(line, result);
  return result;
}

function parseLineImpl(line: string): Segment[] {
  const regex = /\[(.*?)\]/g;
  const matches: { chord: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    matches.push({ chord: normalizeChord(m[1]), start: m.index, end: m.index + m[0].length });
  }

  if (matches.length === 0) return [{ chord: '', text: line }];

  const segments: Segment[] = [];

  if (matches[0].start > 0) {
    segments.push({ chord: '', text: line.slice(0, matches[0].start) });
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const trailing = next ? line.slice(cur.end, next.start) : line.slice(cur.end);
    // A bracket may contain multiple whitespace-separated chords (e.g. intros).
    // Expand them into one segment per chord; only the last one carries the
    // following lyric text so alignment with the next chord stays correct.
    const chords = cur.chord.split(/\s+/).filter(Boolean);
    if (chords.length === 0) {
      segments.push({ chord: '', text: trailing });
      continue;
    }
    chords.forEach((c, idx) => {
      segments.push({ chord: c, text: idx === chords.length - 1 ? trailing : ' ' });
    });
  }

  return segments;
}

export function isInstrumentalLine(line: string): boolean {
  const stripped = line.replace(/\[(.*?)\]/g, '').trim();
  return stripped.length === 0 && /\[.*?\]/.test(line);
}
