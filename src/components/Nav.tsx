import { Chord } from "./Chord";

export function Nav() {
    return (
        ['UpArrow', 'LeftArrow', 'DownArrow', 'RightArrow'].map(c => {
            return <Chord displayChar={c} />
        })
    )
}