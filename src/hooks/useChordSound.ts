import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';

// Map chord name (canonical, sharps) → remote/local audio URI.
// Drop your own chord samples in assets/chord-audio and require them here:
//   import C from '../../assets/chord-audio/C.mp3'
// We intentionally start empty so the app ships without binary samples;
// the haptic fallback keeps the UX coherent until samples are wired in.
const CHORD_AUDIO: Record<string, string | number> = {
  // C: require('../../assets/chord-audio/C.mp3'),
  // G: require('../../assets/chord-audio/G.mp3'),
};

export function useChordSound() {
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    return () => {
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  const play = useCallback(async (chord: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const source = CHORD_AUDIO[chord] ?? CHORD_AUDIO[chord.replace(/m$/, '')];
    if (!source) return; // No sample wired — haptic is the feedback.
    try {
      playerRef.current?.remove();
      const p = createAudioPlayer(source);
      playerRef.current = p;
      p.play();
    } catch {
      /* ignore */
    }
  }, []);

  return { play };
}
