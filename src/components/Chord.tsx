export interface ChordProps {
    displayChar: string;
    chordCode?: string;
}

import { type FC } from "react";
import { useComputed } from "@preact/signals-react";
import { allChords } from "../allChords";
import { CHORD_GLYPH_BASE } from "../constants/terminal";
import { chordGlyphScaleSignal } from "../signals/appSignals";

export const Chord: FC<ChordProps> = ({ displayChar, chordCode }) => {
    let foundChord = chordCode != null && chordCode !== ''
        ? Array.from(allChords).find(x => x.chordCode === chordCode && (
            x.key === displayChar || x.key.replace('&#x2581;', ' ') === displayChar
        ))
        : undefined;

    if (foundChord == null) {
        foundChord = Array.from(allChords).find(x => {
            return x.key.replace('&#x2581;', ' ') === displayChar;
        });
    }

    if (foundChord == null) {
        foundChord = Array.from(allChords).find(x => x.key === displayChar);
    }

    const foundChar = foundChord?.alias ?? foundChord?.key;
    const glyphCode = chordCode || foundChord?.chordCode;
    const scale = useComputed(() => chordGlyphScaleSignal.value).value;

    return (
        <div className="chord-image-holder" id="chord-image-holder" data-source="ErrorDisplay.tsx">
            <div className="col-sm-2 row generated next" id="chord2">
                <span id="char15" className="char">{foundChar}</span>
                <img alt="2" src={`${import.meta.env.BASE_URL}images/svgs/${glyphCode}.svg`} height={CHORD_GLYPH_BASE.height * scale} width={CHORD_GLYPH_BASE.width * scale} className="hand"></img>
            </div>
        </div>
    );
};

