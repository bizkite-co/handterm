// src/hooks/useWPMCalculator.ts

import { useState, useCallback, useMemo } from 'react';
import { WPM, WPMs } from '../types/Types';

interface Keystroke {
  char: string;
  timestamp: number;
}

export const useWPMCalculator = () => {
  const [keystrokes, setKeystrokes] = useState<Keystroke[]>([]);

  const addKeystroke = useCallback((char: string) => {
    setKeystrokes(prev => [...prev, { char, timestamp: performance.now() }]);
  }, []);

  const getWPMs = useCallback((): WPMs => {
    if (keystrokes.length < 2) return { wpmAverage: 0, charWpms: [] };

    const charWpms: WPM[] = [];
    let totalWPM = 0;

    for (let i = 1; i < keystrokes.length; i++) {
      const duration = keystrokes[i].timestamp - keystrokes[i-1].timestamp;
      const minutes = duration / 60000; // Convert to minutes
      const wpm = 1 / minutes; // 1 character per duration

      charWpms.push({
        character: keystrokes[i].char,
        wpm,
        durationMilliseconds: duration
      });

      totalWPM += wpm;
    }

    const wpmAverage = totalWPM / (keystrokes.length - 1);

    return {
      wpmAverage,
      charWpms: Object.freeze(charWpms) // Make charWpms immutable
    };
  }, [keystrokes]);

  const clearKeystrokes = useCallback(() => {
    setKeystrokes([]);
  }, []);

  // This will update whenever keystrokes change
  const currentWPMs = useMemo(() => getWPMs(), [keystrokes, getWPMs]);

  return {
    addKeystroke,
    getWPMs: () => currentWPMs, // Return the memoized value
    clearKeystrokes,
    keystrokeCount: keystrokes.length // Add this for debugging
  };
};