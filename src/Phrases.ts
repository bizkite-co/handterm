
export default class Phrases {
    private static phrases = [
        {
            name: "termux", phrase: "Termux is an Android terminal emulator and Linux environment app that works directly with no rooting or setup required. A minimal base system is installed automatically - additional packages are available using the APT package manager. The termux-shared library was added in v0.109. It defines shared constants and utils of the Termux app and its plugins. It was created to allow for the removal of all hardcoded paths in the Termux app. Some of the termux plugins are using this as well and rest will in future. If you are contributing code that is using a constant or a util that may be shared, then define it in termux-shared library if it currently doesn't exist and reference it from there. Update the relevant changelogs as well. Pull requests using hardcoded values will/should not be accepted. Termux app and plugin specific classes must be added under com.termux.shared.termux package and general classes outside it. The termux-shared LICENSE must also be checked and updated if necessary when contributing code. The licenses of any external library or code must be honoured. The main Termux constants are defined by TermuxConstants class. It also contains information on how to fork Termux or build it with your own package name. Changing the package name will require building the bootstrap zip packages and other packages with the new $PREFIX, check Building Packages for more info. Check Termux Libraries for how to import termux libraries in plugin apps and Forking and Local Development for how to update termux libraries for plugins. The versionName in build.gradle files of Termux and its plugin apps must follow the semantic version 2.0.0 spec in the format major.minor.patch(-prerelease)(+buildmetadata). When bumping versionName in build.gradle files and when creating a tag for new releases on GitHub, make sure to include the patch number as well, like v0.1.0 instead of just v0.1. The build.gradle files and attach_debug_apks_to_release workflow validates the version as well and the build/attachment will fail if versionName does not follow the spec."
        },
        {
            name: "handex", phrase: "Type anywhere with this one-handed keyboard. Stop sitting down to type. Stop looking down to send messages. Built to the shape of your finger actions, this device will eliminate your need to reposition your fingers while typeing. Use the same keyboard, designed for your hand, everywhere. You never have to learn a new one. The natural motions of your fingers compose the characters. It's build around your hand, so you don't have to reorient your finger placement on a board. Repositioning your fingers on a board is the biggest hurdle of typing-training, so don't do it. Handex is built around your finger movements, so you'll never have to reposition your fingers to find a key. Even unusual keys, such `\\`, `~`, `|`, `^`, `&` are easy to type. Handex liberates you from the key-board-shackle problem. 151 keys are currently available and more are coming."
        },
        { name: "asdf", phrase: "asdf sad dad daf fas fad das dad sas"},
        {name: "jkl;", phrase: "jill kill jelly lilly jolly jill"},
        {
            name: "hello-world", phrase: "Hello, World!"
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
            throw new Error("Phrase not found: " + key);
        }
        return phrase.phrase;
    }

    public static getRandomPhrase(): string {
        const phrasesLength = this.phrases.length;
        const randomKey = Math.floor(Math.random() * phrasesLength);
        const result = this.phrases[randomKey].phrase;
        return result;
    }

}