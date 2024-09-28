// src/hooks/usePhraseHandler.ts                                       
import { useState, useEffect } from 'react';
import { ActivityMediatorType } from '../types/Types';
import GamePhrases, { GamePhrase } from '../utils/GamePhrases';

    const [currentPhrase, setCurrentPhrase] = useState<GamePhrase | null>(null);
    const [tutorialGroupPhrases, setTutorialGroupPhrases] = useState<GamePhrase[]>([]);

    useEffect(() => {
        // Handle achievements and tutorial phrases                                              
        const phrasesNotAchieved = GamePhrases.getGamePhrasesNotAchieved();
        if (activityMediator.isInGameMode) {
            const firstIcompletePhrase = activityMediator.tutorialGroupPhrases.find(p => !p.isComplete);
            const phrase = firstIcompletePhrase ?? GamePhrases.getNthGamePhraseNotAchieved(0);
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