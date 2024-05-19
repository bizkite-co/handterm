import { CharDuration, LogKeys, TimeCode, CharWPM } from './TerminalTypes';
export interface IWPMCalculator {
    previousTimestamp: number;
    recordKeystroke(character: string): CharDuration;
    saveKeystrokes(timeCode: TimeCode): number;
    clearKeystrokes(): void;
    getKeystrokes(): CharDuration[];
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
        return charsAndSum.wpmSum;
    }

    recordKeystroke(character: string): CharDuration {
        let charDur: CharDuration = { character, durationMilliseconds: 0 };
        if (this.previousTimestamp > 0) {
            charDur.durationMilliseconds = Date.now() - this.previousTimestamp;
        }
        this.previousTimestamp = Date.now();
        // Record the keystroke with the current timestamp
        this.keystrokes.push(charDur);
        return charDur;
    }
    getWPMs(): { wpmSum: number; charWpms: CharWPM[] } {
        let charWpms = this.keystrokes.map(this.getWPM);
        let wpmSum = charWpms.filter(charWpm => charWpm.wpm > 0).reduce((a, b) => a + b.wpm, 0);
        wpmSum = Math.round(wpmSum * 1000) / 1000
        return { wpmSum, charWpms };
    }
    getWPM(charDur: CharDuration): CharWPM {
        let charWpm: CharWPM = { character: charDur.character, wpm: 0.0 };
        if (charDur.durationMilliseconds > 0) {
            let timeDifferenceMinute = charDur.durationMilliseconds / 60000.0
            if (timeDifferenceMinute > 0) {
                let CPM = 1 / timeDifferenceMinute;
                // The standard is that one word = 5 characters
                charWpm.wpm = CPM / 5;
            }
        }
        charWpm.wpm = Math.round(charWpm.wpm * 1000) / 1000
        return charWpm;
    }
}
