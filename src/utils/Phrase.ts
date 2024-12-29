import { allChords } from "../allChords";
import { type Chord } from "../types/Types";

import { createHTMLElementFromHTML } from "./dom";

export class Phrase {
    private internalValue: string[];
    private internalChords: Chord[] = [];
    private internalChordsHTML: HTMLElement[] = [];

    constructor(value: string[]) {
        if(!value || !Array.isArray(value) || value.length == 0){
            throw new Error('Phrase value must be an array with at least one element');
        }
        this.internalValue = value;
        if(!value[0]) return;
        if (Array.isArray(value)) {
            this.setChords(value);
        }
    }

    get value(): string[] {
        return this.internalValue;
    }

    get chordsHTML(): HTMLElement[] {
        return this.internalChordsHTML;
    }

    get chords(): Chord[] {
        return this.internalChords;
    }

    private setChords(keys: string[]): void {
        keys.forEach((key) => {
            const foundChordHTML = Phrase.findChordHTML(key);
            if (foundChordHTML) {
                this.internalChordsHTML.push(foundChordHTML);
            }
            const chord = allChords.find(x => x.key == key);
            if (chord) {
                this.internalChords.push(chord);
            }
        })
    }

    public static createChordHTML(foundChord: Chord | undefined): HTMLElement | null {
        if (!foundChord) return null;
        return createHTMLElementFromHTML(
            `<div class="col-sm-2 row generated" id="chord2">
                <span id="char${foundChord.index}">${foundChord.key}</span>
                <img loading="lazy" alt="2" src="/images/svgs/${foundChord.chordCode}.svg" width="100" class="hand">
            </div>`
        )
    }

    public static findChordHTML(chordChar: string): HTMLElement | null {
        let inChord: HTMLElement | null = null;
        const foundChords
            = Array.from(allChords)
                .filter(x => {
                    return x.key
                        .replace('&#x2581;', ' ')
                        .replace('(underscore)', '_')
                        // .replace('Return (ENTER)', '\r')
                        == chordChar;
                });
        // Load the clone in Chord order into the wholePhraseChords div.
        if (foundChords.length > 0) {
            const foundChord = foundChords[0];
            const chordElement = this.createChordHTML(foundChord);
            if (chordElement && foundChord) {
                chordElement.setAttribute("name", foundChord.key.replace('(', '').replace(')', '').replace(' ', '-'));
                inChord = chordElement;
            }
        }
        // Removed console.error statement
        return inChord;
    }
}
