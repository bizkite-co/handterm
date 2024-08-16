import Phrases from "./Phrases";

export const getPhrasesAchieved = () => {
    const storedPhrasesAchieved = localStorage.getItem('phrasesAchieved');

    const phrasesAchieved = JSON.parse(storedPhrasesAchieved || '[]').map((phrase: string) => {
        const [wpm, phraseName] = phrase.split(':');
        return { wpm, phraseName };
    });
    return phrasesAchieved;
}

export const getPhrasesNotAchieved = () => {
    const phrasesAchieved = getPhrasesAchieved().map((phrase: { wpm: number; phraseName: string }) => phrase.phraseName);
    return Phrases.phrases.filter((phrase) => !phrasesAchieved.includes(phrase.key));
}

export const getNthPhraseNotAchieved = (n: number) => {
    const phrasesNotAchieved = getPhrasesNotAchieved();
    return phrasesNotAchieved[n];
}