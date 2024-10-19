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
  setActivityNav: (newActivity: ActivityType, phraseId?: string, groupId?: string) => void;
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
  const { parsedLocation, navigateTo } = useReactiveLocation();
  const [activityGroupKey, setActivityGroupKey] = useState<string>('');

  const baseUrl = window.location.origin;

  useEffect(() => {
    const _activityGroup = parsedLocation.value.tutorialGroup || '';
    if (_activityGroup) setActivityGroupKey(_activityGroup);
  }, [parsedLocation.value.tutorialGroup])

  type NavOptions = {
    activity?: ActivityType;
    phraseKey?: string;
    groupKey?: string;
  };

  const setActivityNav = (options: NavOptions) => {
    const { activity, phraseKey, groupKey } = options;
    
    const currentPath = parsedLocation.value;
    const newActivity = activity || currentPath.activity;
    const newPhraseKey = phraseKey !== undefined ? phraseKey : currentPath.phraseId;
    const newGroupKey = groupKey !== undefined ? groupKey : currentPath.tutorialGroup;

    const encodedId = newPhraseKey ? encodeURIComponent(newPhraseKey) : '';
    const queryString = newGroupKey ? '?' + new URLSearchParams({ group: newGroupKey }) : '';
    
    let navTo = '/';
    switch (newActivity) {
      case 'game':
        navTo = `/game/${encodedId}${queryString}`;
        break;
      case 'tutorial':
        navTo = `/tutorial/${encodedId.replace('%0D','_r')}${queryString}`;
        break;
      case 'edit':
        navTo = `/edit/${encodedId}`;
        break;
      default:
        navTo = '/';
    }

    // Get the stack trace
    const stack = new Error().stack;
    // Parse the stack to get the caller information
    const caller = stack?.split('\n').slice(2, 5).join('\n').trim();
    const trimmedCaller = caller?.replaceAll(baseUrl, '').replaceAll(/\?t=\d*/g, '');
    console.log(`Nav to: ${navTo}`, `From: ${trimmedCaller}`);
    navigateTo(navTo);
  }

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
        setActivityNav({
          activity: ActivityType.GAME,
          phraseKey: getNextGamePhrase()?.key,
        })
        result = true;
        break;
      case 'tut':
        if ('r' in parsedCommand.switches) {
          resetCompletedTutorials();
        }
        decideActivityChange(ActivityType.TUTORIAL);
        const nextTutorial = getNextTutorial();
        setActivityNav({
          activity: ActivityType.TUTORIAL,
          phraseKey: nextTutorial?.phrase,
          groupKey: nextTutorial?.tutorialGroup
        })
        result = true;
        break;
      case 'edit':
        decideActivityChange(ActivityType.EDIT);
        setActivityNav({
          activity: ActivityType.EDIT,
          phraseKey: parsedCommand.args.join(''),
          groupKey: parsedCommand.switches.toString()
        })
        result = true;
        break;
      default:
        result = false;
    }
    if(parsedLocation.value.activity === 'tutorial') 
      checkTutorialProgress(parsedCommand.command);
    if(parsedLocation.value.activity === 'game' && parsedLocation.value.phraseId)
    {
      const gamePhrase = GamePhrases.getGamePhraseByKey(parsedLocation.value.phraseId)
      if(gamePhrase) checkGameProgress(gamePhrase);
    }

    return result;
  }, [decideActivityChange, parsedLocation]);

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

    const groupKey = parsedLocation.value.tutorialGroup ?? '';
    if (command) {
      if (canUnlockTutorial(command)) {
        if (groupKey) {
          const incompletePhrasesInGroup = getIncompletePhrasesByTutorialGroup(activityGroupKey)[0];
          if (incompletePhrasesInGroup) {
            activitySignal.value = ActivityType.GAME;
            setActivityNav(
              ActivityType.GAME,
              incompletePhrasesInGroup.key,
              groupKey
            );
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
      setActivityNav(
        resultActivity,
        nextTutorial?.phrase,
        nextTutorial?.tutorialGroup
      )
      return;
    }
    activitySignal.value = ActivityType.GAME;
    setActivityNav(
      ActivityType.GAME,
      GamePhrases.getGamePhrasesNotAchieved()[0].key,
      groupKey
    );
    return;
  };

  const checkGameProgress = (successPhrase: GamePhrase) => {
    const groupKey = parsedLocation.value.tutorialGroup ?? '';
    setCompletedGamePhrase(successPhrase.key);
    if (groupKey) {
      const nextPhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
      if (nextPhraseInGroup) {
        setGamePhrase(getNextGamePhrase());
        activitySignal.value = ActivityType.GAME;
        setActivityNav(
          ActivityType.GAME,
          nextPhraseInGroup.key,
          nextPhraseInGroup.tutorialGroup
        );
        return;
      }
      const incompleteTutorialInGroup = getIncompleteTutorialsInGroup(groupKey);
      incompleteTutorialInGroup.forEach(itig => {
        setCompletedTutorial(itig.phrase);
      });
      const nextTutorial = getNextTutorial();
      if (nextTutorial) {
        const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
        setActivityNav(
          activitySignal.value,
          nextTutorial.phrase,
          nextTutorial.tutorialGroup
        )
        return;
      }
    }

    const nextGamePhrase = GamePhrases.getGamePhrasesNotAchieved()[0];
    if (nextGamePhrase) {
      setGamePhrase(getNextGamePhrase());
      activitySignal.value = ActivityType.GAME;
      setActivityNav(
        ActivityType.GAME,
        nextGamePhrase.key,
        nextGamePhrase.tutorialGroup
      );
      isInGameModeSignal.value = true;
      return;
    }
    activitySignal.value = ActivityType.NORMAL;
    setActivityNav(ActivityType.NORMAL);
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
