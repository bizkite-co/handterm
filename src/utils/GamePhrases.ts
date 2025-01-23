import { type GamePhrase, type MyResponse, Phrases } from "../types/Types";

interface PhraseAchievement {
    wpm: string;
    phraseName: string;
}

const standardChars = /^[a-zA-Z0-9\s'";:.!,?]+$/;

export default class GamePhrases {
    /**
     * Gets a game phrase by its key
     * @param key - The phrase key to search for
     * @returns The matching GamePhrase or null if not found
     */
    public static getGamePhraseByKey(key: string): GamePhrase | null {
        const phrase = Phrases.find(x => x.key == key);
        if (phrase != null) {
            // Return specified phrase, if it exists.
            return phrase;
        }
        // Else, return first phrase.
        return this.getGamePhraseByIndex(0);
    }

    /**
     * Gets game phrases by tutorial group
     * @param tutorialGroup - The tutorial group to filter by
     * @returns Array of matching GamePhrases
     */
    public static getGamePhrasesByTutorialGroup(tutorialGroup: string): GamePhrase[] {
        const phrases = Phrases.filter(p => tutorialGroup.includes(p.tutorialGroup ?? 'exclude'))
        return phrases;
    }

    /**
     * Validates all game phrases for standard characters
     * @returns MyResponse containing validation results
     */
    public checkGamePhrases(): MyResponse<string[]> {
        const response: MyResponse<string[]> = {
            status: 200,
            message: '',
            data: [],
            error: []
        };
        Phrases.forEach((phrase, index) => {
            if (!standardChars.test(phrase.value)) {
                response.error.push(`Phrase at index ${index} contains non-standard characters: ${phrase.value}`);
                response.status = 400;
            }
        });
        return response;
    }

    /**
     * Gets a game phrase by its index
     * @param index - The index of the phrase to retrieve
     * @returns The GamePhrase at the specified index or null if invalid
     */
    public static getGamePhraseByIndex(index: number): GamePhrase | null {
        if (index >= 0 && index < Phrases.length && Phrases[index] != null) {
            return Phrases[index] ?? null;
        }
        if (index < 0 && Phrases[0] != null) return Phrases[0];
        if (index >= Phrases.length && Phrases[Phrases.length - 1] != null){
             return Phrases[Phrases.length - 1] ?? null;
        }
        if (Phrases[0] != null) return Phrases[0];
        throw new Error('No phrases available');
    }

    /**
     * Gets a game phrase by its value
     * @param phrase - The phrase text to search for
     * @returns The matching GamePhrase or null if not found
     */
    public static getGamePhraseByValue(phrase: string): GamePhrase | null {
        const result = Phrases.find(p => p.value === phrase)
        return result ?? null;
    }

    /**
     * Gets all game phrase names
     * @returns Array of phrase names
     */
    public static getGamePhraseNames(): string[] {
        return Phrases.map(x => x.key);
    }

    /**
     * Gets a random game phrase
     * @returns A random phrase value
     * @throws Error if no phrases are available
     */
    public static getRandomGamePhrase(): string {
        const phrasesLength = Phrases.length;
        if (phrasesLength === 0) throw new Error('No phrases available');
        const randomKey = Math.floor(Math.random() * phrasesLength);
        const phrase = Phrases[randomKey];
        if (phrase == null) throw new Error('Invalid phrase index');
        return phrase.value;
    }

    /**
     * Gets achieved phrases from localStorage
     * @returns Array of PhraseAchievement objects
     */
    public static getGamePhrasesAchieved(): PhraseAchievement[] {
        const storedPhrasesAchieved = localStorage.getItem('phrasesAchieved');

        try {
            const parsedPhrases: string[] = JSON.parse(storedPhrasesAchieved ?? '[]') as string[];
            return parsedPhrases.map((phrase: string) => {
                const [wpm, phraseName] = phrase.split(':');
                return {
                    wpm: wpm ?? '',
                    phraseName: phraseName ?? ''
                };
            });
        } catch (error: unknown) {
            // Log error without using console.error
            const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
            if (typeof window !== 'undefined' && window.console?.error) {
                window.console.error('Error parsing phrases achieved:', errorMessage);
            }
            return [];
        }
    }

    /**
     * Resets achieved phrases in localStorage
     */
    public static resetGamePhrasesAchieved(): void {
        localStorage.removeItem('phrasesAchieved');
    }
}
