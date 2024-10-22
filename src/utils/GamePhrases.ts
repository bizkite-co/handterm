import { GamePhrase, MyResponse, Phrases } from "../types/Types";


const standardChars = /^[a-zA-Z0-9\s'";:.!,?]+$/;

export default class GamePhrases {
    public static getGamePhraseByKey(key: string): GamePhrase {
        const phrase = Phrases.find(x => x.key == key);
        if (phrase) {
            // Return specified phrase, if it exists.
            return phrase;
        }
        // Else, return first phrase.
        return this.getGamePhraseByIndex(0);
    }

    public static getGamePhrasesByTutorialGroup(tutorialGroup: string): GamePhrase[] {
        const phrases = Phrases.filter(p => tutorialGroup.includes(p.tutorialGroup || 'exclude'))
        return phrases;
    }

    public checkGamePhrases = (): MyResponse<any> => {
        let response: MyResponse<any> = {
            status: 200,
            message: '',
            data: '',
            error: []
        };
        Phrases.forEach((phrase, index) => {
            if (!standardChars.test(phrase.value)) {
                response.error.push(`Phrase at index ${index} contains non-standard characters: ${phrase.value}`);
                response.status = 400;
            }
        });
        return response;
    };

    public static getGamePhraseByIndex(index: number): GamePhrase {
        if (index >= 0 && index < Phrases.length) {
            return Phrases[index];
        }
        if (index < 0) return Phrases[0];
        if (index >= Phrases.length) return Phrases[Phrases.length - 1];
        return Phrases[0];
    }

    public static getGamePhraseByValue(phrase: string): GamePhrase | null {
        const result = Phrases.find(p => p.value === phrase)
        return result || null;
    }

    public static getGamePhraseNames(): string[] {
        return Phrases.map(x => x.key);
    }

    public static getRandomGamePhrase(): string {
        const phrasesLength = Phrases.length;
        const randomKey = Math.floor(Math.random() * phrasesLength);
        const result = Phrases[randomKey].value;
        return result;
    }
    public static getGamePhrasesAchieved = () => {
        const storedPhrasesAchieved = localStorage.getItem('phrasesAchieved');

        const phrasesAchieved = JSON.parse(storedPhrasesAchieved || '[]').map((phrase: string) => {
            const [wpm, phraseName] = phrase.split(':');
            return { wpm, phraseName };
        });
        return phrasesAchieved;
    }

    public static resetGamePhrasesAchieved = () => {
        localStorage.removeItem('phrasesAchieved');
    }
}
