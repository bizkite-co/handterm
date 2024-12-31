import { Chord } from "./Chord";

export function Nav(): JSX.Element {
    return (
        <>
            {['UpArrow', 'LeftArrow', 'DownArrow', 'RightArrow'].map(c => (
                <Chord key={c} displayChar={c} />
            ))}
        </>
    );
}
