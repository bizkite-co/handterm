// src/hooks/useTutorial.ts
import { useState, useCallback, useEffect } from 'react';
import { Tutorial, Tutorials } from "../types/Types";
import { useComputed } from '@preact/signals-react';
import {
    completedTutorialsSignal,
    getNextTutorial,
} from 'src/signals/tutorialSignals';


export const useTutorial = () => {
    const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
    const completedTutorials = useComputed(() => completedTutorialsSignal.value);

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
        getCurrentTutorial: () => currentTutorial,
        getTutorialsInGroup,
        getIncompleteTutorialsInGroup
    };
};