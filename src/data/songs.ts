import database from '../../assets/database.json';
import { parseSong, RawSong, Song } from '../types/song';

let cache: Song[] | null = null;

export function loadSongs(): Song[] {
  if (cache) return cache;
  cache = (database as RawSong[]).map(parseSong).sort((a, b) => a.number - b.number);
  return cache;
}

export function getSongById(id: number): Song | undefined {
  return loadSongs().find((s) => s.id === id);
}
