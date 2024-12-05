// src/hooks/useTutorial.ts
import { useState, useCallback, useEffect } from 'react';
import { Tutorial, Tutorials } from "../types/Types";
import { useComputed } from '@preact/signals-react';
import {
    completedTutorialsSignal,
    getNextTutorial,
} from 'src/signals/tutorialSignals';
import { useReactiveLocation } from './useReactiveLocation';

export const useTutorial = () => {
    const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
    const completedTutorials = useComputed(() => completedTutorialsSignal.value);

    const { parseLocation } = useReactiveLocation();


    // Get all completed tutorials as an array if needed
    const completedTutorialsArray = () => {
        return [...completedTutorialsSignal.value];
    }

    const getIncompleteTutorials = useCallback((): Tutorial[] => {
        const incomplete = Tutorials.filter(tut => !completedTutorialsArray().includes(tut.phrase));
        return incomplete;
    }, [])

    const getTutorialsInGroup = (groupName: string) => {
        const result = Tutorials.filter(t => t.tutorialGroup === groupName);
        return result;
    }

    const getTutorialByPhrasekey = (phraseKey: string) => {
        const currentTutorial = Tutorials.find(t => t.phrase === phraseKey?.replace('_r', '\r'));
        return currentTutorial;
    }

    const canUnlockTutorial = (command: string): boolean => {
        const phraseKey = parseLocation().contentKey ?? '';
        const currentTutorial = getTutorialByPhrasekey(phraseKey);
        if (!currentTutorial?.phrase) {
            return false;
        }

        // TODO: This is probably the single biggest problem blocking unification of GamePhrases and Tutorials.
        if (currentTutorial.phrase === command) {
            return true;
        }
        return false;
    };

    const getIncompleteTutorialsInGroup = (groupName: string) => {
        const incompleteTutorials = getIncompleteTutorials();
        const tutorialsInGroup = getTutorialsInGroup(groupName);

        const result = tutorialsInGroup
            .filter(tig => incompleteTutorials.includes(tig));
        return result;
    }

    useEffect(() => {
        const nextTutorial = getNextTutorial();
        setCurrentTutorial(nextTutorial);
    }, [completedTutorials, getNextTutorial]);

    return {
        getTutorialByPhrasekey,
        canUnlockTutorial,
        getTutorialsInGroup,
        getIncompleteTutorialsInGroup
    };
};