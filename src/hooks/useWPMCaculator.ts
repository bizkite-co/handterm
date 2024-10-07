// src/hooks/useWPMCalculator.ts

import { useState, useCallback, useMemo } from 'react';
import { CharDuration } from '../types/TerminalTypes';

interface WPM {
    wpm: number;
    character: string;
    durationMilliseconds: number;
}

export const useWPMCalculator = () => {
    const [keystrokes, setKeystrokes] = useState<{ [key: string]: number[] }>({});

    const addKeystroke = useCallback((character: string) => {
        const timestamp = Date.now();
        setKeystrokes(prev => ({
            ...prev,
            [character]: [...(prev[character] || []), timestamp]
        }));
    }, []);

    const clearKeystrokes = useCallback(() => {
        setKeystrokes({});
    }, []);

    const saveKeystrokes = useCallback((timeCode: string) => {
        localStorage.setItem(`keystrokes_${timeCode}`, JSON.stringify(keystrokes));
    }, [keystrokes]);

    const getWPMs = useCallback((): { wpmAverage: number; charWpms: WPM[] } => {
        let totalWPM = 0;
        let count = 0;
        const charWpms: WPM[] = [];

        Object.entries(keystrokes).forEach(([char, timestamps]) => {
            if (timestamps.length > 1) {
                const durations = timestamps.slice(1).map((t, i) => t - timestamps[i]);
                const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
                const wpm = 60000 / (avgDuration * 5); // Assuming 5 characters per word
                totalWPM += wpm;
                count++;
                charWpms.push({ wpm, character: char, durationMilliseconds: avgDuration });
            }
        });

        const wpmAverage = count > 0 ? totalWPM / count : 0;

        return { wpmAverage, charWpms };
    }, [keystrokes]);

    return {
        addKeystroke,
        clearKeystrokes,
        saveKeystrokes,
        getWPMs
    };
};