import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SongListItem } from '@/src/components/SongListItem';
import { loadSongs } from '@/src/data/songs';
import { useFavorites } from '@/src/hooks/useFavorites';
import { colors, radius, spacing } from '@/src/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const songs = useMemo(() => loadSongs(), []);
  const [query, setQuery] = useState('');
  const { isFavorite, toggle } = useFavorites();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        String(s.number).includes(q),
    );
  }, [songs, query]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.search}
          placeholder="Buscar por título ou número..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textMuted}
            onPress={() => setQuery('')}
          />
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>HINÁRIO COMPLETO · {filtered.length} hinos</Text>

      <FlatList
        data={filtered}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <SongListItem
            song={item}
            isFavorite={isFavorite(item.id)}
            onPress={() => router.push(`/song/${item.id}`)}
            onToggleFavorite={() => toggle(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma música encontrada.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    height: 44,
    gap: spacing.sm,
  },
  search: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
