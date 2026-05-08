import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/src/theme/colors';

interface Props {
  currentKey: string;
  isOriginalKey: boolean;
  fontSize: number;
  autoScrollOpen: boolean;
  onPressKey: () => void;
  onPressListen: () => void;
  onPressAutoScroll: () => void;
  onChangeFont: (delta: number) => void;
}

export function SongToolbar({
  currentKey,
  isOriginalKey,
  fontSize,
  autoScrollOpen,
  onPressKey,
  onPressListen,
  onPressAutoScroll,
  onChangeFont,
}: Props) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.bar}>
        <ToolbarItem
          icon="key-outline"
          label="Tom"
          accent={!isOriginalKey}
          badge={currentKey}
          onPress={onPressKey}
        />
        <ToolbarItem icon="logo-youtube" label="Ouvir" onPress={onPressListen} />
        <ToolbarItem
          icon={autoScrollOpen ? 'pause-circle-outline' : 'play-circle-outline'}
          label="Rolar"
          accent={autoScrollOpen}
          onPress={onPressAutoScroll}
        />
        <View style={styles.fontGroup}>
          <Pressable onPress={() => onChangeFont(-1)} hitSlop={6} style={styles.fontBtn}>
            <Text style={styles.fontBtnLabel}>A−</Text>
          </Pressable>
          <Text style={styles.fontVal}>{fontSize}</Text>
          <Pressable onPress={() => onChangeFont(+1)} hitSlop={6} style={styles.fontBtn}>
            <Text style={styles.fontBtnLabel}>A+</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface ItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: string;
  accent?: boolean;
  onPress: () => void;
}

function ToolbarItem({ icon, label, badge, accent, onPress }: ItemProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={icon} size={22} color={accent ? colors.primary : colors.text} />
      <Text style={[styles.itemLabel, accent && { color: colors.primary }]}>
        {label}
        {badge ? ` · ${badge}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  item: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 56,
  },
  itemLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  fontGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    gap: 2,
  },
  fontBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  fontBtnLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  fontVal: {
    color: colors.textMuted,
    fontSize: 11,
    minWidth: 18,
    textAlign: 'center',
  },
});
