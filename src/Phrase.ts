import { allChords } from "./allChords.js";
import { Chord } from "./types/Types.js";
import { createHTMLElementFromHTML } from "./utils/dom";

export class Phrase {
    private _value: string;
    private _chords: Chord[] = [];
    private _chordsHTML: HTMLElement[] = [];


    constructor(value: string) {
        this._value = value;
        this.setChords();
    }

    get value(): string {
        return this._value;
    }

    get chordsHTML(): HTMLElement[] {
        return this._chordsHTML;
    }

    get chords(): Chord[] {
        return this._chords;
    }

    setChords(): void {
        Array.from(this._value).forEach((char) => {
            const foundChordHTML = Phrase.findChordHTML(char);
            if (foundChordHTML) {
                this._chordsHTML.push(foundChordHTML);
            }
            const chord = allChords.find(x => x.key == char);
            if (chord) {
                this._chords.push(chord);
            }
        })
    }

    public static createChordHTML(foundChord: Chord): HTMLElement {
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
                    == chordChar; 
                });
        // Load the clone in Chord order into the wholePhraseChords div.
        if (foundChords.length > 0) {
            // const inChord = foundChords[0].cloneNode(true) as HTMLDivElement;
            const foundChord = foundChords[0];
            inChord = this.createChordHTML(foundChord);
            inChord.setAttribute("name", foundChord.key);
        }
        else {
            console.error("Missing chord:", chordChar?.charCodeAt(0));
        }
        return inChord;
    }
}