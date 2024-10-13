// src/hooks/useTutorial.ts
import { useState, useCallback, useEffect } from 'react';
import { Tutorial, Tutorials } from "../types/Types";
import { useComputed } from '@preact/signals-react';
import { completedTutorialsSignal, setCompletedTutorial, resetCompletedTutorials } from 'src/signals/gameSignals';


export const useTutorial = () => {
    const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
    const completedTutorials = useComputed(() => completedTutorialsSignal.value);

    // Get all completed tutorials as an array if needed
    const completedTutorialsArray = () => {
        return [...completedTutorialsSignal.value];
    }

    const getNextTutorial = useCallback((): Tutorial | null => {
        const nextTutorial = Tutorials
            .find(a => !completedTutorialsArray().some(ua => ua === a.phrase.join('')));
        return nextTutorial || null;
    }, [completedTutorials]);

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

    const unlockTutorial = useCallback((command: string): boolean => {
        let nextTutorial = getNextTutorial();
        if (!nextTutorial) return false;
        if (command === '\r') command = 'Return (ENTER)';
        if (nextTutorial.phrase.join('') === command) {
            setCompletedTutorial(command);
            // Update nextTutorial
            nextTutorial = getNextTutorial();
            setCurrentTutorial(nextTutorial);
            return true;
        }
        return false;
    }, []);

    const resetTutorial = () => {
        resetCompletedTutorials();
    }

    useEffect(() => {
        const nextTutorial = getNextTutorial();
        setCurrentTutorial(nextTutorial);
    }, [completedTutorials, getNextTutorial]);

    return {
        currentTutorial,
        unlockTutorial,
        resetTutorial,
        completedTutorials,
        getCurrentTutorial: () => currentTutorial,
        getNextTutorial,
        getIncompleteTutorials,
        getTutorialsInGroup,
        getIncompleteTutorialsInGroup
    };
};