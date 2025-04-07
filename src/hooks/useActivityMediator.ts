import { useState, useCallback, useRef, useEffect } from 'react';
import { useComputed } from '@preact/signals-react';

import { activitySignal, setNotification } from 'src/signals/appSignals';
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

import { ActivityType, type ActionType, StorageKeys } from '@handterm/types';
import type { ParsedCommand, GamePhrase } from '../types/Types';
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
    setActivity: (activity: ActivityType) => void;
} {
    const [heroAction, setHeroAction] = useState<ActionType>('Idle');
    const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
    const {
        getIncompleteTutorialsInGroup,
        canUnlockTutorial
    } = useTutorial();
    const activity = useComputed(() => activitySignal.value).value;
    const currentTutorialRef = useRef<GamePhrase | null>(null);

    // Effect to listen for locationchange events dispatched by navigate()
    useEffect(() => {
        const handleLocationChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ activity: ActivityType }>;
            const newActivity = customEvent.detail?.activity;
            if (newActivity) {
                if (activitySignal.peek() !== newActivity) {
                    logger.debug(`locationchange event received, updating activitySignal from ${activitySignal.peek()} to: ${newActivity}`);
                    activitySignal.value = newActivity;
                } else {
                    logger.debug(`locationchange event received, but activitySignal already ${newActivity}`);
                }
            } else {
                logger.warn('locationchange event received without valid detail.activity');
            }
        };

        logger.debug('Adding locationchange event listener');
        window.addEventListener('locationchange', handleLocationChange);

        const currentLocation = parseLocation();
        logger.debug(`Initial location check after listener setup. Current URL activity: ${currentLocation.activityKey}, Current signal: ${activitySignal.peek()}`);
        if (activitySignal.peek() !== currentLocation.activityKey) {
           logger.debug(`Synchronizing activitySignal to current URL activity: ${currentLocation.activityKey}`);
           activitySignal.value = currentLocation.activityKey;
        }

        return () => {
            logger.debug('Removing locationchange event listener');
            window.removeEventListener('locationchange', handleLocationChange);
        };
    }, []);

    const transitionToGame = useCallback((contentKey?: string | null, groupKey?: string | null): void => {
        if (groupKey != null) {
            initializeGame(groupKey, contentKey);
        } else {
            initializeGame();
        }
        navigate({
            activityKey: ActivityType.GAME,
            contentKey: contentKey ?? null,
            groupKey: groupKey ?? null
        });
    }, []);

    const displayAsActivity = useCallback((nextTutorial: GamePhrase): ActivityType => {
        switch (nextTutorial.displayAs) {
            case 'Tutorial':
                return ActivityType.TUTORIAL;
            case 'Game':
                return ActivityType.GAME;
            default:
                return ActivityType.NORMAL;
        }
    }, [])

    const displayAsKey = useCallback((nextTutorial: GamePhrase): string | null => {
        switch (nextTutorial.displayAs) {
            case 'Tutorial':
                return nextTutorial.key;
            case 'Game':
                return nextTutorial.value;
            default:
                return null;
        }
    }, [])


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
                navigate({
                    activityKey: displayAsActivity(nextTutorial),
                    contentKey: displayAsKey(nextTutorial),
                    groupKey: nextTutorial.tutorialGroup ?? ''
                })
                return;
            }
        }

        const nextGamePhrase = getNextGamePhrase();
        if (nextGamePhrase != null) {
            setGamePhrase(getNextGamePhrase());
            transitionToGame(nextGamePhrase.key, nextGamePhrase.tutorialGroup);
            return;
        }
        navigate({ activityKey: ActivityType.NORMAL })
    }, [displayAsActivity, displayAsKey, getIncompleteTutorialsInGroup, transitionToGame]);

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
                setCompletedTutorial(currentTutorialRef.current.key);
                logger.debug('Tutorial unlocked:', commandOrReturn);

                if (groupKey != null) {
                    const firstIncompletePhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
                    if (firstIncompletePhraseInGroup != null) {
                        transitionToGame(firstIncompletePhraseInGroup.key, firstIncompletePhraseInGroup.tutorialGroup);
                    }
                    return;
                }

                const nextTutorial = getNextTutorial();
                if (nextTutorial?.value != null) {
                    logger.debug('Transitioning to next tutorial:', nextTutorial);
                    setNextTutorial(nextTutorial);
                    navigate({
                        activityKey: ActivityType.TUTORIAL,
                        contentKey: nextTutorial.displayAs === 'Tutorial' ? nextTutorial.key : nextTutorial.value,
                        groupKey: nextTutorial.tutorialGroup ?? null
                    });
                    return;
                }

                const isTutorialComplete = getNextTutorial() === null;

                if (isTutorialComplete) {
                    logger.debug('Tutorial complete - transitioning to NORMAL mode', {
                        currentActivity: activitySignal.value,
                        nextActivity: ActivityType.NORMAL
                    });
                    navigate({ activityKey: ActivityType.NORMAL });
                } else {
                    logger.debug('Tutorial not complete - transitioning to game mode', {
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
                        transitionToGame(nextGamePhrase.key, groupKey);
                    } else {
                        logger.debug('No game phrase found - transitioning to NORMAL mode', {
                            currentActivity: activitySignal.value,
                            nextActivity: ActivityType.NORMAL
                        });
                        navigate({ activityKey: ActivityType.NORMAL });
                    }
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
            setNextTutorial(nextTutorial);
            navigate({
                activityKey: displayAsActivity(nextTutorial),
                contentKey: displayAsKey(nextTutorial),
                groupKey: nextTutorial.tutorialGroup ?? null
            })
            return;
        }
        const nextGamePhrase = getNextGamePhrase();
        if (nextGamePhrase != null) {
            transitionToGame(nextGamePhrase?.key, groupKey);
        }
        return;
    }, [canUnlockTutorial, displayAsActivity, displayAsKey, transitionToGame]);

    const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand): boolean => {
        logger.debug('Handling command:', parsedCommand, {
            currentActivity: activitySignal.value,
            tutorialState: tutorialSignal.value,
            location: parseLocation()
        });
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
            case 'edit': {
                // REVERTED: Only check if tutorials are complete. Navigation is handled by editCommand.tsx
                const completedTutorials = localStorage.getItem(StorageKeys.completedTutorials);
                if (!completedTutorials) {
                    logger.debug('Tutorials not complete, edit command blocked by mediator.');
                    setNotification('Complete tutorials before using edit command. Use `complete` to bypass.');
                    result = false; // Command blocked
                } else {
                    logger.debug('Tutorials complete, allowing edit command transition (initiated by command).');
                    // REMOVED redundant navigate call
                    result = true; // Command allowed, navigation handled elsewhere
                }
                break;
            }
            default:
                result = false;
        }

        return result;
    }, [checkGameProgress, checkTutorialProgress, transitionToGame]);

    useEffect(() => {
        if (activity === ActivityType.TUTORIAL) {
            checkTutorialProgress(null);
        }
    }, [activity, checkTutorialProgress]);


    // Initial activity determination - runs once on mount
    useEffect(() => {
        logger.debug('Initial activity determination - starting');
        const completedTutorials = localStorage.getItem(StorageKeys.completedTutorials);
        logger.debug(`Found completed tutorials in localStorage: ${completedTutorials}`);

        if (completedTutorials) {
            logger.debug('Found completed tutorials - transitioning to NORMAL mode');
            resetCompletedTutorials();
            logger.debug('Setting NORMAL activity and clearing URL params');
            navigate({
                activityKey: ActivityType.NORMAL,
                contentKey: null,
                groupKey: null,
                clearParams: true
            }, {
                forceClear: true,
                replace: true,
                skipTutorial: true
            });
        } else {
            logger.debug('No completed tutorials found - checking for next tutorial');
            const nextTutorial = getNextTutorial();
            logger.debug(`Next tutorial found: ${nextTutorial ? nextTutorial.key : 'none'}`);
            const initialActivity = nextTutorial ? ActivityType.TUTORIAL : ActivityType.NORMAL;
            logger.debug(`Navigating to initial activity: ${initialActivity}`);
            navigate({
                activityKey: initialActivity,
                contentKey: null,
                groupKey: null
            });
        }
    }, []);

    const setActivity = useCallback((newActivity: ActivityType) => {
        logger.debug('Setting activity:', newActivity);
        navigate({
            activityKey: newActivity,
            contentKey: parseLocation().contentKey ?? null,
            groupKey: parseLocation().groupKey ?? null
        });
    }, []);

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
        setActivity,
    };
}
