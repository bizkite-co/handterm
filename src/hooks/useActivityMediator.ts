import { useState, useCallback, useEffect, useRef } from 'react';
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
    const currentTutorial = useRef<Tutorial | null>(null);

    const decideActivityChange = useCallback((commandActivity: ActivityType | null = null): ActivityType => {
        // Breakpoint 15: Deciding activity change
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

        if (currentTutorial.current && currentTutorial.current?.tutorialGroup && activity !== ActivityType.GAME) {
            return ActivityType.GAME;
        }
        if (getNextTutorial()) commandActivity = ActivityType.TUTORIAL;

        return commandActivity ?? ActivityType.NORMAL;
    }, [activity, bypassTutorial]);

    const checkGameProgress = useCallback((successPhrase: GamePhrase) => {
        // Breakpoint 16: Checking game progress
        logger.debug('Checking game progress:', successPhrase);
        const groupKey = parseLocation().groupKey ?? '';
        setCompletedGamePhrase(successPhrase.key);
        if (groupKey) {
            const nextPhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
            if (nextPhraseInGroup) {
                setGamePhrase(getNextGamePhrase());
                activitySignal.value = ActivityType.GAME;
                navigate({
                    activityKey: ActivityType.GAME,
                    contentKey: nextPhraseInGroup.key,
                    groupKey: nextPhraseInGroup.tutorialGroup
                })
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
            navigate({
                activityKey: ActivityType.GAME,
                contentKey: nextGamePhrase.key,
                groupKey: nextGamePhrase.tutorialGroup
            })
            activitySignal.value = ActivityType.GAME;
            isInGameModeSignal.value = true;
            return;
        }
        activitySignal.value = ActivityType.NORMAL;

        navigate({ activityKey: ActivityType.NORMAL })
    }, [
        decideActivityChange,
        getIncompleteTutorialsInGroup
    ]);

    const checkTutorialProgress = useCallback((command: string | null) => {
        // Breakpoint 17: Start of tutorial progress check
        logger.debug('Checking tutorial progress:', {
            command,
            currentTutorial: tutorialSignal.value,
            activity: activitySignal.value,
            location: parseLocation()
        });

        currentTutorial.current = getNextTutorial();
        if (!currentTutorial.current) {
            logger.debug('No current tutorial found');
            return;
        }

        const groupKey = parseLocation().groupKey ?? '';
        // Normalize command for Enter key
        command = command === '' ? '\r' : command;
        if (command) {
            // Breakpoint 18: Tutorial unlock check
            logger.debug('Checking if can unlock tutorial:', {
                command,
                currentPhrase: currentTutorial.current.phrase,
                charCodesCommand: [...command].map(c => c.charCodeAt(0)),
                charCodesPhrase: [...currentTutorial.current.phrase].map(c => c.charCodeAt(0))
            });

            if (canUnlockTutorial(command)) {
                // Breakpoint 19: Tutorial unlocked
                logger.debug('Tutorial unlocked:', command);
                if (groupKey) {
                    const incompletePhrasesInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
                    if (incompletePhrasesInGroup) {
                        activitySignal.value = ActivityType.GAME;
                        navigate({
                            activityKey: ActivityType.GAME,
                            contentKey: incompletePhrasesInGroup.key,
                            groupKey: incompletePhrasesInGroup.tutorialGroup
                        })
                        initializeGame(groupKey);
                    }
                    return;
                }
                setCompletedTutorial(currentTutorial.current.phrase);
            } else {
                logger.debug('Tutorial not unlocked:', {
                    expected: currentTutorial.current.phrase,
                    received: command
                });
                setNotification(
                    `Tutorial ${tutorialSignal.value?.phrase} not unlocked with ${command}`
                )
                return;
            }
        }

        const nextTutorial = getNextTutorial();
        // Breakpoint 20: Setting next tutorial
        logger.debug('Next tutorial:', nextTutorial);
        if (nextTutorial?.phrase) {
            const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
            setNextTutorial(nextTutorial);
            navigate({
                activityKey: resultActivity,
                contentKey: nextTutorial.phrase,
                groupKey: nextTutorial.tutorialGroup
            })
            return;
        }
        activitySignal.value = ActivityType.GAME;
        const nextGamePhrase = getNextGamePhrase();
        if (nextGamePhrase) navigate({
            activityKey: ActivityType.GAME,
            contentKey: nextGamePhrase?.key,
            groupKey: groupKey
        })
        return;
    }, [
        decideActivityChange,
        canUnlockTutorial
    ]);

    const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand): boolean => {
        // Breakpoint 21: Command execution
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
                decideActivityChange(ActivityType.GAME);
                navigate({
                    activityKey: ActivityType.GAME,
                    contentKey: getNextGamePhrase()?.key
                })
                result = true;
                break;
            }
            case 'tut': {
                if ('r' in parsedCommand.switches) {
                    resetCompletedTutorials();
                }
                decideActivityChange(ActivityType.TUTORIAL);
                const nextTutorial = getNextTutorial();

                navigate({
                    activityKey: ActivityType.TUTORIAL,
                    contentKey: nextTutorial?.phrase,
                    groupKey: nextTutorial?.tutorialGroup
                })
                result = true;
                break;
            }
            default:
                result = false;
        }

        return result;
    }, [decideActivityChange, checkGameProgress, checkTutorialProgress]);

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
