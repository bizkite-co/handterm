import { CharDuration, LogKeys, TimeCode, CharWPM } from '../types/TerminalTypes';
export interface IWPMCalculator {
    previousTimestamp: number;
    addKeystroke(character: string): CharDuration;
    saveKeystrokes(timeCode: TimeCode): number;
    clearKeystrokes(): void;
    getKeystrokes(): CharDuration[];
    getWPM(charDur: CharDuration): CharWPM;
    getWPMs(): { wpmAverage: number; charWpms: CharWPM[], wpmSum: number, charCount: number };
}

export class WPMCalculator implements IWPMCalculator {
    previousTimestamp: number = 0;
    keystrokes: CharDuration[];

    getKeystrokes(): CharDuration[] {
        return this.keystrokes;
    }

    constructor() {
        this.keystrokes = [];
    }

    clearKeystrokes(): void {
        this.keystrokes = [];
    }

    saveKeystrokes(timeCode: TimeCode): number {
        let charsAndSum = this.getWPMs();
        localStorage.setItem(LogKeys.CharTime + '_' + timeCode, JSON.stringify(charsAndSum.charWpms));
        this.previousTimestamp = 0;
        return charsAndSum.wpmAverage;
    }

    addKeystroke(character: string): CharDuration {
        let charDur: CharDuration = { character, durationMilliseconds: 0 };
        if (this.previousTimestamp > 0) {
            charDur.durationMilliseconds = performance.now() - this.previousTimestamp;
            if(charDur.durationMilliseconds < 0)  charDur.durationMilliseconds = 0; 
        }
        this.previousTimestamp = performance.now();
        // Record the keystroke with the current timestamp
        this.keystrokes.push(charDur);
        return charDur;
    }

    getWPMs(): { wpmAverage: number; charWpms: CharWPM[], wpmSum: number, charCount: number } {
        let charWpms = this.keystrokes.map(this.getWPM);
        const calcedChars = charWpms.filter(charWpm => charWpm.durationMilliseconds > 1);
        const wpmSum = calcedChars.reduce((a, b) => a + b.wpm, 0);
        let wpmAverage = wpmSum / calcedChars.length;
        wpmAverage = Math.round(wpmAverage * 1000) / 1000
        return { wpmAverage, charWpms, wpmSum, charCount: calcedChars.length };
    }

    getWPM(charDur: CharDuration): CharWPM {
        let charWpm: CharWPM = { character: charDur.character, wpm: 0.0, durationMilliseconds: 0 };
        if (charDur.durationMilliseconds > 0) {
            charWpm.durationMilliseconds = charDur.durationMilliseconds
            let timeDifferenceMinute = charDur.durationMilliseconds / 60000.0
            if (timeDifferenceMinute > 0) {
                const CPM = 1 / timeDifferenceMinute;
                // The standard is that one word = 5 characters
                charWpm.wpm = CPM / 5;
            }
            charWpm.wpm = Math.round(charWpm.wpm * 1000) / 1000
        }
        return charWpm;
    }
}
