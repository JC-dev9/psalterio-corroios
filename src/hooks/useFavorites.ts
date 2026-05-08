import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@psalterio:favorites';

let memoryCache: Set<number> | null = null;
const listeners = new Set<(ids: Set<number>) => void>();

async function persist(ids: Set<number>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

async function loadFromStorage(): Promise<Set<number>> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const ids: number[] = raw ? JSON.parse(raw) : [];
    memoryCache = new Set(ids);
  } catch {
    memoryCache = new Set();
  }
  return memoryCache;
}

function notify() {
  if (!memoryCache) return;
  const snapshot = new Set(memoryCache);
  listeners.forEach((fn) => fn(snapshot));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(memoryCache ?? new Set());
  const [loading, setLoading] = useState<boolean>(memoryCache === null);

  useEffect(() => {
    let mounted = true;
    if (memoryCache === null) {
      loadFromStorage().then((ids) => {
        if (!mounted) return;
        setFavorites(new Set(ids));
        setLoading(false);
      });
    }

    const listener = (ids: Set<number>) => setFavorites(new Set(ids));
    listeners.add(listener);
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const toggle = useCallback(async (id: number) => {
    const current = await loadFromStorage();
    if (current.has(id)) current.delete(id);
    else current.add(id);
    await persist(current);
    notify();
  }, []);

  const isFavorite = useCallback((id: number) => favorites.has(id), [favorites]);

  return { favorites, isFavorite, toggle, loading };
}
