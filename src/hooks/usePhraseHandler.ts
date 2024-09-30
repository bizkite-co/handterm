// src/hooks/usePhraseHandler.ts                                       
import { useState, useEffect } from 'react';
import { ActivityType } from '../types/Types';
import GamePhrases, { GamePhrase } from '../utils/GamePhrases';

export interface IPhraseHandlerProps {
    currentActivity: ActivityType;
}
export interface UsePhraseHandlerReturn {
    currentPhrase: GamePhrase | null;
    getIncompleteTutorialGroupPhrase: () => (GamePhrase | null);
    resetTutorialGroupPhrases: () => void;
}

export function usePhraseHandler(props: IPhraseHandlerProps):UsePhraseHandlerReturn {
    const [currentPhrase, setCurrentPhrase] = useState<GamePhrase | null>(null);
    const [tutorialGroupPhrases, setTutorialGroupPhrases] = useState<GamePhrase[]>([]);

    useEffect(() => {
        // Handle achievements and tutorial phrases                                              
        if (props.currentActivity === ActivityType.GAME) {
            const firstIcompletePhrase = getIncompleteTutorialGroupPhrase();
            const phrase = firstIcompletePhrase ?? GamePhrases.getNthGamePhraseNotAchieved(0);
            if (phrase) {
                setCurrentPhrase(phrase);
            }
        } else {
            const firstIncompletePhrase = getIncompleteTutorialGroupPhrase();
            if (firstIncompletePhrase) {
                setCurrentPhrase({
                    value: firstIncompletePhrase.value,
                    key: firstIncompletePhrase.key,
                });
            }
        }
    }, [props.currentActivity, currentPhrase]);
    // ... any other phrase-related logic

    const resetTutorialGroupPhrases = () => {
        setTutorialGroupPhrases([]);
    }
    const getIncompleteTutorialGroupPhrase = ():(GamePhrase | null) => {
        return tutorialGroupPhrases.find(p => !p.isComplete) ?? null;
    }

    return {
        currentPhrase,
        getIncompleteTutorialGroupPhrase,
        resetTutorialGroupPhrases
    };
}            