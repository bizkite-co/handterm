import { Phrase } from "../utils/Phrase";

export interface ChordDisplayProps {
    displayChar: string[];
}

export function ChordDisplay(
    props: ChordDisplayProps
) {
    if(!props.displayChar || props.displayChar.length === 0) 
        throw new Error('displayChar is required: ' + props.displayChar);
    // TODO: At this point we are expecting Phrase to accept multi-character chord keys.
    const displayCharChords = new Phrase(props.displayChar).chords;
    if(displayCharChords.length === 0) return null;
    const displayCharCode = displayCharChords[0].chordCode;
    const displayChar = props.displayChar
        .join('')
        .replace("Arrow", "")
        .replace("Return (ENTER)", "Enter");
    return (
        <div className="chord-image-holder" id="chord-image-holder" data-source="ErrorDisplay.tsx">
            <div className="col-sm-2 row generated next" id="chord2" >
                <span id="char15" className="char">{displayChar}</span>
                <img loading="lazy" alt="2" src={`${import.meta.env.BASE_URL}images/svgs/${displayCharCode}.svg`} width="75" className="hand"></img>
            </div>
        </div>
    )
}