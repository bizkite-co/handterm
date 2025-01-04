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
import { ActivityType, type ParsedCommand, type GamePhrase } from '../types/Types';
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
    const currentTutorialRef = useRef<GamePhrase | null>(null);

    const transitionToGame = useCallback((contentKey?: string | null, groupKey?: string | null): void => {
        // First initialize game if group key is provided
        if (groupKey != null) {
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
        logger.debug(`Deciding activity change:
            commandActivity: ${commandActivity},
            currentActivity: ${activity},
            bypassTutorial: ${bypassTutorial.value},
            currentTutorial: ${JSON.stringify(tutorialSignal.value)}`);

        // If we're already in tutorial mode, stay there until explicitly completed
        if (activity === ActivityType.TUTORIAL) {
            const nextTutorial = getNextTutorial();
            if (nextTutorial?.displayAs === "Tutorial") {
                return ActivityType.TUTORIAL;
            }
        }

        // Check bypass tutorial flag
        if (bypassTutorial.value) {
            return ActivityType.NORMAL;
        }

        // Check for pending tutorials
        const nextTutorial = getNextTutorial();
        if (nextTutorial != null) {
            if (nextTutorial.displayAs === "Tutorial") {
                return ActivityType.TUTORIAL;
            }
            if (nextTutorial.displayAs === "Game") {
                return ActivityType.GAME;
            }
        }

        // Only transition to NORMAL if there are no pending tutorials
        const hasPendingTutorials = getNextTutorial() !== null;
        return hasPendingTutorials ? ActivityType.TUTORIAL : (commandActivity ?? ActivityType.NORMAL);
    }, [activity, bypassTutorial.value]);

    const checkGameProgress = useCallback((successPhrase: GamePhrase) => {
        logger.debug(`Checking game progress: ${JSON.stringify(successPhrase)}`);
        const groupKey = parseLocation().groupKey ?? '';
        setCompletedGamePhrase(successPhrase.key);
        if (groupKey != null) {
            const nextPhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
            if (nextPhraseInGroup != null) {
                setGamePhrase(getNextGamePhrase());
                transitionToGame(nextPhraseInGroup.key, nextPhraseInGroup.tutorialGroup);
                return;
            }
            const incompleteTutorialInGroup = getIncompleteTutorialsInGroup(groupKey);
            incompleteTutorialInGroup.forEach(itig => {
                setCompletedTutorial(itig.value);
            });
            const nextTutorial = getNextTutorial();
            if (nextTutorial != null) {
                const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
                navigate({
                    activityKey: resultActivity,
                    contentKey: nextTutorial.displayAs === 'Tutorial' ? nextTutorial.key : nextTutorial.value,
                    groupKey: nextTutorial.tutorialGroup ?? ''
                })
                return;
            }
        }

        const nextGamePhrase = getNextGamePhrase();
        if (nextGamePhrase != null) {
            setGamePhrase(nextGamePhrase);
            transitionToGame(nextGamePhrase.key, nextGamePhrase.tutorialGroup);
            return;
        }
        activitySignal.value = ActivityType.NORMAL;
        navigate({ activityKey: ActivityType.NORMAL })
    }, [getIncompleteTutorialsInGroup, transitionToGame, decideActivityChange]);

    const checkTutorialProgress = useCallback((command: string | null) => {
        logger.debug(`Checking tutorial progress: ${JSON.stringify({
            command,
            currentTutorial: tutorialSignal.value,
            activity: activitySignal.value,
            location: parseLocation()
        })}`);

        currentTutorialRef.current = getNextTutorial();
        if (currentTutorialRef.current == null) {
            logger.debug('No current tutorial found');
            return;
        }

        const groupKey = parseLocation().groupKey ?? null;
        // Normalize command for Enter key
        const commandOrReturn = command === '' ? '\r' : command;
        if (commandOrReturn != null) {
            if (currentTutorialRef.current?.value == null) {
                const errorMessage = 'Current tutorial value is undefined: Undefined tutorial value';
                logger.error(errorMessage);
                return;
            }

            logger.debug(`Checking if can unlock tutorial: ${JSON.stringify({
                commandOrReturn,
                currentPhrase: currentTutorialRef.current.value,
                charCodesCommand: [...commandOrReturn].map(c => c.charCodeAt(0)),
                charCodesPhrase: [...currentTutorialRef.current.value].map(c => c.charCodeAt(0))
            })}`);

            if (canUnlockTutorial(commandOrReturn)) {
                logger.debug('Tutorial unlocked:', commandOrReturn);
                if (groupKey != null) {
                    const incompletePhrasesInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
                    if (incompletePhrasesInGroup != null) {
                        transitionToGame(incompletePhrasesInGroup.key, incompletePhrasesInGroup.tutorialGroup);
                    }
                    return;
                }
                setCompletedTutorial(currentTutorialRef.current.key);
            } else {
                logger.debug(`Tutorial not unlocked: ${JSON.stringify({
                    expected: currentTutorialRef.current.value,
                    received: commandOrReturn
                })}`);
                setNotification(
                    `Tutorial ${tutorialSignal.value?.value} not unlocked with ${commandOrReturn}`
                )
                return;
            }
        }

        const nextTutorial = getNextTutorial();
        logger.debug('Next tutorial:', nextTutorial);
        if (nextTutorial?.value != null) {
            const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
            setNextTutorial(nextTutorial);
            navigate({
                activityKey: resultActivity,
                contentKey: nextTutorial.displayAs === 'Tutorial' ? nextTutorial.key : nextTutorial.value,
                groupKey: nextTutorial.tutorialGroup ?? null
            })
            return;
        }
        const nextGamePhrase = getNextGamePhrase();
        if (nextGamePhrase != null) {
            transitionToGame(nextGamePhrase?.key, groupKey);
        }
        return;
    }, [canUnlockTutorial, transitionToGame, decideActivityChange]);

    const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand): boolean => {
        logger.debug('Handling command:', parsedCommand);
        let result = false;
        if (parseLocation().activityKey === ActivityType.TUTORIAL) {
            checkTutorialProgress(parsedCommand.command);
        }
        else if (parseLocation().activityKey === ActivityType.GAME && parseLocation().contentKey != null) {
            const gamePhrase = GamePhrases.getGamePhraseByKey(parseLocation().contentKey ?? '')
            if (gamePhrase != null) checkGameProgress(gamePhrase);
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
                    contentKey: nextTutorial?.key ?? null,
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
