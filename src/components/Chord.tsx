export interface ChordProps {
    displayChar: string;
}

import { type FC } from "react";
import { useComputed } from "@preact/signals-react";
import { allChords } from "../allChords";
import { HANDSHAPE_BASE } from "../constants/terminal";
import { handshapeScaleSignal } from "../signals/appSignals";

export const Chord: FC<ChordProps> = ({ displayChar }) => {
    let foundChord = Array.from(allChords).find(x => {
        return x.key.replace('&#x2581;', ' ') === displayChar;
    });

    if (foundChord == null) {
        foundChord = Array.from(allChords).find(x => x.key === displayChar);
    }

    const foundChar = foundChord?.alias ?? foundChord?.key;
    const scale = useComputed(() => handshapeScaleSignal.value).value;

    return (
        <div className="chord-image-holder" id="chord-image-holder" data-source="ErrorDisplay.tsx">
            <div className="col-sm-2 row generated next" id="chord2">
                <span id="char15" className="char">{foundChar}</span>
                <img loading="lazy" alt="2" src={`${import.meta.env.BASE_URL}images/svgs/${foundChord?.chordCode}.svg`} height={HANDSHAPE_BASE.height * scale} width={HANDSHAPE_BASE.width * scale} className="hand"></img>
            </div>
        </div>
    );
};

