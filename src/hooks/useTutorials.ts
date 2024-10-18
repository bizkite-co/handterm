// src/hooks/useTutorial.ts
import { useState, useCallback, useEffect } from 'react';
import { Tutorial, Tutorials } from "../types/Types";
import { useComputed } from '@preact/signals-react';
import {
    completedTutorialsSignal,
    getNextTutorial,
    tutorialSignal,
} from 'src/signals/tutorialSignals';
import { useLocation } from 'react-router-dom';

export const useTutorial = () => {
    const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
    const completedTutorials = useComputed(() => completedTutorialsSignal.value);

    const routerLocation = useLocation();
    const [, activityKey, phraseKey] = routerLocation.pathname.split('/');


    // Get all completed tutorials as an array if needed
    const completedTutorialsArray = () => {
        return [...completedTutorialsSignal.value];
    }

    const getIncompleteTutorials = useCallback((): Tutorial[] => {
        const incomplete = Tutorials.filter(tut => !completedTutorialsArray().includes(tut.phrase.join('')));
        return incomplete;
    }, [])

    const getTutorialsInGroup = (groupName: string) => {
        const result = Tutorials.filter(t => t.tutorialGroup === groupName);
        return result;
    }

    const canUnlockTutorial = (command: string): boolean => {
        const currentTutorial = tutorialSignal.value;
        if (!currentTutorial) return false;

        // TODO: This is probably the single biggest problem blocking unification of GamePhrases and Tutorials.
        const normalizedCommand = command === '\r' ? 'Return (ENTER)' : command;
        if (currentTutorial.phrase.join('') === normalizedCommand) {
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
        currentTutorial,
        canUnlockTutorial,
        getCurrentTutorial: () => currentTutorial,
        getTutorialsInGroup,
        getIncompleteTutorialsInGroup
    };
};