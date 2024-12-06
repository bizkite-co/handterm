import { useState, useCallback, useEffect, useMemo } from 'react';
import { ActivityType, Tutorial, ParsedCommand, GamePhrase } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import GamePhrases from '../utils/GamePhrases';
import { useTutorial } from './useTutorials';
import {
  setNextTutorial, resetCompletedTutorials,
  tutorialSignal, getNextTutorial, setCompletedTutorial
} from 'src/signals/tutorialSignals';
import {
  gamePhraseSignal,
  getIncompletePhrasesByTutorialGroup, initializeGame,
  isInGameModeSignal, setCompletedGamePhrase,
  getNextGamePhrase,
  setGamePhrase,
} from 'src/signals/gameSignals';
import { activitySignal, setNotification, bypassTutorialSignal } from 'src/signals/appSignals'
import { useComputed } from '@preact/signals-react';
import { useReactiveLocation } from './useReactiveLocation';

export type IActivityMediatorReturn = {
  isInGameMode: boolean;
  isInTutorial: boolean;
  isInEdit: boolean;
  isInNormal: boolean;
  heroAction: ActionType;
  zombie4Action: ActionType;
  handleCommandExecuted: (parsedCommand: ParsedCommand) => boolean;
  setHeroAction: React.Dispatch<React.SetStateAction<ActionType>>,
  setZombie4Action: React.Dispatch<React.SetStateAction<ActionType>>;
  checkTutorialProgress: (command: string | null) => void;
  checkGameProgress: (successPhrase: GamePhrase) => void;
}

export function useActivityMediator(): IActivityMediatorReturn {
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const {
    getIncompleteTutorialsInGroup,
    canUnlockTutorial
  } = useTutorial();
  const activity = useComputed(() => activitySignal.value).value;
  const { updateLocation, parseLocation } = useReactiveLocation();
  const [, setActivityGroupKey] = useState<string>('');
  const bypassTutorial = useComputed(() => bypassTutorialSignal.value);

  useEffect(() => {
    const _activityGroup = parseLocation().groupKey || '';
    if (_activityGroup) setActivityGroupKey(_activityGroup);
  }, [window.location.pathname])

  const decideActivityChange = useCallback((commandActivity: ActivityType | null = null): ActivityType => {
    if (bypassTutorial.value) {
      return ActivityType.NORMAL;
    }
    if (tutorialSignal.value && !tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
      return ActivityType.TUTORIAL;
    }

    if (tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
      return ActivityType.GAME;
    }
    if (getNextTutorial()) commandActivity = ActivityType.TUTORIAL;

    return commandActivity ?? ActivityType.NORMAL;
  }, [activity, tutorialSignal, bypassTutorial]);

  const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand): boolean => {
    let result = false;
    if (parseLocation().activityKey === ActivityType.TUTORIAL) {
      checkTutorialProgress(parsedCommand.command);
    }
    else if (parseLocation().activityKey === ActivityType.GAME && parseLocation().contentKey) {
      const gamePhrase = GamePhrases.getGamePhraseByKey(parseLocation().contentKey || '')
      if (gamePhrase) checkGameProgress(gamePhrase);
    }
    switch (parsedCommand.command) {
      case 'play':
        decideActivityChange(ActivityType.GAME);
        updateLocation({
          activityKey: ActivityType.GAME,
          contentKey: getNextGamePhrase()?.key
        })
        result = true;
        break;
      case 'tut':
        if ('r' in parsedCommand.switches) {
          resetCompletedTutorials();
        }
        decideActivityChange(ActivityType.TUTORIAL);
        const nextTutorial = getNextTutorial();

        updateLocation({
          activityKey: ActivityType.TUTORIAL,
          contentKey: nextTutorial?.phrase,
          groupKey: nextTutorial?.tutorialGroup
        })
        result = true;
        break;
      default:
        result = false;
    }

    return result;
  }, [decideActivityChange, window.location.pathname]);

  useEffect(() => {
    const resultActivity = decideActivityChange(null);
    if (resultActivity === ActivityType.TUTORIAL) {
      checkTutorialProgress(null);
    }
  }, []);

  const checkTutorialProgress = (
    command: string | null,
  ) => {
    const currentTutorial = getNextTutorial();
    if (!currentTutorial) return;

    const groupKey = parseLocation().groupKey ?? '';
    command = command === '' ? '\r' : command;
    if (command) {
      if (canUnlockTutorial(command)) {
        if (groupKey) {
          const incompletePhrasesInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
          if (incompletePhrasesInGroup) {
            activitySignal.value = ActivityType.GAME;
            updateLocation({
              activityKey: ActivityType.GAME,
              contentKey: incompletePhrasesInGroup.key,
              groupKey: incompletePhrasesInGroup.tutorialGroup
            })
            initializeGame(groupKey);
          }
          return;
        }
        setCompletedTutorial(currentTutorial.phrase)
      }
      else {
        setNotification(
          `Tutorial ${tutorialSignal.value} not unlocked with ${command}`
        )
        return;
      }
    }

    const nextTutorial = getNextTutorial();
    if (nextTutorial?.phrase) {
      const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
      setNextTutorial(nextTutorial);
      updateLocation({
        activityKey: resultActivity,
        contentKey: nextTutorial.phrase,
        groupKey: nextTutorial.tutorialGroup
      })
      return;
    }
    activitySignal.value = ActivityType.GAME;
    const nextGamePhrase = getNextGamePhrase();
    if (nextGamePhrase) updateLocation({
      activityKey: ActivityType.GAME,
      contentKey: nextGamePhrase?.key,
      groupKey: groupKey
    })
    return;
  };

  const checkGameProgress = (successPhrase: GamePhrase) => {
    const groupKey = parseLocation().groupKey ?? '';
    setCompletedGamePhrase(successPhrase.key);
    if (groupKey) {
      const nextPhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
      if (nextPhraseInGroup) {
        setGamePhrase(getNextGamePhrase());
        activitySignal.value = ActivityType.GAME;
        updateLocation({
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
        //TODO: The properties have to have a way to be zeroed out.
        updateLocation({
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
      updateLocation({
        activityKey: ActivityType.GAME,
        contentKey: nextGamePhrase.key,
        groupKey: nextGamePhrase.tutorialGroup
      })
      activitySignal.value = ActivityType.GAME;
      isInGameModeSignal.value = true;
      return;
    }
    activitySignal.value = ActivityType.NORMAL;

    updateLocation({ activityKey: ActivityType.NORMAL })
  };

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
