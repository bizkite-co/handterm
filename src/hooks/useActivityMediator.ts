import { useState, useCallback, useEffect, useRef } from 'react';
import { useComputed } from '@preact/signals-react';

import { activitySignal, setNotification, bypassTutorialSignal } from 'src/signals/appSignals';
import {
    getIncompletePhrasesByTutorialGroup, initializeGame,
    setCompletedGamePhrase,
    getNextGamePhrase,
    setGamePhrase,
} from 'src/signals/gameSignals';
import {
    setNextTutorial, resetCompletedTutorials,
    tutorialSignal, getNextTutorial, setCompletedTutorial
} from 'src/signals/tutorialSignals';
import { createLogger } from 'src/utils/Logger';
import { navigate, parseLocation } from 'src/utils/navigationUtils';

import { type ActionType } from '../game/types/ActionTypes';
import { ActivityType, type ParsedCommand, type GamePhrase, type Tutorial } from '../types/Types';
import GamePhrases from '../utils/GamePhrases';

import { useTutorial } from './useTutorials';


const logger = createLogger({ prefix: 'ActivityMediator' });

export function useActivityMediator(): {
    isInGameMode: boolean;
    isInTutorial: boolean;
    isInEdit: boolean;
    isInNormal: boolean;
    checkTutorialProgress: (command: string | null) => void;
    heroAction: ActionType;
    zombie4Action: ActionType;
    handleCommandExecuted: (parsedCommand: ParsedCommand) => boolean;
    setHeroAction: React.Dispatch<React.SetStateAction<ActionType>>;
    setZombie4Action: React.Dispatch<React.SetStateAction<ActionType>>;
    checkGameProgress: (successPhrase: GamePhrase) => void;
} {
    const [heroAction, setHeroAction] = useState<ActionType>('Idle');
    const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
    const {
        getIncompleteTutorialsInGroup,
        canUnlockTutorial
    } = useTutorial();
    const activity = useComputed(() => activitySignal.value).value;
    const bypassTutorial = useComputed(() => bypassTutorialSignal.value);
    const currentTutorialRef = useRef<Tutorial | null>(null);

    const transitionToGame = useCallback((contentKey?: string | null, groupKey?: string | null): void => {
        // First initialize game if group key is provided
        if (groupKey) {
            initializeGame(groupKey);
        } else {
            initializeGame();
        }
        // Then update activity and navigate
        activitySignal.value = ActivityType.GAME;
        navigate({
            activityKey: ActivityType.GAME,
            contentKey: contentKey ?? null,
            groupKey: groupKey ?? null
        });
    }, []);

    const decideActivityChange = useCallback((commandActivity: ActivityType | null = null): ActivityType => {
        logger.debug('Deciding activity change:', {
            commandActivity,
            currentActivity: activity,
            bypassTutorial: bypassTutorial.value,
            currentTutorial: tutorialSignal.value
        });

        const bypassTutorialValue = bypassTutorial.value;
        if (bypassTutorialValue) {
            return ActivityType.NORMAL;
        }
        if (tutorialSignal.value && !tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
            return ActivityType.TUTORIAL;
        }

        if (currentTutorialRef.current && currentTutorialRef.current?.tutorialGroup && activity !== ActivityType.GAME) {
            return ActivityType.GAME;
        }
        if (getNextTutorial()) commandActivity = ActivityType.TUTORIAL;

        return commandActivity ?? ActivityType.NORMAL;
    }, [activity, bypassTutorial.value]);

    const checkGameProgress = useCallback((successPhrase: GamePhrase) => {
        logger.debug('Checking game progress:', successPhrase);
        const groupKey = parseLocation().groupKey ?? '';
        setCompletedGamePhrase(successPhrase.key);
        if (groupKey) {
            const nextPhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
            if (nextPhraseInGroup) {
                setGamePhrase(getNextGamePhrase());
                transitionToGame(nextPhraseInGroup.key, nextPhraseInGroup.tutorialGroup);
                return;
            }
            const incompleteTutorialInGroup = getIncompleteTutorialsInGroup(groupKey);
            incompleteTutorialInGroup.forEach(itig => {
                setCompletedTutorial(itig.phrase);
            });
            const nextTutorial = getNextTutorial();
            if (nextTutorial) {
                const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
                navigate({
                    activityKey: resultActivity,
                    contentKey: nextTutorial.phrase ?? '',
                    groupKey: nextTutorial.tutorialGroup ?? ''
                })
                return;
            }
        }

        const nextGamePhrase = getNextGamePhrase();
        if (nextGamePhrase) {
            setGamePhrase(nextGamePhrase);
            transitionToGame(nextGamePhrase.key, nextGamePhrase.tutorialGroup);
            return;
        }
        activitySignal.value = ActivityType.NORMAL;
        navigate({ activityKey: ActivityType.NORMAL })
    }, [getIncompleteTutorialsInGroup, transitionToGame]);

    const checkTutorialProgress = useCallback((command: string | null) => {
        logger.debug('Checking tutorial progress:', {
            command,
            currentTutorial: tutorialSignal.value,
            activity: activitySignal.value,
            location: parseLocation()
        });

        currentTutorialRef.current = getNextTutorial();
        if (!currentTutorialRef.current) {
            logger.debug('No current tutorial found');
            return;
        }

        const groupKey = parseLocation().groupKey ?? '';
        // Normalize command for Enter key
        command = command === '' ? '\r' : command;
        if (command) {
            logger.debug('Checking if can unlock tutorial:', {
                command,
                currentPhrase: currentTutorialRef.current.phrase,
                charCodesCommand: [...command].map(c => c.charCodeAt(0)),
                charCodesPhrase: [...currentTutorialRef.current.phrase].map(c => c.charCodeAt(0))
            });

            if (canUnlockTutorial(command)) {
                logger.debug('Tutorial unlocked:', command);
                if (groupKey) {
                    const incompletePhrasesInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
                    if (incompletePhrasesInGroup) {
                        transitionToGame(incompletePhrasesInGroup.key, incompletePhrasesInGroup.tutorialGroup);
                    }
                    return;
                }
                setCompletedTutorial(currentTutorialRef.current.phrase);
            } else {
                logger.debug('Tutorial not unlocked:', {
                    expected: currentTutorialRef.current.phrase,
                    received: command
                });
                setNotification(
                    `Tutorial ${tutorialSignal.value?.phrase} not unlocked with ${command}`
                )
                return;
            }
        }

        const nextTutorial = getNextTutorial();
        logger.debug('Next tutorial:', nextTutorial);
        if (nextTutorial?.phrase) {
            const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
            setNextTutorial(nextTutorial);
            navigate({
                activityKey: resultActivity,
                contentKey: nextTutorial.phrase,
                groupKey: nextTutorial.tutorialGroup ?? null
            })
            return;
        }
        const nextGamePhrase = getNextGamePhrase();
        if (nextGamePhrase) {
            transitionToGame(nextGamePhrase?.key, groupKey);
        }
        return;
    }, [canUnlockTutorial, transitionToGame]);

    const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand): boolean => {
        logger.debug('Handling command:', parsedCommand);
        let result = false;
        if (parseLocation().activityKey === ActivityType.TUTORIAL) {
            checkTutorialProgress(parsedCommand.command);
        }
        else if (parseLocation().activityKey === ActivityType.GAME && parseLocation().contentKey) {
            const gamePhrase = GamePhrases.getGamePhraseByKey(parseLocation().contentKey || '')
            if (gamePhrase) checkGameProgress(gamePhrase);
        }
        switch (parsedCommand.command) {
            case 'play': {
                const nextGamePhrase = getNextGamePhrase();
                transitionToGame(nextGamePhrase?.key);
                result = true;
                break;
            }
            case 'tut': {
                if ('r' in parsedCommand.switches) {
                    resetCompletedTutorials();
                }
                const nextTutorial = getNextTutorial();
                navigate({
                    activityKey: ActivityType.TUTORIAL,
                    contentKey: nextTutorial?.phrase ?? null,
                    groupKey: nextTutorial?.tutorialGroup ?? null
                })
                result = true;
                break;
            }
            default:
                result = false;
        }

        return result;
    }, [checkGameProgress, checkTutorialProgress, transitionToGame]);

    useEffect(() => {
        const resultActivity = decideActivityChange(null);
        if (resultActivity === ActivityType.TUTORIAL) {
            checkTutorialProgress(null);
        }
    }, [decideActivityChange, checkTutorialProgress]);

    return {
        isInGameMode: activity === ActivityType.GAME,
        isInTutorial: activity === ActivityType.TUTORIAL,
        isInEdit: activity === ActivityType.EDIT,
        isInNormal: activity === ActivityType.NORMAL,
        checkTutorialProgress,
        heroAction,
        zombie4Action,
        handleCommandExecuted,
        setHeroAction,
        setZombie4Action,
        checkGameProgress,
    };
}
