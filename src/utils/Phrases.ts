import { MyResponse } from "src/types/Types";

export type PhraseType = { key: string, value: string };

const standardChars = /^[a-zA-Z0-9\s'";:.!,?]+$/;

export default class Phrases {
    public static readonly phrases: PhraseType[] = [
        { key: "ask", value: "Ask dad; A sad lass had salad." },
        { key: "sad", value: "All sad lads fall."},
        { key: "gallant", value: "A gallant lad; a glass." },
        { key: "alas", value: "Alas, Khal's flask has a crack." },
        { key: "lads", value: "Lads' flags fall as gaffs sag." },
        { key: "hello", value: "Hello, World!" },
        { key: "pack", value: "Pack my box with five dozen liquor jugs." },
        { key: "sphinx", value: "Sphinx of black quartz, judge my vow." },
        { key: "waltz", value: "Waltz, bad nymph, for quick jigs vex." },
        { key: "list", value: "List.map(fun i -> i + 1)[1;2;3]" },
        { key: "mr", value: "Mr. Jock, TV quiz PhD., bags few lynx." },
        { key: "watch", value: "Watch \"Jeopardy!\", Alex Trebek's fun TV" },
        { key: "h1", value: "Type anywhere with this one-handed keyboard. Stop sitting down to type. Stop looking down to send messages." },
        { key: "h2", value: "Built to the shape of your finger actions, this device will eliminate your need to reposition your fingers while typeing." },
        { key: "h3", value: "Use the same keyboard, designed for your hand, everywhere. You never have to learn a new one. The natural motions of your fingers compose the characters." },
        { key: "h4", value: "It's built around your hand, so you don't have to reorient your finger placement on a board. Repositioning your fingers on a board is the biggest hurdle of typing-training, so don't do it." },
        { key: "h5", value: "Handex is built around your finger movements, so you'll never have to reposition your fingers to find a key. Even unusual keys, such `\\`, `~`, `|`, `^`, `&` are easy to type." },
        { key: "h6", value: "Handex liberates you from the key-board-shackle problem. 151 keys are currently available and more are coming." },
        { key: "k=7", value: "k=7; l=8; m=$((k + l)); n=$((k > l ? k : l)); echo \"Max: $n\"; grep 'Max' <<< \"Max: $n\" || echo \"No match found\" > /dev/null; echo \"Sum: $(($m))\"" },
        { key: "x=4", value: "x=4; y=$((x + 5)); z=$((x > 5 ? x : 5)); echo \"Max: $z\"; grep 'Max' <<< \"Max: $z\" || echo \"No match found\" > /dev/null; echo \"Sum: $(($y))\"" },
        { key: "arr", value: "arr=(1 2 3); sum=0; for i in \"${arr[@]}\"; do sum=$(($sum + i)); done; echo \"Sum: $sum\"; [[ $sum -lt 10 ]] && echo \"$sum < 10\" || echo \"$sum >= 10\"" },
        { key: "f()", value: "f() { return $(($1 & $2)); }; f 4 5; echo \"Bitwise AND: $?\"" },
        { key: "a=5", value: "a=5; b=3; c=$((a / b)); d=$((a - b)); echo $c $d; [ $a -gt $b ] && echo \"$a>$b\" || echo \"$a<$b\"; e=$(($a % $b)); echo \"Result: $e\"" }
    ];

    public static getPhraseByKey(key: string): PhraseType {
        const phrase = this.phrases.find(x => x.key == key);
        if (phrase) {
            // Return specified phrase, if it exists.
            return phrase;
        }
        // Else, return first phrase.
        return this.getPhraseByIndex(0);
    }

    public checkPhrases = (): MyResponse<any> => {
        let response: MyResponse<any> = {
            status: 200, 
            message: '',
            data: '',
            error: []
        };
        Phrases.phrases.forEach((phrase, index) => {
            if (!standardChars.test(phrase.value)) {
                response.error.push(`Phrase at index ${index} contains non-standard characters: ${phrase.value}`);
                response.status = 400;
            }
        });
        return response;
    };

    public static getPhraseByIndex(index: number): PhraseType {
        if (index >= 0 && index < this.phrases.length) {
            return this.phrases[index];
        }
        if (index < 0) return this.phrases[0];
        if (index >= this.phrases.length) return this.phrases[this.phrases.length - 1];
        return this.phrases[0];
    }
    public static getPhraseNames(): string[] {
        return Phrases.phrases.map(x => x.key);
    }
    public static getRandomPhrase(): string {
        const phrasesLength = this.phrases.length;
        const randomKey = Math.floor(Math.random() * phrasesLength);
        const result = this.phrases[randomKey].value;
        return result;
    }
}