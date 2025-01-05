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
            initializeGame(groupKey, contentKey);
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

        // Check bypass tutorial flag first
        if (bypassTutorial.value) {
            return ActivityType.NORMAL;
        }

        // Check for pending tutorials
        const nextTutorial = getNextTutorial();
        if (nextTutorial != null) {
            if (nextTutorial.displayAs === "Tutorial") {
                activitySignal.value = ActivityType.TUTORIAL;
                return ActivityType.TUTORIAL;
            }
            if (nextTutorial.displayAs === "Game") {
                activitySignal.value = ActivityType.GAME;
                return ActivityType.GAME;
            }
        }

        // If we're already in tutorial mode, stay there until explicitly completed
        if (activity === ActivityType.TUTORIAL) {
            return ActivityType.TUTORIAL;
        }

        if (currentTutorialRef.current != null && currentTutorialRef.current?.tutorialGroup != null && activity !== ActivityType.GAME) {
            return ActivityType.GAME;
        }
        if (getNextTutorial() != null) commandActivity = ActivityType.TUTORIAL;

        // Default to command activity or NORMAL
        return commandActivity ?? ActivityType.NORMAL;
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
                //TODO: Check if tutorial has related games.
                if (groupKey != null) {
                    const firstIncompletePhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
                    if (firstIncompletePhraseInGroup != null) {
                        transitionToGame(firstIncompletePhraseInGroup.key, firstIncompletePhraseInGroup.tutorialGroup);
                    }
                    return;
                }

                setCompletedTutorial(currentTutorialRef.current.key);

                // Check if there are more tutorials in this group
                const nextTutorial = getNextTutorial();
                if (nextTutorial?.value != null) {
                    logger.debug('Transitioning to next tutorial:', nextTutorial);
                    activitySignal.value = ActivityType.TUTORIAL;
                    setNextTutorial(nextTutorial);
                    navigate({
                        activityKey: ActivityType.TUTORIAL,
                        contentKey: nextTutorial.displayAs === 'Tutorial' ? nextTutorial.key : nextTutorial.value,
                        groupKey: nextTutorial.tutorialGroup ?? null
                    });
                    return;
                }

                // If no more tutorials, transition to game mode
                logger.debug('No more tutorials - transitioning to game mode', {
                    nextTutorial,
                    activitySignal: activitySignal.value,
                    groupKey
                });

                const nextGamePhrase = getNextGamePhrase();
                logger.debug('Next game phrase:', nextGamePhrase);

                if (nextGamePhrase != null) {
                    logger.debug('Transitioning to game with phrase:', nextGamePhrase.key, {
                        currentActivity: activitySignal.value,
                        nextActivity: ActivityType.GAME
                    });
                    activitySignal.value = ActivityType.GAME;
                    logger.debug('Activity signal after transition:', activitySignal.value);
                    transitionToGame(nextGamePhrase.key, groupKey);
                } else {
                    logger.debug('No game phrase found - transitioning to NORMAL mode', {
                        currentActivity: activitySignal.value,
                        nextActivity: ActivityType.NORMAL
                    });
                    activitySignal.value = ActivityType.NORMAL;
                    logger.debug('Activity signal after transition:', activitySignal.value);
                    navigate({ activityKey: ActivityType.NORMAL });
                }
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
