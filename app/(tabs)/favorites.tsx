import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SongListItem } from '@/src/components/SongListItem';
import { loadSongs } from '@/src/data/songs';
import { useFavorites } from '@/src/hooks/useFavorites';
import { colors, spacing } from '@/src/theme/colors';

export default function FavoritesScreen() {
  const router = useRouter();
  const songs = useMemo(() => loadSongs(), []);
  const { favorites, isFavorite, toggle, loading } = useFavorites();

  const filtered = useMemo(
    () => songs.filter((s) => favorites.has(s.id)),
    [songs, favorites],
  );

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <Text style={styles.empty}>Carregando…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Sem favoritos ainda</Text>
          <Text style={styles.emptyHint}>
            Toque no coração ao lado de uma música para guardá-la aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SongListItem
              song={item}
              isFavorite={isFavorite(item.id)}
              onPress={() => router.push(`/song/${item.id}`)}
              onToggleFavorite={() => toggle(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
