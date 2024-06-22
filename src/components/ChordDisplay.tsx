
export interface ChordDisplayProps {
    displayChar: string;
    displayCharCode: string;
}

export function ChordDisplay(
    props: ChordDisplayProps
) {
    return (
        <div className="chord-image-holder" id="chord-image-holder" data-source="ErrorDisplay.tsx">
            <div className="col-sm-2 row generated next" id="chord2" >
                <span id="char15" className="char">{props.displayChar}</span>
                <img loading="lazy" alt="2" src={`${import.meta.env.BASE_URL}images/svgs/${props.displayCharCode}.svg`} width="100" className="hand"></img>
            </div>
        </div>
    )
}