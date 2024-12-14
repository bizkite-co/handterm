import { useState, useCallback, useEffect } from 'react';
import { ActivityType, ParsedCommand, GamePhrase, Tutorial } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import GamePhrases from '../utils/GamePhrases';
import { useTutorial } from './useTutorials';
import {
    setNextTutorial, resetCompletedTutorials,
    tutorialSignal, getNextTutorial, setCompletedTutorial
} from 'src/signals/tutorialSignals';
import {
    getIncompletePhrasesByTutorialGroup, initializeGame,
    isInGameModeSignal, setCompletedGamePhrase,
    getNextGamePhrase,
    setGamePhrase,
    gameInitSignal
} from 'src/signals/gameSignals';
import { activitySignal, setNotification, bypassTutorialSignal } from 'src/signals/appSignals'
import { useComputed } from '@preact/signals-react';
import { createLogger } from 'src/utils/Logger';
import { navigate, parseLocation } from 'src/utils/navigationUtils';

const logger = createLogger({ prefix: 'ActivityMediator' });

export function useActivityMediator() {
    const [heroAction, setHeroAction] = useState<ActionType>('Idle');
    const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
    const {
        getIncompleteTutorialsInGroup,
        canUnlockTutorial
    } = useTutorial();
    const activity = useComputed(() => activitySignal.value).value;
    const bypassTutorial = useComputed(() => bypassTutorialSignal.value);
    const currentTutorialSignal = useComputed(() => tutorialSignal.value);

    const transitionToGame = useCallback((contentKey?: string | null, groupKey?: string | null) => {
        // First set the game mode signals
        isInGameModeSignal.value = true;
        gameInitSignal.value = true;
        activitySignal.value = ActivityType.GAME;

        // Then update location and wait for navigation to complete
        return new Promise<void>((resolve) => {
            const handleLocationChange = () => {
                window.removeEventListener('locationchange', handleLocationChange);
                resolve();
            };
            window.addEventListener('locationchange', handleLocationChange);

            navigate({
                activityKey: ActivityType.GAME,
                contentKey: contentKey ?? null,
                groupKey: groupKey ?? null
            });
        });
    }, []);

    const setActivityWithNavigation = useCallback(async (newActivity: ActivityType, contentKey?: string | null, groupKey?: string | null) => {
        if (newActivity === ActivityType.GAME) {
            await transitionToGame(contentKey, groupKey);
        } else {
            activitySignal.value = newActivity;
            isInGameModeSignal.value = false;
            navigate({
                activityKey: newActivity,
                contentKey: contentKey ?? null,
                groupKey: groupKey ?? null
            });
        }
    }, [transitionToGame]);

    const decideActivityChange = useCallback((commandActivity: ActivityType | null = null): ActivityType => {
        logger.debug('Deciding activity change:', {
            commandActivity,
            currentActivity: activity,
            bypassTutorial: bypassTutorial.value,
            currentTutorial: currentTutorialSignal.value
        });

        const bypassTutorialValue = bypassTutorial.value;
        if (bypassTutorialValue) {
            return ActivityType.NORMAL;
        }
        if (tutorialSignal.value && !tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
            return ActivityType.TUTORIAL;
        }

        if (currentTutorialSignal.value && currentTutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
            return ActivityType.GAME;
        }
        if (getNextTutorial()) commandActivity = ActivityType.TUTORIAL;

        return commandActivity ?? ActivityType.NORMAL;
    }, [activity, bypassTutorial, currentTutorialSignal]);

    const checkGameProgress = useCallback(async (successPhrase: GamePhrase) => {
        logger.debug('Checking game progress:', successPhrase);
        const groupKey = parseLocation().groupKey ?? '';
        setCompletedGamePhrase(successPhrase.key);
        if (groupKey) {
            const nextPhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
            if (nextPhraseInGroup) {
                setGamePhrase(getNextGamePhrase());
                await setActivityWithNavigation(ActivityType.GAME, nextPhraseInGroup.key, nextPhraseInGroup.tutorialGroup);
                return;
            }
            const incompleteTutorialInGroup = getIncompleteTutorialsInGroup(groupKey);
            incompleteTutorialInGroup.forEach(itig => {
                setCompletedTutorial(itig.phrase);
            });
            const nextTutorial = getNextTutorial();
            if (nextTutorial) {
                const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
                await setActivityWithNavigation(resultActivity, nextTutorial.phrase, nextTutorial.tutorialGroup);
                return;
            }
        }

        const nextGamePhrase = getNextGamePhrase();
        if (nextGamePhrase) {
            setGamePhrase(nextGamePhrase);
            await setActivityWithNavigation(ActivityType.GAME, nextGamePhrase.key, nextGamePhrase.tutorialGroup);
            return;
        }
        await setActivityWithNavigation(ActivityType.NORMAL);
    }, [
        decideActivityChange,
        getIncompleteTutorialsInGroup,
        setActivityWithNavigation
    ]);

    const checkTutorialProgress = useCallback(async (command: string | null) => {
        logger.debug('Checking tutorial progress:', {
            command,
            currentTutorial: tutorialSignal.value,
            activity: activitySignal.value,
            location: parseLocation()
        });

        const nextTutorialValue = getNextTutorial();
        if (!nextTutorialValue) {
            logger.debug('No current tutorial found');
            return;
        }

        const groupKey = parseLocation().groupKey ?? '';
        // Normalize command for Enter key
        command = command === '' ? '\r' : command;
        if (command) {
            logger.debug('Checking if can unlock tutorial:', {
                command,
                currentPhrase: nextTutorialValue.phrase,
                charCodesCommand: [...command].map(c => c.charCodeAt(0)),
                charCodesPhrase: [...nextTutorialValue.phrase].map(c => c.charCodeAt(0))
            });

            if (canUnlockTutorial(command)) {
                logger.debug('Tutorial unlocked:', command);
                if (groupKey) {
                    const incompletePhrasesInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
                    if (incompletePhrasesInGroup) {
                        // Initialize game first
                        initializeGame(groupKey);
                        // Then transition to game mode
                        await setActivityWithNavigation(ActivityType.GAME, incompletePhrasesInGroup.key, incompletePhrasesInGroup.tutorialGroup);
                    }
                    return;
                }
                setCompletedTutorial(nextTutorialValue.phrase);
            } else {
                logger.debug('Tutorial not unlocked:', {
                    expected: nextTutorialValue.phrase,
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
            await setActivityWithNavigation(resultActivity, nextTutorial.phrase, nextTutorial.tutorialGroup);
            return;
        }
        const nextGamePhrase = getNextGamePhrase();
        if (nextGamePhrase) {
            await setActivityWithNavigation(ActivityType.GAME, nextGamePhrase?.key, groupKey);
        }
        return;
    }, [
        decideActivityChange,
        canUnlockTutorial,
        setActivityWithNavigation
    ]);

    const handleCommandExecuted = useCallback(async (parsedCommand: ParsedCommand): Promise<boolean> => {
        logger.debug('Handling command:', parsedCommand);
        let result = false;
        if (parseLocation().activityKey === ActivityType.TUTORIAL) {
            await checkTutorialProgress(parsedCommand.command);
        }
        else if (parseLocation().activityKey === ActivityType.GAME && parseLocation().contentKey) {
            const gamePhrase = GamePhrases.getGamePhraseByKey(parseLocation().contentKey || '')
            if (gamePhrase) await checkGameProgress(gamePhrase);
        }
        switch (parsedCommand.command) {
            case 'play': {
                const nextGamePhrase = getNextGamePhrase();
                initializeGame();
                await setActivityWithNavigation(ActivityType.GAME, nextGamePhrase?.key);
                result = true;
                break;
            }
            case 'tut': {
                if ('r' in parsedCommand.switches) {
                    resetCompletedTutorials();
                }
                const nextTutorial = getNextTutorial();
                await setActivityWithNavigation(ActivityType.TUTORIAL, nextTutorial?.phrase, nextTutorial?.tutorialGroup);
                result = true;
                break;
            }
            default:
                result = false;
        }

        return result;
    }, [checkGameProgress, checkTutorialProgress, setActivityWithNavigation]);

    useEffect(() => {
        const resultActivity = decideActivityChange(null);
        if (resultActivity === ActivityType.TUTORIAL) {
            void checkTutorialProgress(null);
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
