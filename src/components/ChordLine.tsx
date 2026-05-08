import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Segment, parseLine } from '@/src/utils/chord-parser';
import { transposeChord } from '@/src/utils/chord-transposer';
import { colors } from '@/src/theme/colors';

interface Props {
  line: string;
  fontSize: number;
  transpose: number;
  targetKey?: string;
  onChordPress?: (chord: string) => void;
}

export function ChordLine({ line, fontSize, transpose, targetKey, onChordPress }: Props) {
  if (line.trim() === '') {
    return <View style={{ height: fontSize * 0.8 }} />;
  }

  const segments = parseLine(line);
  const chordHeight = fontSize * 1.2;
  const lineHeight = fontSize * 1.5;

  const onlyChords = segments.every((s) => s.text.trim() === '' && s.chord !== '');

  if (onlyChords) {
    return (
      <View style={[styles.row, { marginBottom: 4 }]}>
        {segments.map((seg, i) => {
          const chord = transposeChord(seg.chord, transpose, targetKey);
          return (
            <ChordChip
              key={i}
              chord={chord}
              fontSize={fontSize * 0.9}
              onPress={onChordPress ? () => onChordPress(chord) : undefined}
              standalone
            />
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.row, { minHeight: lineHeight + chordHeight }]}>
      {segments.map((seg, i) => (
        <ChordSegment
          key={i}
          seg={seg}
          fontSize={fontSize}
          transpose={transpose}
          targetKey={targetKey}
          chordHeight={chordHeight}
          lineHeight={lineHeight}
          onChordPress={onChordPress}
        />
      ))}
    </View>
  );
}

interface SegmentProps {
  seg: Segment;
  fontSize: number;
  transpose: number;
  targetKey?: string;
  chordHeight: number;
  lineHeight: number;
  onChordPress?: (chord: string) => void;
}

function ChordSegment({
  seg,
  fontSize,
  transpose,
  targetKey,
  chordHeight,
  lineHeight,
  onChordPress,
}: SegmentProps) {
  const transposed = seg.chord ? transposeChord(seg.chord, transpose, targetKey) : '';
  return (
    <View style={styles.segment}>
      {seg.chord ? (
        <ChordChip
          chord={transposed}
          fontSize={fontSize * 0.85}
          height={chordHeight}
          onPress={onChordPress ? () => onChordPress(transposed) : undefined}
        />
      ) : (
        <Text style={{ height: chordHeight, lineHeight: chordHeight }}> </Text>
      )}
      <Text
        style={{
          color: colors.text,
          fontSize,
          lineHeight,
        }}
      >
        {seg.text.length === 0 ? ' ' : seg.text}
      </Text>
    </View>
  );
}

interface ChipProps {
  chord: string;
  fontSize: number;
  height?: number;
  onPress?: () => void;
  standalone?: boolean;
}

function ChordChip({ chord, fontSize, height, onPress, standalone }: ChipProps) {
  const content = (
    <Text
      style={[
        styles.chord,
        { fontSize, height: height ?? fontSize * 1.4, lineHeight: height ?? fontSize * 1.4 },
        standalone && { marginRight: 12 },
      ]}
    >
      {chord}
    </Text>
  );
  if (!onPress) return content;
  return (
    <Pressable hitSlop={4} onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.5 }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  segment: {
    flexDirection: 'column',
  },
  chord: {
    color: colors.chord,
    fontWeight: '700',
  },
});
