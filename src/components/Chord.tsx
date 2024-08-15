export interface ChordProps {
    displayChar: string;
}

import React from 'react';
import { allChords } from "../allChords";

const Chord: React.FC<ChordProps> = ({ displayChar }) => {
    let foundChord = Array.from(allChords).find(x => {
        return x.key.replace('&#x2581;', ' ') === displayChar;
    });

    if (!foundChord) {
        foundChord = Array.from(allChords).find(x => x.key === displayChar);
    }

    const foundChar = foundChord?.alias || foundChord?.key;

    return (
        <div className="chord-image-holder" id="chord-image-holder" data-source="ErrorDisplay.tsx">
            <div className="col-sm-2 row generated next" id="chord2">
                <span id="char15" className="char">{foundChar}</span>
                <img loading="lazy" alt="2" src={`${import.meta.env.BASE_URL}images/svgs/${foundChord?.chordCode}.svg`} width="75" className="hand"></img>
            </div>
        </div>
    );
};

export default Chord;
