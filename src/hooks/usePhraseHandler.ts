// src/hooks/usePhraseHandler.ts                                       
import { useState, useEffect } from 'react';
import { ActivityMediatorType } from '../types/Types';
import Phrases, { PhraseType } from '../utils/Phrases';

export function usePhraseHandler(activityMediator: ActivityMediatorType) {
    const [currentPhrase, setCurrentPhrase] = useState<PhraseType |
        null>(null);

    useEffect(() => {
        // Handle achievements and tutorial phrases                                              
        const phrasesNotAchieved = Phrases.getPhrasesNotAchieved();
        if (activityMediator.isInGameMode) {
            const firstIcompletePhrase = activityMediator.tutorialGroupPhrases.find(p => !p.isComplete);
            const phrase = firstIcompletePhrase ?? Phrases.getNthPhraseNotAchieved(0);
            if (phrase) {
                setCurrentPhrase(phrase);
            }
        } else {
            const firstIncompletePhrase = activityMediator.tutorialGroupPhrases.find(p =>
                !p.isComplete);
            if (firstIncompletePhrase) {
                setCurrentPhrase({
                    value: firstIncompletePhrase.value,
                    key: firstIncompletePhrase.key,
                });
            }
        }
    }, [activityMediator.currentActivity, activityMediator.tutorialAchievement,
    activityMediator.tutorialGroupPhrases]);
    // ... any other phrase-related logic                                

    return {
        currentPhrase,
    };
}            