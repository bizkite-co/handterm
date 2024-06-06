
export default class Phrases {
    private static phrases = [
        { name: "asdf", phrase: "asdf sad dad daf fas fad das dad sas" },
        { name: "jkl;", phrase: "jill kill jelly lilly jolly jill" },
        {
            name: "hello", phrase: "Hello, World!"
        },
        {
            name: "mr-jock", phrase: "Mr. Jock, TV quiz PhD., bags few lynx."
        },
        {
            name: "watch-jeopardy", phrase: "Watch \"Jeopardy!\", Alex Trebek's fun TV"
        },
        {
            name: "pack", phrase: "Pack my box with five dozen liquor jugs."
        },
        {
            name: "handex1", phrase: "Type anywhere with this one-handed keyboard. Stop sitting down to type. Stop looking down to send messages."
        },
        {
            name: "handex2", phrase: "Built to the shape of your finger actions, this device will eliminate your need to reposition your fingers while typeing."
        },
        {
            name: "handex3", phrase: "Use the same keyboard, designed for your hand, everywhere. You never have to learn a new one. The natural motions of your fingers compose the characters."
        },
        {
            name: "handex4", phrase: "It's build around your hand, so you don't have to reorient your finger placement on a board. Repositioning your fingers on a board is the biggest hurdle of typing-training, so don't do it."
        },
        {
            name: "handex5", phrase: "Handex is built around your finger movements, so you'll never have to reposition your fingers to find a key. Even unusual keys, such `\\`, `~`, `|`, `^`, `&` are easy to type."
        },
        {
            name: "handex6", phrase: "Handex liberates you from the key-board-shackle problem. 151 keys are currently available and more are coming."
        },
        {
            name: "k=7", phrase: "k=7; l=8; m=$((k + l)); n=$((k > l ? k : l)); echo \"Max: $n\"; grep 'Max' <<< \"Max: $n\" || echo \"No match found\" > /dev/null; echo \"Sum: $(($m))\""
        },
        {
            name: "x=4", phrase: "x=4; y=$((x + 5)); z=$((x > 5 ? x : 5)); echo \"Max: $z\"; grep 'Max' <<< \"Max: $z\" || echo \"No match found\" > /dev/null; echo \"Sum: $(($y))\""
        },
        {
            name: "waltz", phrase: "Waltz, bad nymph, for quick jigs vex."
        },
        {
            name: "sphinx", phrase: "Sphinx of black quartz, judge my vow."
        },
        {
            name: "list", phrase: "List.map(fun i -> i + 1)[1;2;3]"
        },
        {
            name: "arr=(1 2 3)", phrase: "arr=(1 2 3); sum=0; for i in \"${arr[@]}\"; do sum=$(($sum + i)); done; echo \"Sum: $sum\"; [[ $sum -lt 10 ]] && echo \"$sum < 10\" || echo \"$sum >= 10\""
        },
        {
            name: "f()", phrase: "f() { return $(($1 & $2)); }; f 4 5; echo \"Bitwise AND: $?\""
        },
        {
            name: "a=5", phrase: "a=5; b=3; c=$((a / b)); d=$((a - b)); echo $c $d; [ $a -gt $b ] && echo \"$a>$b\" || echo \"$a<$b\"; e=$(($a % $b)); echo \"Result: $e\""
        }
    ];

    public static getPhrase(key: string): string {
        const phrase = this.phrases.find(x => x.name == key);
        if (!phrase) {
            console.error("Phrase not found: " + key);
        }
        else {
            return phrase.phrase;
        }
        return this.phrases[0].phrase;
    }

    public static getRandomPhrase(): string {
        const phrasesLength = this.phrases.length;
        const randomKey = Math.floor(Math.random() * phrasesLength);
        const result = this.phrases[randomKey].phrase;
        return result;
    }

}