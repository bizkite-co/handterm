// src/hooks/usePhraseHandler.ts                                       
import { useState, useEffect } from 'react';
import { ActivityMediatorType } from '../types/Types';
import { PhraseType } from '../utils/Phrases';

export function usePhraseHandler(activityMediator: ActivityMediatorType) {
    const [currentPhrase, setCurrentPhrase] = useState<PhraseType |
        null>(null);

    useEffect(() => {
        if (activityMediator.isInGameMode &&
            activityMediator.tutorialAchievement.phrase.length > 0) {
            const _phrase = activityMediator.tutorialAchievement.phrase;
            setCurrentPhrase({
                value: Array.isArray(_phrase) ? _phrase.join('') : _phrase,
                key: activityMediator.tutorialAchievement.prompt,
            });
        }
    }, [activityMediator.isInGameMode, activityMediator.tutorialAchievement]);

    // ... any other phrase-related logic                                

    return {
        currentPhrase,
        // ... any other state or callbacks you want to expose             
    };
}            