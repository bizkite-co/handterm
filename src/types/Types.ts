export const spaceDisplayChar = "&#x2581;";
export const tabDisplayChar = "&#x2B7E;";
export interface CharTime {
    char: string;
    duration: number;
    time: number;
}

export function createCharTime(char: string, duration: number, time: number): CharTime {
    return { char, duration, time }
}

export type CancelCallback = () => void;

export type InputEventCallback = (event: InputEvent) => void;
export interface ChordRow {
    char: string;
    chord: number;
    strokes: string;
}

export interface Chord {
    key: string;
    chordCode: string;
    index: number;
}
