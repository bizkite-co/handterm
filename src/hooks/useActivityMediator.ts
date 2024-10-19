import { useState, useCallback, useEffect } from 'react';
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
import { activitySignal, setNotification } from 'src/signals/appSignals'
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

class activityPath {
  public activity: ActivityType
  constructor(activity: ActivityType) {
    this.activity = activity;
  }
}

export interface IActivityMediatorProps {
}

export function useActivityMediator(props: IActivityMediatorProps): IActivityMediatorReturn {
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const {
    getIncompleteTutorialsInGroup,
    canUnlockTutorial
  } = useTutorial();
  const activity = useComputed(() => activitySignal.value).value;
  const { reactiveLocation } = useReactiveLocation();
  const [activityGroupKey, setActivityGroupKey] = useState<string>('');

  const baseUrl = window.location.origin;

  useEffect(() => {
    const _activityGroup = reactiveLocation.groupKey || '';
    if (_activityGroup) setActivityGroupKey(_activityGroup);
  }, [reactiveLocation.groupKey])

  const decideActivityChange = useCallback((commandActivity: ActivityType | null = null): ActivityType => {
    if (tutorialSignal.value && !tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
      return ActivityType.TUTORIAL;
    }

    if (tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
      return ActivityType.GAME;
    }
    if (getNextTutorial()) commandActivity = ActivityType.TUTORIAL;

    return commandActivity ?? ActivityType.NORMAL;
  }, [activity, tutorialSignal]);

  const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand): boolean => {
    let result = false;
    switch (parsedCommand.command) {
      case 'play':
        decideActivityChange(ActivityType.GAME);
        reactiveLocation.activity = ActivityType.GAME;
        reactiveLocation.phraseKey = getNextGamePhrase()?.key;
        result = true;
        break;
      case 'tut':
        if ('r' in parsedCommand.switches) {
          resetCompletedTutorials();
        }
        decideActivityChange(ActivityType.TUTORIAL);
        const nextTutorial = getNextTutorial();
        reactiveLocation.activity = ActivityType.TUTORIAL;
        reactiveLocation.phraseKey = nextTutorial?.phrase;
        reactiveLocation.groupKey = nextTutorial?.tutorialGroup;
        result = true;
        break;
      case 'edit':
        decideActivityChange(ActivityType.EDIT);
        reactiveLocation.activity = ActivityType.EDIT;
        reactiveLocation.phraseKey = parsedCommand.args.join('');
        reactiveLocation.groupKey = parsedCommand.switches.toString();
        result = true;
        break;
      default:
        result = false;
    }
    if(reactiveLocation.activity === 'tutorial') 
      checkTutorialProgress(parsedCommand.command);
    if(reactiveLocation.activity === 'game' && reactiveLocation.phraseKey)
    {
      const gamePhrase = GamePhrases.getGamePhraseByKey(reactiveLocation.phraseKey)
      if(gamePhrase) checkGameProgress(gamePhrase);
    }

    return result;
  }, [decideActivityChange, reactiveLocation]);

  useEffect(() => {
    const resultActivity = decideActivityChange(null);
    if (resultActivity === ActivityType.TUTORIAL) {
      checkTutorialProgress(null);
    }
  }, [decideActivityChange]);

  const checkTutorialProgress = (
    command: string | null,
  ) => {
    const nextTutorial = getNextTutorial();
    if (!nextTutorial) return;

    const groupKey = reactiveLocation.groupKey ?? '';
    if (command) {
      if (canUnlockTutorial(command)) {
        if (groupKey) {
          const incompletePhrasesInGroup = getIncompletePhrasesByTutorialGroup(activityGroupKey)[0];
          if (incompletePhrasesInGroup) {
            activitySignal.value = ActivityType.GAME;
            reactiveLocation.activity = ActivityType.GAME;
            reactiveLocation.phraseKey = incompletePhrasesInGroup.key;
            reactiveLocation.groupKey = groupKey;
            initializeGame(groupKey);
          }
          return;
        }
        setCompletedTutorial(nextTutorial.phrase)
      }
      else {
        setNotification(
          `Tutorial ${tutorialSignal.value} not unlocked with ${command}`
        )
        return;
      }
    }
    if (nextTutorial?.phrase) {
      const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
      setNextTutorial(nextTutorial);
      reactiveLocation.activity = resultActivity;
      reactiveLocation.phraseKey = nextTutorial?.phrase;
      reactiveLocation.groupKey = nextTutorial?.tutorialGroup;
      return;
    }
    activitySignal.value = ActivityType.GAME;
    reactiveLocation.activity = ActivityType.GAME;
    reactiveLocation.phraseKey = GamePhrases.getGamePhrasesNotAchieved()[0].key;
    reactiveLocation.groupKey = groupKey;
    return;
  };

  const checkGameProgress = (successPhrase: GamePhrase) => {
    const groupKey = reactiveLocation.groupKey ?? '';
    setCompletedGamePhrase(successPhrase.key);
    if (groupKey) {
      const nextPhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
      if (nextPhraseInGroup) {
        setGamePhrase(getNextGamePhrase());
        activitySignal.value = ActivityType.GAME;
        reactiveLocation.activity = ActivityType.GAME;
        reactiveLocation.phraseKey = nextPhraseInGroup.key;
        reactiveLocation.groupKey = nextPhraseInGroup.tutorialGroup;
        return;
      }
      const incompleteTutorialInGroup = getIncompleteTutorialsInGroup(groupKey);
      incompleteTutorialInGroup.forEach(itig => {
        setCompletedTutorial(itig.phrase);
      });
      const nextTutorial = getNextTutorial();
      if (nextTutorial) {
        const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
        reactiveLocation.activity = activitySignal.value;
        reactiveLocation.phraseKey = nextTutorial.phrase;
        reactiveLocation.groupKey = nextTutorial.tutorialGroup;
        return;
      }
    }

    const nextGamePhrase = GamePhrases.getGamePhrasesNotAchieved()[0];
    if (nextGamePhrase) {
      setGamePhrase(getNextGamePhrase());
      activitySignal.value = ActivityType.GAME;
      reactiveLocation.activity = ActivityType.GAME;
      reactiveLocation.phraseKey = nextGamePhrase.key;
      reactiveLocation.groupKey = nextGamePhrase.tutorialGroup;
      isInGameModeSignal.value = true;
      return;
    }
    activitySignal.value = ActivityType.NORMAL;
    reactiveLocation.activity = ActivityType.NORMAL;
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
    setActivityNav,
  };
}
