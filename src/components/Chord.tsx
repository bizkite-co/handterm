import { allChords } from "../allChords";

export interface ChordProps {
    displayChar: string;
}

export function Chord(
    props: ChordProps
) {
    // TODO: Why is this joined?

    let foundChord
        = Array.from(allChords)
            .find(x => {
                return x.key
                    .replace('&#x2581;', ' ')
                    .replace('(underscore)', '_')
                    // .replace('Return (ENTER)', '\r')
                    == props.displayChar;
            });
    if(!foundChord) {
        foundChord = Array.from(allChords).find(x => x.key == props.displayChar);
    }

    const foundChar = foundChord?.key
        .replace("Arrow", "")
        .replace("Return (ENTER)", "Enter");
    return (
        <div className="chord-image-holder" id="chord-image-holder" data-source="ErrorDisplay.tsx">
            <div className="col-sm-2 row generated next" id="chord2" >
                <span id="char15" className="char">{foundChar}</span>
                <img loading="lazy" alt="2" src={`${import.meta.env.BASE_URL}images/svgs/${foundChord?.chordCode}.svg`} width="75" className="hand"></img>
            </div>
        </div>
    )
}