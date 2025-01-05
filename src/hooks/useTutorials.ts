// src/hooks/useTutorials.ts
import { useComputed } from '@preact/signals-react';
import { useState, useCallback, useEffect } from 'react';

import {
    completedTutorialsSignal,
    getNextTutorial,
} from 'src/signals/tutorialSignals';
import { createLogger } from 'src/utils/Logger';
import { parseLocation } from 'src/utils/navigationUtils';

import { type GamePhrase, Phrases } from "../types/Types";

const logger = createLogger({ prefix: 'useTutorials' });

export const useTutorial = (): {
    getTutorialByPhrasekey: (phraseKey: string) => GamePhrase | undefined;
    canUnlockTutorial: (command: string) => boolean;
    getTutorialsInGroup: (groupName: string) => GamePhrase[];
    getIncompleteTutorialsInGroup: (groupName: string) => GamePhrase[];
} => {
    const [, setCurrentTutorial] = useState<GamePhrase | null>(null);
    const completedTutorials = useComputed(() => completedTutorialsSignal.value);

    const getTutorials = Phrases.filter(p => p.displayAs === 'Tutorial');

    // Get all completed tutorials as an array if needed
    const completedTutorialsArray = (): string[] => {
        const completed = [...completedTutorialsSignal.value];
        logger.debug('Completed tutorials:', completed);
        return completed;
    }

    const getIncompleteTutorials = useCallback((): GamePhrase[] => {
        // Breakpoint 9: Getting incomplete tutorials
        const incomplete = getTutorials.filter(tut => !completedTutorialsArray().includes(tut.key));
        logger.debug('Incomplete tutorials:', incomplete);
        return incomplete;
    }, [getTutorials])

    const getTutorialsInGroup = (groupName: string) => {
        // Breakpoint 10: Getting tutorials in group
        const result = getTutorials.filter(t => t.tutorialGroup === groupName);
        logger.debug('Tutorials in group:', { groupName, result });
        return result;
    }

    const getTutorialByPhrasekey = (phraseKey: string) => {
        // Breakpoint 11: Getting tutorial by phrase key
        const foundTutorial = getTutorials.find(t => t.key === phraseKey?.replace('_r', '\r'));
        logger.debug('Getting tutorial by phrase key:', {
            phraseKey,
            currentTutorial: foundTutorial,
            normalizedKey: phraseKey?.replace('_r', '\r'),
            allTutorials: getTutorials.map(t => ({ key: t.key, value: t.value }))
        });
        return foundTutorial;
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

        if (currentTutorial?.key == null) {
            logger.debug('No current tutorial found');
            return false;
        }

        // Breakpoint 13: Tutorial phrase comparison
        if (currentTutorial.key === command) {
            logger.debug('Tutorial unlocked:', command);
            return true;
        }
        logger.debug('Tutorial not unlocked:', {
            expected: currentTutorial.key,
            received: command,
            charCodesExpected: [...currentTutorial.key].map(c => c.charCodeAt(0)),
            charCodesReceived: [...command].map(c => c.charCodeAt(0))
        });
        return false;
    };

    const getIncompleteTutorialsInGroup = (groupName: string): GamePhrase[] => {
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
