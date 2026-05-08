import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/theme/colors';
import { Song } from '@/src/types/song';

interface Props {
  song: Song;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export function SongListItem({ song, isFavorite, onPress, onToggleFavorite }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.numberBox}>
        <Text style={styles.number}>{String(song.number).padStart(2, '0')}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        {song.credits ? (
          <Text style={styles.credits} numberOfLines={1}>
            {song.credits}
          </Text>
        ) : null}
      </View>
      <Pressable hitSlop={12} onPress={onToggleFavorite} style={styles.heart}>
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={22}
          color={isFavorite ? colors.danger : colors.textMuted}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  numberBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  number: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  credits: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  heart: {
    padding: spacing.sm,
  },
});
