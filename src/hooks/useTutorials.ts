// src/hooks/useTutorial.ts
import { useState, useCallback, useEffect } from 'react';
import { Tutorial, Tutorials } from "../types/Types";
import { useComputed } from '@preact/signals-react';
import {
    completedTutorialsSignal,
    getNextTutorial,
} from 'src/signals/tutorialSignals';
import { createLogger } from 'src/utils/Logger';
import { parseLocation } from 'src/utils/navigationUtils';

const logger = createLogger({ prefix: 'useTutorials' });

export const useTutorial = () => {
    const [, setCurrentTutorial] = useState<Tutorial | null>(null);
    const completedTutorials = useComputed(() => completedTutorialsSignal.value);

    // Get all completed tutorials as an array if needed
    const completedTutorialsArray = () => {
        const completed = [...completedTutorialsSignal.value];
        logger.debug('Completed tutorials:', completed);
        return completed;
    }

    const getIncompleteTutorials = useCallback((): Tutorial[] => {
        // Breakpoint 9: Getting incomplete tutorials
        const incomplete = Tutorials.filter(tut => !completedTutorialsArray().includes(tut.phrase));
        logger.debug('Incomplete tutorials:', incomplete);
        return incomplete;
    }, [])

    const getTutorialsInGroup = (groupName: string) => {
        // Breakpoint 10: Getting tutorials in group
        const result = Tutorials.filter(t => t.tutorialGroup === groupName);
        logger.debug('Tutorials in group:', { groupName, result });
        return result;
    }

    const getTutorialByPhrasekey = (phraseKey: string) => {
        // Breakpoint 11: Getting tutorial by phrase key
        const currentTutorial = Tutorials.find(t => t.phrase === phraseKey?.replace('_r', '\r'));
        logger.debug('Getting tutorial by phrase key:', {
            phraseKey,
            currentTutorial,
            normalizedKey: phraseKey?.replace('_r', '\r'),
            allTutorials: Tutorials.map(t => ({ phrase: t.phrase, prompt: t.prompt }))
        });
        return currentTutorial;
    }

    const canUnlockTutorial = (command: string): boolean => {
        // Breakpoint 12: Checking if can unlock tutorial
        const phraseKey = parseLocation().contentKey ?? '';
        const currentTutorial = getTutorialByPhrasekey(phraseKey);
        logger.debug('Checking if can unlock tutorial:', {
            command,
            phraseKey,
            currentTutorial,
            location: parseLocation(),
            completedTutorials: completedTutorialsArray()
        });

        if (!currentTutorial?.phrase) {
            logger.debug('No current tutorial found');
            return false;
        }

        // Breakpoint 13: Tutorial phrase comparison
        if (currentTutorial.phrase === command) {
            logger.debug('Tutorial unlocked:', command);
            return true;
        }
        logger.debug('Tutorial not unlocked:', {
            expected: currentTutorial.phrase,
            received: command,
            charCodesExpected: [...currentTutorial.phrase].map(c => c.charCodeAt(0)),
            charCodesReceived: [...command].map(c => c.charCodeAt(0))
        });
        return false;
    };

    const getIncompleteTutorialsInGroup = (groupName: string) => {
        // Breakpoint 14: Getting incomplete tutorials in group
        const incompleteTutorials = getIncompleteTutorials();
        const tutorialsInGroup = getTutorialsInGroup(groupName);

        const result = tutorialsInGroup
            .filter(tig => incompleteTutorials.includes(tig));
        logger.debug('Incomplete tutorials in group:', {
            groupName,
            result,
            allIncomplete: incompleteTutorials,
            groupTutorials: tutorialsInGroup
        });
        return result;
    }

    useEffect(() => {
        const nextTutorial = getNextTutorial();
        logger.debug('Setting current tutorial:', nextTutorial);
        setCurrentTutorial(nextTutorial);
    }, [completedTutorials]);

    return {
        getTutorialByPhrasekey,
        canUnlockTutorial,
        getTutorialsInGroup,
        getIncompleteTutorialsInGroup
    };
};
