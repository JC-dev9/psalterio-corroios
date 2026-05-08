import database from '../../assets/database.json';
import { parseSong, RawSong, Song } from '../types/song';

export interface IndexedSong extends Song {
  searchIndex: string;
  numberLabel: string;
}

let cache: IndexedSong[] | null = null;
let byId: Map<number, IndexedSong> | null = null;

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function build(): IndexedSong[] {
  const list = (database as RawSong[]).map((raw): IndexedSong => {
    const base = parseSong(raw);
    return {
      ...base,
      numberLabel: String(base.number).padStart(2, '0'),
      searchIndex: stripAccents(
        `${base.title} ${base.credits ?? ''} ${base.number}`,
      ).toLowerCase(),
    };
  });
  list.sort((a, b) => a.number - b.number);
  return list;
}

export function loadSongs(): IndexedSong[] {
  if (!cache) {
    cache = build();
    byId = new Map(cache.map((s) => [s.id, s]));
  }
  return cache;
}

export function getSongById(id: number): IndexedSong | undefined {
  if (!byId) loadSongs();
  return byId!.get(id);
}

export function searchTerm(input: string): string {
  return stripAccents(input.trim()).toLowerCase();
}
