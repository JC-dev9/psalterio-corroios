import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChordLine } from '@/src/components/ChordLine';
import { AutoScrollBar } from '@/src/components/song/AutoScrollBar';
import {
  ChordDetailSheet,
  ChordDetailSheetHandle,
} from '@/src/components/song/ChordDetailSheet';
import { ChordDictionary, Instrument } from '@/src/components/song/ChordDictionary';
import { KeySheet, KeySheetHandle } from '@/src/components/song/KeySheet';
import { ListenSheet, ListenSheetHandle } from '@/src/components/song/ListenSheet';
import { SongToolbar } from '@/src/components/song/SongToolbar';
import { getSongById } from '@/src/data/songs';
import { useFavorites } from '@/src/hooks/useFavorites';
import { colors, spacing } from '@/src/theme/colors';
import {
  detectOriginalKey,
  extractUniqueChords,
  KEYS,
  noteIndex,
  preferFlats,
  semitonesBetween,
  transposeChord,
} from '@/src/utils/chord-transposer';

const MIN_FONT = 12;
const MAX_FONT = 28;

// Auto-scroll: speed range tuned so 0 ≈ 0.3 px/frame, 1 ≈ 4 px/frame.
const MIN_PX_PER_FRAME = 0.3;
const MAX_PX_PER_FRAME = 4;

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const songId = parseInt(id ?? '0', 10);
  const song = useMemo(() => getSongById(songId), [songId]);

  const [fontSize, setFontSize] = useState(17);
  const [instrument, setInstrument] = useState<Instrument>('guitar');

  // Transposition: original key + currently selected key
  const originalKey = useMemo(() => (song ? detectOriginalKey(song.content) : 'C'), [song]);
  const [currentKey, setCurrentKey] = useState(originalKey);
  useEffect(() => setCurrentKey(originalKey), [originalKey]);

  const transposeSemitones = useMemo(
    () => semitonesBetween(originalKey, currentKey),
    [originalKey, currentKey],
  );
  const isOriginalKey = transposeSemitones === 0;

  // Chords list (transposed) for the dictionary
  const uniqueChords = useMemo(() => {
    if (!song) return [];
    const useFlats = preferFlats(currentKey);
    const set = new Set<string>();
    extractUniqueChords(song.content).forEach((c) => {
      set.add(transposeChord(c, transposeSemitones, useFlats ? 'F' : currentKey));
    });
    return Array.from(set);
  }, [song, transposeSemitones, currentKey]);

  // Auto-scroll
  const [autoScrollOpen, setAutoScrollOpen] = useState(false);
  const [autoScrollPlaying, setAutoScrollPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.3);

  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef(0);
  const rafRef = useRef<number | null>(null);
  const speedRef = useRef(scrollSpeed);
  speedRef.current = scrollSpeed;

  useEffect(() => {
    if (!autoScrollPlaying) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = () => {
      const px =
        MIN_PX_PER_FRAME + (MAX_PX_PER_FRAME - MIN_PX_PER_FRAME) * speedRef.current;
      offset.current += px;
      scrollRef.current?.scrollTo({ y: offset.current, animated: false });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [autoScrollPlaying]);

  // Sheets
  const keySheetRef = useRef<KeySheetHandle>(null);
  const listenSheetRef = useRef<ListenSheetHandle>(null);
  const chordDetailRef = useRef<ChordDetailSheetHandle>(null);

  const { isFavorite, toggle } = useFavorites();

  const onShiftSemitone = useCallback(
    (delta: number) => {
      const idx = noteIndex(currentKey);
      const newIdx = ((idx + delta) % 12 + 12) % 12;
      // Choose representation based on flat/sharp preference of the previous key
      const useFlats = preferFlats(currentKey);
      // Find the KEY label that matches noteIndex and respects the preference
      const candidates = KEYS.filter((k) => noteIndex(k) === newIdx);
      const next =
        candidates.find((k) => (useFlats ? k.endsWith('b') || !k.includes('#') : !k.endsWith('b'))) ??
        candidates[0];
      setCurrentKey(next);
    },
    [currentKey],
  );

  if (!song) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Música não encontrada.</Text>
      </View>
    );
  }

  const lines = song.content.split('\n');
  const fav = isFavorite(song.id);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `${String(song.number).padStart(2, '0')}. ${song.title}`,
          headerRight: () => (
            <Pressable hitSlop={12} onPress={() => toggle(song.id)}>
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={22}
                color={fav ? colors.danger : colors.text}
              />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        stickyHeaderIndices={[0]}
      >
        <ChordDictionary
          chords={uniqueChords}
          instrument={instrument}
          onChangeInstrument={setInstrument}
          onPressChord={(c) => chordDetailRef.current?.present(c)}
        />

        <View style={styles.lyricsWrap}>
          {song.credits ? <Text style={styles.credits}>{song.credits}</Text> : null}
          {lines.map((line, i) => (
            <ChordLine
              key={i}
              line={line}
              fontSize={fontSize}
              transpose={transposeSemitones}
              targetKey={currentKey}
              onChordPress={(c) => chordDetailRef.current?.present(c)}
            />
          ))}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <AutoScrollBar
        visible={autoScrollOpen}
        playing={autoScrollPlaying}
        speed={scrollSpeed}
        onTogglePlay={() => setAutoScrollPlaying((v) => !v)}
        onSpeedChange={setScrollSpeed}
        onClose={() => {
          setAutoScrollPlaying(false);
          setAutoScrollOpen(false);
        }}
      />

      <SongToolbar
        currentKey={currentKey}
        isOriginalKey={isOriginalKey}
        fontSize={fontSize}
        autoScrollOpen={autoScrollOpen}
        onPressKey={() => keySheetRef.current?.present()}
        onPressListen={() => listenSheetRef.current?.present()}
        onPressAutoScroll={() => {
          setAutoScrollOpen((v) => {
            if (v) setAutoScrollPlaying(false);
            return !v;
          });
        }}
        onChangeFont={(delta) =>
          setFontSize((s) => Math.min(MAX_FONT, Math.max(MIN_FONT, s + delta)))
        }
      />

      <KeySheet
        ref={keySheetRef}
        originalKey={originalKey}
        currentKey={currentKey}
        onSelectKey={setCurrentKey}
        onShiftSemitone={onShiftSemitone}
        onRestore={() => setCurrentKey(originalKey)}
      />

      <ListenSheet ref={listenSheetRef} songTitle={song.title} />

      <ChordDetailSheet ref={chordDetailRef} defaultInstrument={instrument} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  content: {
    paddingBottom: 0,
  },
  lyricsWrap: {
    padding: spacing.lg,
  },
  credits: {
    color: colors.textMuted,
    fontStyle: 'italic',
    fontSize: 12,
    marginBottom: spacing.md,
  },
});
